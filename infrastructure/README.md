# AWS Infrastructure Setup

This directory contains the AWS infrastructure setup for the Haunted Home Orchestrator.

## Prerequisites

1. **AWS Account**: Create an AWS account at https://aws.amazon.com
2. **AWS CLI**: Install and configure AWS CLI
3. **AWS CDK**: Install AWS CDK toolkit
4. **Domain**: Register or transfer kiro-haunting.me to Route 53

## Initial Setup Steps

### 1. Configure AWS CLI

```bash
aws configure
```

Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

### 2. Install AWS CDK

```bash
npm install -g aws-cdk
```

### 3. Bootstrap CDK (First time only)

```bash
cd infrastructure
cdk bootstrap
```

### 4. Deploy Infrastructure

```bash
npm install
cdk deploy
```

## Infrastructure Components

### DynamoDB Tables

1. **UserConfig**
   - Partition Key: userId (String)
   - Stores user configuration, platform selection, theme preferences

2. **Devices**
   - Partition Key: userId (String)
   - Sort Key: deviceId (String)
   - Stores device information and selection state

3. **HauntingSessions**
   - Partition Key: userId (String)
   - Sort Key: sessionId (String)
   - Stores active and historical haunting sessions

### AWS Cognito

- User Pool for authentication
- User Pool Client for frontend integration
- Email verification enabled

### Route 53

- Hosted zone for kiro-haunting.me
- DNS records for frontend and API

### Certificate Manager

- SSL certificate for kiro-haunting.me
- SSL certificate for api.kiro-haunting.me
- Automatic DNS validation

### API Gateway

- REST API for backend Lambda functions
- Cognito authorizer integration
- CORS configuration

### Lambda Functions

- Placeholder functions created by CDK
- Actual implementation in ../backend/

### S3 + CloudFront

- S3 bucket for frontend hosting
- CloudFront distribution for CDN
- Custom domain configuration

## Manual Steps Required

### 1. Domain Setup

If you don't own kiro-haunting.me yet:

1. Register domain in Route 53 or transfer existing domain
2. Note the hosted zone ID after creation
3. Update `lib/infrastructure-stack.ts` with your hosted zone ID

### 2. Certificate Validation

After running `cdk deploy`:

1. Check AWS Certificate Manager console
2. Verify DNS validation records are created
3. Wait for certificate status to become "Issued" (can take 5-30 minutes)

### 3. OpenAI API Key

1. Get API key from https://platform.openai.com
2. Store in AWS Systems Manager Parameter Store:

```bash
aws ssm put-parameter \
  --name "/haunted-home/openai-api-key" \
  --value "your-api-key-here" \
  --type "SecureString"
```

## Useful Commands

- `cdk diff` - Compare deployed stack with current state
- `cdk synth` - Emit the synthesized CloudFormation template
- `cdk deploy` - Deploy this stack to your AWS account
- `cdk destroy` - Remove all resources (careful!)

## Cost Estimates

- DynamoDB: ~$1-5/month (on-demand pricing)
- Cognito: Free tier covers most usage
- Lambda: Free tier covers development, ~$1-10/month production
- S3 + CloudFront: ~$1-5/month
- Route 53: $0.50/month per hosted zone
- Certificate Manager: Free

**Estimated Total: $5-25/month depending on usage**
