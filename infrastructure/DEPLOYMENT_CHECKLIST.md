# Deployment Checklist - Ultra-Simple Architecture

## Prerequisites

- [ ] AWS Account (ID: 358414165101)
- [ ] AWS CLI configured with credentials
- [ ] Node.js 20+ installed
- [ ] Bun or npm installed
- [ ] OpenAI API key

## Step 1: Deploy Infrastructure (15 minutes)

```bash
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://358414165101/us-east-1

# Review what will be created
cdk diff UltraSimpleHauntedStack

# Deploy the stack
cdk deploy UltraSimpleHauntedStack

# Save the outputs!
# - ApiEndpoint
# - WebSocketEndpoint
# - DatabaseEndpoint
# - DatabaseSecretArn
# - CommandQueueUrl
# - FrontendBucketName
```

**Expected time:** 10-15 minutes (RDS takes longest)

## Step 2: Initialize Database (5 minutes)

```bash
# Get database credentials
aws secretsmanager get-secret-value \
  --secret-id <DatabaseSecretArn from outputs> \
  --query SecretString \
  --output text | jq -r

# Connect to database (use password from above)
psql -h <DatabaseEndpoint> -U postgres -d haunteddb

# Run schema
\i database-schema.sql

# Verify tables
\dt

# Exit
\q
```

**Expected tables:**
- users
- sessions
- user_config
- devices
- haunting_sessions
- command_history

## Step 3: Store OpenAI API Key (1 minute)

```bash
# Store your OpenAI API key
aws ssm put-parameter \
  --name /haunted-home/openai-api-key \
  --value "sk-your-key-here" \
  --type SecureString \
  --region us-east-1

# Verify
aws ssm get-parameter \
  --name /haunted-home/openai-api-key \
  --with-decryption \
  --region us-east-1
```

## Step 4: Implement Lambda Functions (Development)

### Auth Lambda (`backend/src/handlers/auth.ts`)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Get DB credentials from Secrets Manager
  // Connect to Postgres
  // Handle login/register
  // Return JWT token
};
```

### Devices Lambda (`backend/src/handlers/devices.ts`)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import OpenAI from 'openai';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle device CRUD
  // Handle AI chat for device setup
  // Call OpenAI API
  // Save devices to RDS
};
```

### Orchestrator Lambda (`backend/src/handlers/orchestrator.ts`)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Query user's devices from RDS
  // Group by device type
  // Invoke agent Lambdas in parallel
  // Collect commands
  // Send to SQS queue
};
```

### Agent Lambdas (`backend/src/handlers/agents/*.ts`)

```typescript
import { Handler } from 'aws-lambda';
import OpenAI from 'openai';

export const handler: Handler = async (event) => {
  // Get devices from event
  // Call OpenAI with specialized prompt
  // Parse commands from response
  // Return commands
};
```

### WebSocket Handler (`backend/src/handlers/websocket.ts`)

```typescript
import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';

export const handler: APIGatewayProxyHandler = async (event) => {
  // Handle $connect: store connectionId + userId in DynamoDB
  // Handle $disconnect: remove connectionId from DynamoDB
};
```

### Command Streamer (`backend/src/handlers/streamer.ts`)

```typescript
import { SQSHandler } from 'aws-lambda';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

export const handler: SQSHandler = async (event) => {
  // For each SQS message:
  //   1. Synthesize speech with Polly
  //   2. Convert to base64
  //   3. Find user's WebSocket connections
  //   4. Send command + audio via WebSocket
};
```

## Step 5: Build and Deploy Lambda Functions

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Package each Lambda function
cd dist
zip -r auth.zip auth.js node_modules/
zip -r devices.zip devices.js node_modules/
zip -r orchestrator.zip orchestrator.js node_modules/
zip -r lights-agent.zip agents/lights.js node_modules/
zip -r audio-agent.zip agents/audio.js node_modules/
zip -r tv-agent.zip agents/tv.js node_modules/
zip -r plug-agent.zip agents/plug.js node_modules/
zip -r websocket.zip websocket.js node_modules/
zip -r streamer.zip streamer.js node_modules/

# Update Lambda functions
aws lambda update-function-code \
  --function-name haunted-auth \
  --zip-file fileb://auth.zip

aws lambda update-function-code \
  --function-name haunted-devices \
  --zip-file fileb://devices.zip

aws lambda update-function-code \
  --function-name haunted-orchestrator \
  --zip-file fileb://orchestrator.zip

aws lambda update-function-code \
  --function-name haunted-agent-lights \
  --zip-file fileb://lights-agent.zip

aws lambda update-function-code \
  --function-name haunted-agent-audio \
  --zip-file fileb://audio-agent.zip

aws lambda update-function-code \
  --function-name haunted-agent-tv \
  --zip-file fileb://tv-agent.zip

aws lambda update-function-code \
  --function-name haunted-agent-plug \
  --zip-file fileb://plug-agent.zip

aws lambda update-function-code \
  --function-name haunted-websocket-handler \
  --zip-file fileb://websocket.zip

aws lambda update-function-code \
  --function-name haunted-command-streamer \
  --zip-file fileb://streamer.zip
```

## Step 6: Build and Deploy Frontend

```bash
cd frontend

# Create .env file with API endpoints
cat > .env << EOF
VITE_API_ENDPOINT=<ApiEndpoint from CDK outputs>
VITE_WEBSOCKET_ENDPOINT=<WebSocketEndpoint from CDK outputs>
EOF

# Install dependencies
npm install

# Build for production
npm run build

# Upload to S3
aws s3 sync dist/ s3://<FrontendBucketName>/ --delete

# If using CloudFront, invalidate cache
aws cloudfront create-invalidation \
  --distribution-id <DistributionId> \
  --paths "/*"
```

## Step 7: Test End-to-End

### Test 1: Authentication
```bash
# Register user
curl -X POST <ApiEndpoint>/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Login
curl -X POST <ApiEndpoint>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

### Test 2: WebSocket Connection
```javascript
// In browser console
const ws = new WebSocket('wss://<WebSocketEndpoint>?userId=test-user-123');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Test 3: Device Setup
```bash
# Add device
curl -X POST <ApiEndpoint>/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"light","name":"Living Room Light","formalName":"living room light"}'
```

### Test 4: Start Haunting
```bash
# Start haunting session
curl -X POST <ApiEndpoint>/haunting/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"theme":"classic","intensity":5}'

# Watch WebSocket for commands!
```

### Test 5: Check Logs
```bash
# View Lambda logs
aws logs tail /aws/lambda/haunted-orchestrator --follow
aws logs tail /aws/lambda/haunted-command-streamer --follow

# Check SQS queue
aws sqs get-queue-attributes \
  --queue-url <CommandQueueUrl> \
  --attribute-names ApproximateNumberOfMessages
```

## Step 8: Monitor and Debug

### CloudWatch Dashboards
- Lambda invocations
- Lambda errors
- API Gateway requests
- SQS queue depth
- WebSocket connections

### Common Issues

**Issue: Lambda can't connect to RDS**
- Check security group rules
- Verify Lambda is in correct subnet
- Check VPC endpoint configuration

**Issue: WebSocket not receiving messages**
- Check DynamoDB connections table
- Verify userId matches
- Check Command Streamer logs

**Issue: No audio playing**
- Check Polly permissions
- Verify base64 encoding
- Check browser console for errors

**Issue: OpenAI API errors**
- Verify SSM parameter exists
- Check API key is valid
- Review Lambda logs for error details

## Step 9: Cost Monitoring

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2024-12-01,End=2024-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Set up billing alert
aws cloudwatch put-metric-alarm \
  --alarm-name haunted-home-billing \
  --alarm-description "Alert when monthly cost exceeds $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold
```

## Step 10: Production Checklist

- [ ] Enable CloudFront for frontend
- [ ] Configure custom domain (Route 53)
- [ ] Enable SSL certificate (ACM)
- [ ] Set up CloudWatch alarms
- [ ] Enable RDS automated backups
- [ ] Configure Lambda reserved concurrency
- [ ] Set up API Gateway throttling
- [ ] Enable AWS WAF (optional)
- [ ] Document API endpoints
- [ ] Create runbook for common issues

## Rollback Plan

If something goes wrong:

```bash
# Destroy the stack
cdk destroy UltraSimpleHauntedStack

# Or rollback to previous version
cdk deploy UltraSimpleHauntedStack --rollback
```

## Success Criteria

✅ User can register and login  
✅ User can add devices via AI chat  
✅ User can start haunting session  
✅ Commands stream to browser in real-time  
✅ Audio plays automatically  
✅ User can stop haunting session  
✅ All Lambda functions have < 5% error rate  
✅ WebSocket connections are stable  
✅ Monthly cost is under $50  

## Next Steps After Deployment

1. Monitor CloudWatch metrics
2. Gather user feedback
3. Optimize Lambda memory/timeout
4. Add more haunting themes
5. Implement Connected Mode (direct device control)
6. Add analytics and reporting
7. Improve AI prompts based on usage
8. Scale as needed

---

**Estimated Total Deployment Time:** 2-3 hours (first time)

**Estimated Monthly Cost:** $29-45 (or $8-24 without VPC Endpoints)
