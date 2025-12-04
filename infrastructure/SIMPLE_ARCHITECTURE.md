# Simplified Haunted Home Architecture

## Overview

This is a streamlined architecture that replaces DynamoDB + Cognito with a single RDS Postgres database and uses ECS Fargate for the orchestrator instead of complex Lambda orchestration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ├──────────────────────────────────────────┐
             │                                          │
             ▼                                          ▼
    ┌────────────────┐                        ┌────────────────┐
    │   CloudFront   │                        │  API Gateway   │
    │   (Frontend)   │                        │                │
    └────────┬───────┘                        └────────┬───────┘
             │                                          │
             ▼                                          │
    ┌────────────────┐                                 │
    │   S3 Bucket    │                                 │
    │  (React App)   │                                 │
    └────────────────┘                                 │
                                                       │
                    ┌──────────────────────────────────┼────────────────┐
                    │                                  │                │
                    ▼                                  ▼                ▼
           ┌─────────────────┐              ┌──────────────┐  ┌──────────────┐
           │      ALB        │              │   Lambda     │  │   Lambda     │
           │  (Orchestrator) │              │   (Auth)     │  │  (Devices)   │
           └────────┬────────┘              └──────┬───────┘  └──────┬───────┘
                    │                              │                 │
                    ▼                              │                 │
           ┌─────────────────┐                    │                 │
           │  ECS Fargate    │                    │                 │
           │ (Orchestrator   │                    │                 │
           │   Container)    │                    │                 │
           └────────┬────────┘                    │                 │
                    │                              │                 │
                    │  Invokes                     │                 │
                    ├──────────────────────────────┼─────────────────┤
                    │                              │                 │
                    ▼                              ▼                 ▼
           ┌──────────────────────────────────────────────────────────┐
           │                    Lambda Agents                          │
           │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
           │  │  Lights  │  │  Audio   │  │    TV    │  │  Smart   ││
           │  │  Agent   │  │  Agent   │  │  Agent   │  │   Plug   ││
           │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
           └───────────────────────┬──────────────────────────────────┘
                                   │
                                   │ All connect to
                                   ▼
                          ┌─────────────────┐
                          │  RDS Postgres   │
                          │   (Database)    │
                          │                 │
                          │  • users        │
                          │  • sessions     │
                          │  • devices      │
                          │  • haunting_    │
                          │    sessions     │
                          │  • user_config  │
                          └─────────────────┘
```

## Components

### 1. Frontend (S3 + CloudFront)
- **What**: React app hosted on S3, served via CloudFront
- **Why**: Simple, cheap, scalable static hosting
- **Cost**: ~$1-5/month

### 2. API Gateway
- **What**: REST API routing requests to Lambda or ALB
- **Why**: Single entry point, handles CORS, throttling
- **Routes**:
  - `/auth/*` → Auth Lambda
  - `/devices/*` → Devices Lambda
  - `/haunting/*` → ALB → ECS Orchestrator
- **Cost**: ~$3.50 per million requests

### 3. RDS Postgres (t4g.micro)
- **What**: Single database for all data
- **Why**: 
  - Simpler than Cognito + DynamoDB
  - Relational data fits better (users → devices → sessions)
  - Easy to query and debug
  - Free tier eligible (750 hours/month)
- **Tables**: users, sessions, devices, haunting_sessions, user_config
- **Cost**: Free tier for 12 months, then ~$15/month

### 4. Lambda Functions
- **Auth Lambda**: Handle login/register, JWT generation
- **Devices Lambda**: Device CRUD, AI chat for device setup
- **Agent Lambdas**: Lights, Audio, TV, Smart Plug agents (invoked by orchestrator)
- **Why**: Serverless, pay per use, perfect for stateless operations
- **Cost**: Mostly free tier (~$1-5/month)

### 5. ECS Fargate (Orchestrator)
- **What**: Container running Node.js orchestrator service
- **Why**:
  - Long-running process during haunting sessions
  - Maintains state and coordinates agents
  - Easier to debug than Lambda Step Functions
  - Can scale to 0 when not in use
- **Size**: 0.25 vCPU, 512 MB RAM
- **Cost**: ~$0.01/hour when running (~$7/month if running 24/7, but can scale to 0)

### 6. Application Load Balancer
- **What**: Routes API Gateway requests to ECS orchestrator
- **Why**: Required for ECS Fargate with API Gateway integration
- **Cost**: ~$16/month (fixed cost)

## Data Flow

### Authentication Flow
```
User → CloudFront → API Gateway → Auth Lambda → RDS Postgres
                                      ↓
                                  JWT Token
                                      ↓
                                   User
```

### Device Setup Flow
```
User → API Gateway → Devices Lambda → OpenAI API
                          ↓
                    RDS Postgres (save devices)
```

### Haunting Flow
```
User clicks "Start" → API Gateway → ECS Orchestrator
                                          ↓
                                    Create session in RDS
                                          ↓
                                    Invoke Agent Lambdas
                                    (Lights, Audio, TV, Plug)
                                          ↓
                                    Collect commands
                                          ↓
                                    Store in RDS
                                          ↓
User polls /command → API Gateway → ECS Orchestrator → RDS
                                          ↓
                                    Return next command
```

## Cost Breakdown (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| RDS Postgres (t4g.micro) | $0-15 | Free tier for 12 months |
| ECS Fargate | $0-7 | Only when running, can scale to 0 |
| ALB | $16 | Fixed cost (biggest expense) |
| Lambda | $1-5 | Mostly free tier |
| API Gateway | $1-3 | Pay per request |
| S3 + CloudFront | $1-5 | Static hosting |
| NAT Gateway | $32 | Required for Lambda/ECS internet access |
| **Total** | **$51-83/month** | Can optimize further |

## Cost Optimization Options

### Option 1: Remove ALB (Cheapest)
- Use Lambda for orchestrator instead of ECS
- Saves $16/month (ALB cost)
- Trade-off: More complex state management

### Option 2: Remove NAT Gateway (Saves $32/month)
- Use VPC Endpoints for AWS services
- Use public subnets for Lambda (less secure)
- Trade-off: More complex networking

### Option 3: Use Aurora Serverless v2 instead of RDS
- Scales to 0 when not in use
- Cost: $0.12 per ACU-hour (can be cheaper if usage is low)
- Trade-off: Cold start delays

## Recommended Simplification

**For MVP, I recommend removing ECS + ALB entirely:**

```
Replace:
  ECS Fargate + ALB → Orchestrator

With:
  Lambda → Orchestrator (with DynamoDB for session state)
```

This saves $48/month (ALB + NAT Gateway costs) and simplifies deployment.

Would you like me to create this even simpler version?

## Security

- RDS in private subnet (no internet access)
- Lambda/ECS in private subnet with NAT Gateway for outbound
- Secrets stored in AWS Secrets Manager
- JWT tokens for authentication
- API Gateway throttling enabled

## Deployment Steps

1. Deploy CDK stack: `cdk deploy`
2. Get database credentials from Secrets Manager
3. Connect to RDS and run `database-schema.sql`
4. Store OpenAI API key in SSM Parameter Store
5. Build and deploy Lambda functions
6. Build and deploy orchestrator container to ECR
7. Build and upload frontend to S3
8. Test end-to-end

## Next Steps

1. Implement Lambda functions (auth, devices)
2. Build orchestrator container
3. Implement agent Lambdas
4. Connect frontend to API
5. Test complete flow
