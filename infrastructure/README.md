# Ultra-Simple AWS Deployment

This is a minimal AWS infrastructure for the Haunted Home Orchestrator MVP.

## What Gets Deployed

- **DynamoDB**: 3 tables for user config, devices, and sessions
- **Cognito**: User authentication (email + password)
- **API Gateway**: REST API with placeholder Lambda
- **S3**: Public website hosting for frontend
- **Lambda**: Placeholder function (will be replaced with actual code)

## Prerequisites

1. AWS account
2. AWS CLI configured (`aws configure`)
3. OpenRouter API key

## Deploy in 3 Steps

### 1. Store OpenRouter API Key

```bash
aws ssm put-parameter \
  --name "/haunted-home/openrouter-api-key" \
  --value "your-openrouter-key-here" \
  --type "SecureString"
```

### 2. Deploy Infrastructure

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy
```

Save the outputs! You'll need:
- `UserPoolId`
- `UserPoolClientId`
- `ApiEndpoint`
- `FrontendBucketName`
- `FrontendUrl`

### 3. Deploy Frontend

```bash
cd ../frontend

# Create .env with outputs from step 2
cat > .env << EOF
VITE_API_ENDPOINT=<ApiEndpoint>
VITE_USER_POOL_ID=<UserPoolId>
VITE_USER_POOL_CLIENT_ID=<UserPoolClientId>
VITE_AWS_REGION=us-east-1
EOF

npm install
npm run build
aws s3 sync dist/ s3://<FrontendBucketName>/
```

Visit the `FrontendUrl` from step 2!

## Using OpenRouter

OpenRouter provides access to many AI models at low cost. We'll use it instead of OpenAI.

**API Endpoint**: `https://openrouter.ai/api/v1`
**Recommended Model**: `meta-llama/llama-3.1-8b-instruct:free` (free!)

The backend will be configured to use OpenRouter's OpenAI-compatible API.

## Cleanup

```bash
cd infrastructure
cdk destroy
```

This removes everything and stops all charges.

## Cost

With OpenRouter's free models:
- **~$0-2/month** (DynamoDB, S3, Lambda free tier)

## Next Steps

1. Deploy infrastructure (above)
2. Implement Lambda functions (Task 2 in tasks.md)
3. Build frontend components (Task 3 in tasks.md)
