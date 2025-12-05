# Architecture Comparison

## Three Options for Haunted Home Orchestrator

### Option 1: Original Design (DynamoDB + Cognito + ECS)
**File:** `haunted-home-stack.ts`

**Components:**
- DynamoDB (3 tables)
- Cognito User Pool
- Lambda (placeholder functions)
- ECS Fargate + ALB (commented out)
- S3 + CloudFront
- Route 53 + ACM

**Pros:**
- Fully serverless database (DynamoDB)
- Managed authentication (Cognito)
- No VPC required for DynamoDB

**Cons:**
- Complex authentication setup
- DynamoDB query limitations
- ECS + ALB adds cost and complexity
- No real-time streaming
- Browser polling required

**Cost:** $51-83/month

---

### Option 2: Simplified (RDS + ECS)
**File:** `simple-haunted-stack.ts`

**Components:**
- RDS Postgres (single database)
- Lambda (agents)
- ECS Fargate + ALB (orchestrator)
- S3 + CloudFront
- VPC with NAT Gateway

**Pros:**
- Single relational database
- Simpler auth (no Cognito)
- SQL queries easier
- Stateful orchestrator

**Cons:**
- Still has ECS + ALB cost
- NAT Gateway cost ($32/month)
- No real-time streaming
- More complex deployment

**Cost:** $51-83/month

---

### Option 3: Ultra-Simple (Lambda-Only + WebSocket) ⭐ RECOMMENDED
**File:** `ultra-simple-stack.ts`

**Components:**
- RDS Postgres (single database)
- Lambda only (no ECS)
- WebSocket API Gateway (real-time)
- SQS Queue (message streaming)
- AWS Polly (voice synthesis)
- DynamoDB (WebSocket connections only)
- VPC with VPC Endpoints (no NAT Gateway)
- S3 + CloudFront

**Pros:**
- ✅ **50% cheaper** than other options
- ✅ **Real-time streaming** via WebSocket
- ✅ **Built-in voice synthesis** (AWS Polly)
- ✅ **No ECS/ALB complexity**
- ✅ **Automatic scaling** (Lambda scales to zero)
- ✅ **Simpler deployment**
- ✅ **Single database** for all data
- ✅ **Decoupled architecture** (SQS queue)

**Cons:**
- VPC Endpoints add $21/month (can be removed)
- Lambda cold starts (minimal impact)
- WebSocket connection limits (10K concurrent, plenty for MVP)

**Cost:** $29-45/month (or $8-24/month without VPC Endpoints)

---

## Feature Comparison

| Feature | Original | Simplified | Ultra-Simple |
|---------|----------|------------|--------------|
| **Database** | DynamoDB | RDS Postgres | RDS Postgres |
| **Auth** | Cognito | Custom (RDS) | Custom (RDS) |
| **Orchestrator** | Lambda | ECS Fargate | Lambda |
| **Agents** | Lambda | Lambda | Lambda |
| **Real-time** | ❌ Polling | ❌ Polling | ✅ WebSocket |
| **Voice** | ❌ Browser TTS | ❌ Browser TTS | ✅ AWS Polly |
| **Message Queue** | ❌ None | ❌ None | ✅ SQS |
| **Cost** | $51-83 | $51-83 | $29-45 |
| **Complexity** | High | High | Low |
| **Deployment** | Complex | Complex | Simple |

---

## Recommendation: Ultra-Simple Architecture

### Why?

1. **Cost Effective**: 50% cheaper than alternatives
2. **Real-time**: WebSocket streaming eliminates polling
3. **Better UX**: AWS Polly provides high-quality voice synthesis
4. **Scalable**: Lambda scales automatically, no capacity planning
5. **Reliable**: SQS ensures message delivery
6. **Simple**: No ECS containers to manage
7. **Fast**: No cold starts for orchestrator (it's just Lambda)

### Architecture Flow

```
User clicks "Start Haunting"
  ↓
Orchestrator Lambda invokes 4 agent Lambdas in parallel
  ↓
Agents call OpenAI API and return commands
  ↓
Orchestrator sends commands to SQS queue
  ↓
Command Streamer Lambda (triggered by SQS):
  - Synthesizes speech with Polly
  - Finds user's WebSocket connection
  - Sends command + audio to browser
  ↓
Browser receives and plays audio automatically
```

### Cost Breakdown

**With VPC Endpoints (more secure):**
- RDS: $0-13/month (free tier)
- Lambda: $1-3/month
- API Gateway: $4.50/month
- SQS: $0.40/month
- DynamoDB: $0.50/month
- Polly: $1.60/month
- S3 + CloudFront: $1-3/month
- VPC Endpoints: $21/month
- **Total: $29-45/month**

**Without VPC Endpoints (cheaper):**
- Remove VPC Endpoints: -$21/month
- **Total: $8-24/month**

### Next Steps

1. Deploy `ultra-simple-stack.ts`
2. Initialize database with `database-schema.sql`
3. Implement Lambda functions
4. Test WebSocket connection
5. Build frontend with WebSocket client
6. End-to-end testing

---

## Migration Path

If you've already deployed the original stack:

1. Deploy new stack alongside (different stack name)
2. Migrate data from DynamoDB to RDS
3. Update frontend to use new API endpoints
4. Test thoroughly
5. Delete old stack

Or start fresh with the ultra-simple architecture!
