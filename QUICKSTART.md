# Quick Start Guide

Get the Haunted Home Orchestrator up and running quickly.

## For Local Development (No AWS Required)

1. **Run the setup script:**
   ```bash
   ./scripts/setup.sh
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Visit http://localhost:3000**

Note: Without AWS backend, you'll see the UI but won't be able to authenticate or use features yet.

## For Full AWS Deployment

### Prerequisites
- AWS Account
- AWS CLI configured
- Domain name (optional but recommended)
- OpenAI API key

### Quick Deploy

1. **Install dependencies:**
   ```bash
   ./scripts/setup.sh
   ```

2. **Configure AWS:**
   ```bash
   aws configure
   ```

3. **Store OpenAI API key:**
   ```bash
   aws ssm put-parameter \
     --name "/haunted-home/openai-api-key" \
     --value "your-api-key" \
     --type "SecureString"
   ```

4. **Deploy infrastructure:**
   ```bash
   cd infrastructure
   npm install
   cdk bootstrap  # First time only
   cdk deploy
   ```

5. **Note the outputs** (UserPoolId, ApiEndpoint, etc.)

6. **Configure and deploy frontend:**
   ```bash
   cd ../frontend
   
   # Create .env with CDK outputs
   cat > .env << EOF
   VITE_API_ENDPOINT=<your-api-endpoint>
   VITE_USER_POOL_ID=<your-user-pool-id>
   VITE_USER_POOL_CLIENT_ID=<your-client-id>
   VITE_AWS_REGION=us-east-1
   EOF
   
   npm run build
   aws s3 sync dist/ s3://<your-bucket-name>/
   ```

7. **Access your app** at the S3 website URL or custom domain

## Project Structure

```
haunted-home-orchestrator/
├── frontend/          # React app (Vite + TypeScript)
├── backend/           # Lambda functions (Node.js + TypeScript)
├── infrastructure/    # AWS CDK (TypeScript)
├── scripts/           # Helper scripts
└── .kiro/specs/       # Feature specifications
```

## Development Workflow

### Frontend Development
```bash
cd frontend
npm run dev          # Start dev server
npm test            # Run tests
npm run build       # Build for production
```

### Backend Development
```bash
cd backend
npm run build       # Compile TypeScript
npm test           # Run tests
npm run package    # Package for Lambda
```

### Infrastructure Changes
```bash
cd infrastructure
cdk diff           # Preview changes
cdk deploy         # Deploy changes
```

## Common Tasks

### Add a new Lambda function
1. Create handler in `backend/src/handlers/`
2. Add to CDK stack in `infrastructure/lib/haunted-home-stack.ts`
3. Deploy: `cd infrastructure && cdk deploy`

### Update frontend styling
1. Edit components in `frontend/src/`
2. Modify Tailwind config in `frontend/tailwind.config.js`
3. Test locally: `npm run dev`

### View logs
```bash
# API Gateway logs
aws logs tail /aws/apigateway/HauntedHomeAPI --follow

# Lambda logs
aws logs tail /aws/lambda/<function-name> --follow
```

## Troubleshooting

### "Command not found: cdk"
```bash
npm install -g aws-cdk
```

### "Unable to resolve AWS account"
```bash
aws configure
aws sts get-caller-identity
```

### Frontend can't connect to API
1. Check .env file has correct API endpoint
2. Verify CORS is configured in API Gateway
3. Check browser console for errors

### Lambda function errors
1. Check CloudWatch Logs
2. Verify environment variables
3. Ensure IAM permissions are correct

## Next Steps

- Read the full [Deployment Guide](infrastructure/DEPLOYMENT.md)
- Review [Requirements](. kiro/specs/haunted-home-orchestrator/requirements.md)
- Check [Design Document](.kiro/specs/haunted-home-orchestrator/design.md)
- Follow [Implementation Tasks](.kiro/specs/haunted-home-orchestrator/tasks.md)

## Getting Help

- Check AWS CloudWatch Logs for errors
- Review CDK outputs for configuration values
- Ensure all environment variables are set correctly
- Verify AWS credentials have necessary permissions

## Cost Estimate

Running this application costs approximately $5-25/month depending on usage:
- DynamoDB: $1-5/month
- Lambda: $1-10/month
- S3 + CloudFront: $1-5/month
- Route 53: $0.50/month
- Cognito: Free tier

Most development work stays within AWS free tier limits.
