# Quick Reference - Ultra-Simple Architecture

## 🎯 What You Have

**Lambda-only architecture with:**
- Real-time WebSocket streaming
- AWS Polly voice synthesis
- SQS message queue
- Single RDS Postgres database
- No ECS, No ALB, No NAT Gateway

**Cost:** $29-45/month (or $8-24 without VPC Endpoints)

## 📁 Key Files

| File | Purpose |
|------|---------|
| `ultra-simple-stack.ts` | CDK infrastructure code |
| `database-schema.sql` | Postgres database schema |
| `ULTRA_SIMPLE_ARCHITECTURE.md` | Detailed architecture docs |
| `ARCHITECTURE_COMPARISON.md` | Compare all 3 options |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment |
| `frontend/src/services/websocket.ts` | WebSocket client |

## 🏗️ Architecture at a Glance

```
Browser ←→ WebSocket API ←→ Lambda (WebSocket Handler)
                                    ↓
                              DynamoDB (connections)

Browser → REST API → Lambda (Auth, Devices, Orchestrator)
                        ↓
                   RDS Postgres

Orchestrator → Agent Lambdas (4) → OpenAI API
                ↓
            SQS Queue
                ↓
        Command Streamer Lambda
                ↓
        AWS Polly (voice) + WebSocket → Browser
```

## 🔧 Lambda Functions

| Function | Purpose | Timeout |
|----------|---------|---------|
| `haunted-auth` | Login/register | 30s |
| `haunted-devices` | Device CRUD + AI chat | 30s |
| `haunted-orchestrator` | Coordinate haunting | 300s |
| `haunted-agent-lights` | Generate light commands | 60s |
| `haunted-agent-audio` | Generate audio commands | 60s |
| `haunted-agent-tv` | Generate TV commands | 60s |
| `haunted-agent-plug` | Generate plug commands | 60s |
| `haunted-websocket-handler` | WebSocket connect/disconnect | 30s |
| `haunted-command-streamer` | Stream commands to browser | 60s |

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password_hash) |
| `sessions` | JWT tokens |
| `user_config` | Platform (alexa/google), mode, settings |
| `devices` | User's smart home devices |
| `haunting_sessions` | Active haunting sessions |
| `command_history` | Analytics |

**DynamoDB:**
| Table | Purpose |
|-------|---------|
| `WebSocketConnections` | Map connectionId → userId |

## 🌐 API Endpoints

### REST API
```
POST   /auth/login
POST   /auth/register
GET    /devices
POST   /devices
POST   /devices/chat
POST   /haunting/start
POST   /haunting/stop
```

### WebSocket API
```
wss://<endpoint>/prod?userId=<userId>

Messages:
  → Browser: { type: 'command', text, audio, deviceId, timestamp }
```

## 🎤 Voice Synthesis (AWS Polly)

```typescript
const polly = new PollyClient({});
const response = await polly.send(new SynthesizeSpeechCommand({
  Text: "Alexa, turn living room lights red",
  OutputFormat: 'mp3',
  VoiceId: 'Joanna',
  Engine: 'neural'
}));
```

**Cost:** $16 per 1 million characters (~$1.60 for 100K commands)

## 📦 SQS Queue

**Queue:** `haunted-home-commands`

**Message Format:**
```json
{
  "userId": "user-123",
  "sessionId": "session-456",
  "command": "Alexa, turn living room lights red",
  "deviceId": "light-1",
  "timestamp": 1234567890
}
```

## 🔐 Environment Variables

### Lambda Functions
```bash
DB_SECRET_ARN=arn:aws:secretsmanager:...
DB_NAME=haunteddb
CONNECTIONS_TABLE=HauntedHome-WebSocketConnections
COMMAND_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/.../haunted-home-commands
LIGHTS_AGENT_ARN=arn:aws:lambda:...
AUDIO_AGENT_ARN=arn:aws:lambda:...
TV_AGENT_ARN=arn:aws:lambda:...
PLUG_AGENT_ARN=arn:aws:lambda:...
WEBSOCKET_ENDPOINT=wss://xxx.execute-api.us-east-1.amazonaws.com/prod
```

### Frontend
```bash
VITE_API_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/prod/
VITE_WEBSOCKET_ENDPOINT=wss://xxx.execute-api.us-east-1.amazonaws.com/prod
```

## 🚀 Quick Deploy

```bash
# 1. Deploy infrastructure
cd infrastructure
cdk deploy UltraSimpleHauntedStack

# 2. Initialize database
psql -h <endpoint> -U postgres -d haunteddb -f database-schema.sql

# 3. Store OpenAI key
aws ssm put-parameter --name /haunted-home/openai-api-key --value "sk-..." --type SecureString

# 4. Deploy Lambda functions
cd backend
npm run build
# ... package and upload (see DEPLOYMENT_CHECKLIST.md)

# 5. Deploy frontend
cd frontend
npm run build
aws s3 sync dist/ s3://<bucket>/
```

## 🧪 Quick Test

```bash
# Test REST API
curl <ApiEndpoint>/auth/register -X POST -d '{"email":"test@test.com","password":"Test1234"}'

# Test WebSocket (in browser console)
const ws = new WebSocket('wss://<endpoint>?userId=test-123');
ws.onmessage = (e) => console.log(e.data);

# Start haunting
curl <ApiEndpoint>/haunting/start -X POST -H "Authorization: Bearer <token>"
```

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|--------------|
| RDS Postgres (t4g.micro) | $0-13 (free tier) |
| Lambda (9 functions) | $1-3 |
| API Gateway (REST + WebSocket) | $4.50 |
| SQS | $0.40 |
| DynamoDB | $0.50 |
| Polly | $1.60 |
| S3 + CloudFront | $1-3 |
| VPC Endpoints (optional) | $21 |
| **Total** | **$29-45** |

**Without VPC Endpoints:** $8-24/month

## 🐛 Debugging

```bash
# View Lambda logs
aws logs tail /aws/lambda/haunted-orchestrator --follow

# Check SQS queue
aws sqs get-queue-attributes --queue-url <url> --attribute-names All

# Query WebSocket connections
aws dynamodb scan --table-name HauntedHome-WebSocketConnections

# Check RDS
psql -h <endpoint> -U postgres -d haunteddb -c "SELECT * FROM users;"
```

## 📈 Monitoring

**CloudWatch Metrics:**
- Lambda invocations, errors, duration
- API Gateway 4xx/5xx errors
- SQS messages sent/received
- DynamoDB read/write capacity

**Alarms to Set:**
- Lambda error rate > 5%
- API Gateway 5xx errors > 10
- SQS queue depth > 100
- Monthly cost > $50

## 🔄 Data Flow

### Haunting Session Flow
```
1. User clicks "Start Haunting"
   ↓
2. POST /haunting/start → Orchestrator Lambda
   ↓
3. Query devices from RDS
   ↓
4. Invoke 4 agent Lambdas in parallel
   ↓
5. Agents call OpenAI API
   ↓
6. Orchestrator sends commands to SQS
   ↓
7. SQS triggers Command Streamer Lambda
   ↓
8. Streamer:
   - Synthesizes speech with Polly
   - Queries DynamoDB for user's WebSocket connections
   - Sends command + audio via WebSocket
   ↓
9. Browser receives and plays audio
```

## 🎨 Frontend WebSocket Usage

```typescript
import { HauntingWebSocket } from './services/websocket';

const ws = new HauntingWebSocket(
  import.meta.env.VITE_WEBSOCKET_ENDPOINT,
  userId
);

ws.onCommand((message) => {
  console.log('Command:', message.text);
  // Audio plays automatically
});

ws.onConnect(() => console.log('Connected!'));
ws.connect();
```

## 🔒 Security Checklist

- [x] RDS in isolated subnet
- [x] Lambda in public subnet (for OpenAI API access)
- [x] Secrets in Secrets Manager
- [x] JWT tokens for auth
- [x] WebSocket authenticated via userId
- [x] API Gateway throttling
- [x] CORS configured
- [ ] Enable AWS WAF (optional)
- [ ] Enable GuardDuty (optional)

## 📚 Additional Resources

- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [WebSocket API Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [AWS Polly Voices](https://docs.aws.amazon.com/polly/latest/dg/voicelist.html)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)

## 🎯 Success Metrics

- [ ] < 5% Lambda error rate
- [ ] < 100ms WebSocket latency
- [ ] < 2s command generation time
- [ ] < $50/month cost
- [ ] > 99% uptime
- [ ] 0 security incidents

---

**Need Help?** Check `DEPLOYMENT_CHECKLIST.md` for detailed steps!
