# Haunted Home Architecture

## Overview

Lambda-only architecture with real-time WebSocket streaming and AWS Polly for voice synthesis. **No ECS, No ALB, No NAT Gateway** = Maximum cost savings!

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
    │   (Frontend)   │                        │   (REST API)   │
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
           │   WebSocket     │              │   Lambda     │  │   Lambda     │
           │   API Gateway   │              │   (Auth)     │  │  (Devices)   │
           └────────┬────────┘              └──────┬───────┘  └──────┬───────┘
                    │                              │                 │
                    │                              │                 │
                    ▼                              ▼                 ▼
           ┌─────────────────┐              ┌──────────────────────────┐
           │   Lambda        │              │   RDS Postgres           │
           │   (WebSocket    │◄─────────────┤   • users                │
           │    Handler)     │              │   • sessions             │
           └────────┬────────┘              │   • devices              │
                    │                       │   • haunting_sessions    │
                    │                       └──────────────────────────┘
                    ▼
           ┌─────────────────┐
           │   DynamoDB      │
           │   (WebSocket    │
           │   Connections)  │
           └─────────────────┘


    ┌──────────────────────────────────────────────────────────────┐
    │                    Haunting Flow                              │
    └──────────────────────────────────────────────────────────────┘

    User clicks "Start Haunting"
           │
           ▼
    ┌──────────────────┐
    │   Lambda         │
    │  (Orchestrator)  │──────┐ Invokes agent Lambdas in parallel
    └────────┬─────────┘      │
             │                │
             │                ▼
             │       ┌────────────────────────────────────────┐
             │       │      Lambda Agent Functions            │
             │       │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
             │       │  │Lights│ │Audio │ │  TV  │ │ Plug │ │
             │       │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ │
             │       └─────┼────────┼────────┼────────┼──────┘
             │             │        │        │        │
             │             └────────┴────────┴────────┘
             │                      │
             │                      │ Return commands
             │                      ▼
             │              ┌───────────────┐
             └─────────────►│  SQS Queue    │
                            │  (Commands)   │
                            └───────┬───────┘
                                    │
                                    │ Triggers
                                    ▼
                            ┌───────────────┐
                            │   Lambda      │
                            │  (Command     │
                            │   Streamer)   │
                            └───────┬───────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  AWS Polly   │ │  DynamoDB    │ │  WebSocket   │
            │  (Synthesize │ │  (Find user  │ │  API Gateway │
            │   Speech)    │ │  connections)│ │  (Send to    │
            └──────┬───────┘ └──────────────┘ │   browser)   │
                   │                           └──────────────┘
                   │ MP3 audio                        │
                   └──────────────────────────────────┘
                                    │
                                    ▼
                            ┌───────────────┐
                            │   Browser     │
                            │  • Receives   │
                            │    command    │
                            │  • Plays MP3  │
                            │    audio      │
                            └───────────────┘
```

## Key Components

### 1. REST API Gateway
- Routes HTTP requests to Lambda functions
- Handles CORS
- Endpoints: `/auth/*`, `/devices/*`, `/haunting/*`

### 2. WebSocket API Gateway
- Real-time bidirectional communication
- Browser connects on page load
- Receives commands as they're generated
- Automatically handles connection lifecycle

### 3. Lambda Functions

**Auth Lambda** (`haunted-auth`)
- User registration and login
- JWT token generation
- Password hashing with bcrypt

**Devices Lambda** (`haunted-devices`)
- Device CRUD operations
- AI chat for device setup (OpenAI)
- Device categorization

**Orchestrator Lambda** (`haunted-orchestrator`)
- Coordinates haunting session
- Invokes agent Lambdas in parallel
- Sends commands to SQS queue

**Agent Lambdas** (4 functions)
- `haunted-agent-lights`: Generates light commands
- `haunted-agent-audio`: Generates speaker commands
- `haunted-agent-tv`: Generates TV commands
- `haunted-agent-plug`: Generates smart plug commands
- Each calls OpenAI API with specialized prompts

**WebSocket Handler Lambda** (`haunted-websocket-handler`)
- Handles WebSocket connect/disconnect
- Stores connection IDs in DynamoDB

**Command Streamer Lambda** (`haunted-command-streamer`)
- Triggered by SQS messages
- Synthesizes speech with AWS Polly
- Sends command + audio to browser via WebSocket

### 4. SQS Queue
- Decouples command generation from delivery
- Ensures reliable message delivery
- Dead letter queue for failed messages
- Triggers Command Streamer Lambda

### 5. AWS Polly
- Neural TTS engine (high quality)
- Converts command text to MP3 audio
- Voice: "Joanna" (female, natural sounding)
- Cost: $16 per 1 million characters

### 6. DynamoDB
- **WebSocketConnections table**: Maps connectionId → userId
- Enables finding all connections for a user
- TTL for automatic cleanup (1 hour)

### 7. RDS Postgres
- Users, sessions, devices, haunting_sessions
- In isolated subnet (no internet access)
- t4g.micro (free tier eligible)

### 8. VPC Setup (Cost Optimized)
- **No NAT Gateway!** (saves $32/month)
- VPC Endpoints for AWS services (Secrets Manager, SQS, DynamoDB)
- Lambda in public subnet with internet gateway
- RDS in isolated subnet

## Data Flow: Complete Haunting Session

### 1. User Starts Haunting
```
Browser → REST API → Orchestrator Lambda
                           ↓
                    Query devices from RDS
                           ↓
                    Group by device type
                           ↓
                    Invoke 4 agent Lambdas in parallel
```

### 2. Agents Generate Commands
```
Each Agent Lambda:
  ↓
  Call OpenAI API with specialized prompt
  ↓
  Parse response for commands
  ↓
  Return commands to orchestrator
```

### 3. Commands Queued
```
Orchestrator Lambda:
  ↓
  Collect all commands from agents
  ↓
  Send each command to SQS queue
  ↓
  Return success to browser
```

### 4. Commands Streamed to Browser
```
SQS Queue → Command Streamer Lambda
                ↓
         Synthesize speech with Polly
                ↓
         Convert audio to base64
                ↓
         Query DynamoDB for user's WebSocket connections
                ↓
         Send via WebSocket API Gateway
                ↓
         Browser receives: { text, audio, deviceId }
                ↓
         Browser plays MP3 audio
```

## WebSocket Message Format

### Browser → Server (Connect)
```javascript
const ws = new WebSocket('wss://xxx.execute-api.us-east-1.amazonaws.com/prod?userId=user-123');
```

### Server → Browser (Command)
```json
{
  "type": "command",
  "text": "Alexa, turn living room lights red",
  "deviceId": "light-1",
  "audio": "base64-encoded-mp3-data",
  "timestamp": 1234567890
}
```

### Browser Handling
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Display text
  console.log(data.text);
  
  // Play audio
  const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
  audio.play();
};
```

## Cost Breakdown (Monthly)

| Service | Usage | Cost | Notes |
|---------|-------|------|-------|
| RDS Postgres (t4g.micro) | 750 hours | $0 | Free tier for 12 months, then $13/month |
| Lambda | 1M requests, 512MB, 5s avg | $1-3 | Mostly free tier |
| API Gateway (REST) | 1M requests | $3.50 | $3.50 per million |
| API Gateway (WebSocket) | 1M messages | $1.00 | $1.00 per million |
| SQS | 1M requests | $0.40 | $0.40 per million |
| DynamoDB | 1M reads/writes | $0.50 | On-demand pricing |
| Polly | 100K characters | $1.60 | $16 per 1M characters |
| S3 + CloudFront | 10GB transfer | $1-3 | Static hosting |
| VPC Endpoints | 3 endpoints | $21 | $7/month per endpoint |
| **Total** | | **$29-45/month** | |

## Further Cost Optimization

### Option 1: Remove VPC Endpoints (saves $21/month)
- Use Lambda in public subnet
- Access AWS services via internet
- Trade-off: Slightly less secure, but fine for MVP

### Option 2: Use Aurora Serverless v2 (variable cost)
- Scales to 0 when not in use
- Cost: $0.12 per ACU-hour
- Good if usage is sporadic

### Option 3: Use DynamoDB instead of RDS (saves $13/month)
- Replace Postgres with DynamoDB
- Trade-off: More complex queries, no SQL

### **Recommended for MVP: Option 1**
Remove VPC Endpoints → **Total cost: $8-24/month**

## Security

✅ RDS in isolated subnet (no internet)  
✅ Lambda in public subnet (internet access for OpenAI API)  
✅ Secrets in AWS Secrets Manager  
✅ JWT tokens for authentication  
✅ WebSocket connections authenticated via userId  
✅ API Gateway throttling enabled  
✅ CORS configured  

## Testing

### Test WebSocket Connection
```javascript
const ws = new WebSocket('wss://xxx.execute-api.us-east-1.amazonaws.com/prod?userId=test-user');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Received:', event.data);
ws.onerror = (error) => console.error('Error:', error);
```

### Test Command Flow
1. Start haunting via REST API
2. Watch CloudWatch Logs for orchestrator
3. Check SQS queue for messages
4. Verify WebSocket receives commands
5. Confirm audio plays in browser
