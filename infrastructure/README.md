# Haunted Home Infrastructure

Lambda-only AWS architecture with real-time WebSocket streaming and AWS Polly voice synthesis.

## Quick Start

### 1. Deploy Infrastructure

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy UltraSimpleHauntedStack
```

Save the outputs:
- `ApiEndpoint`
- `WebSocketEndpoint`
- `DatabaseEndpoint`
- `DatabaseSecretArn`
- `CommandQueueUrl`
- `FrontendBucketName`

### 2. Initialize Database

```bash
# Get database credentials
aws secretsmanager get-secret-value --secret-id <DatabaseSecretArn>

# Connect and run schema
psql -h <DatabaseEndpoint> -U postgres -d haunteddb -f database-schema.sql
```

### 3. Store OpenAI API Key

```bash
aws ssm put-parameter \
  --name /haunted-home/openai-api-key \
  --value "sk-..." \
  --type SecureString
```

### 4. Deploy Frontend

```bash
cd frontend

# Create .env with API endpoints
cat > .env << EOF
VITE_API_ENDPOINT=<ApiEndpoint>
VITE_WEBSOCKET_ENDPOINT=<WebSocketEndpoint>
EOF

npm install
npm run build
aws s3 sync dist/ s3://<FrontendBucketName>/
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

**Key Features:**
- Lambda-only (no ECS/ALB)
- Real-time WebSocket streaming
- AWS Polly voice synthesis
- SQS message queue
- RDS Postgres database
- Cost: $29-45/month (or $8-24 without VPC Endpoints)

## Lambda Functions

| Function | Purpose |
|----------|---------|
| `haunted-auth` | User authentication |
| `haunted-devices` | Device management + AI chat |
| `haunted-orchestrator` | Coordinate haunting sessions |
| `haunted-agent-lights` | Generate light commands |
| `haunted-agent-audio` | Generate audio commands |
| `haunted-agent-tv` | Generate TV commands |
| `haunted-agent-plug` | Generate plug commands |
| `haunted-websocket-handler` | WebSocket connections |
| `haunted-command-streamer` | Stream commands to browser |

## API Endpoints

**REST API:**
- `POST /auth/login`
- `POST /auth/register`
- `GET /devices`
- `POST /devices`
- `POST /devices/chat`
- `POST /haunting/start`
- `POST /haunting/stop`

**WebSocket API:**
- `wss://<endpoint>/prod?userId=<userId>`

## Cleanup

```bash
cd infrastructure
cdk destroy UltraSimpleHauntedStack
```

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture and data flow
- [database-schema.sql](./database-schema.sql) - Database schema
