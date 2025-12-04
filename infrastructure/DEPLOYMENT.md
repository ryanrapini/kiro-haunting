# Deployment Guide

This guide walks through deploying the Haunted Home Orchestrator to AWS.

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] Node.js 20+ installed
- [ ] Domain registered (kiro-haunting.me) or ready to register
- [ ] OpenAI API key obtained

## Step-by-Step Deployment

### 1. Configure AWS CLI

```bash
aws configure
```

Verify configuration:
```bash
aws sts get-caller-identity
```

### 2. Set Up Domain (Optional but Recommended)

#### Option A: Register new domain in Route 53
```bash
# Check if domain is available
aws route53domains check-domain-availability --domain-name kiro-haunting.me

# Register domain (costs ~$12/year)
aws route53domains register-domain \
  --domain-name kiro-haunting.me \
  --duration-in-years 1 \
  --admin-contact file://contact.json \
  --registrant-contact file://contact.json \
  --tech-contact file://contact.json
```

#### Option B: Use existing domain
If you already own the domain, create a hosted zone:
```bash
aws route53 create-hosted-zone \
  --name kiro-haunting.me \
  --caller-reference $(date +%s)
```

Note the hosted zone ID and name servers, then update your domain's DNS settings.

### 3. Store OpenAI API Key

```bash
aws ssm put-parameter \
  --name "/haunted-home/openai-api-key" \
  --value "sk-your-openai-api-key-here" \
  --type "SecureString" \
  --description "OpenAI API key for Haunted Home Orchestrator"
```

Verify:
```bash
aws ssm get-parameter --name "/haunted-home/openai-api-key" --with-decryption
```

### 4. Deploy Infrastructure with CDK

```bash
cd infrastructure
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Review changes
cdk diff

# Deploy
cdk deploy
```

**Important:** Save the outputs from this command! You'll need:
- UserPoolId
- UserPoolClientId
- ApiEndpoint
- FrontendBucketName

### 5. Configure Domain and SSL (If using custom domain)

After initial deployment, uncomment the Route 53 and CloudFront sections in `lib/haunted-home-stack.ts`:

1. Open `lib/haunted-home-stack.ts`
2. Find the commented section starting with `const hostedZone = route53.HostedZone.fromLookup`
3. Uncomment all code in that section
4. Deploy again:
```bash
cdk deploy
```

Wait for certificate validation (5-30 minutes). Check status:
```bash
aws acm list-certificates --region us-east-1
```

### 6. Build and Deploy Backend

```bash
cd ../backend
npm install
npm run build
npm run package

# Upload to Lambda (will be automated in future)
# For now, Lambda functions use placeholder code from CDK
```

### 7. Build and Deploy Frontend

```bash
cd ../frontend
npm install

# Create .env file with CDK outputs
cat > .env << EOF
VITE_API_ENDPOINT=<ApiEndpoint from CDK output>
VITE_USER_POOL_ID=<UserPoolId from CDK output>
VITE_USER_POOL_CLIENT_ID=<UserPoolClientId from CDK output>
VITE_AWS_REGION=us-east-1
EOF

# Build
npm run build

# Deploy to S3
aws s3 sync dist/ s3://<FrontendBucketName from CDK output>/

# If using CloudFront, invalidate cache
aws cloudfront create-invalidation \
  --distribution-id <DistributionId> \
  --paths "/*"
```

### 8. Test the Deployment

#### Test API
```bash
curl <ApiEndpoint>/auth
```

#### Test Frontend
If using custom domain:
```
https://kiro-haunting.me
```

If using S3 directly:
```
http://<FrontendBucketName>.s3-website-<region>.amazonaws.com
```

### 9. Verify All Components

- [ ] DynamoDB tables created
- [ ] Cognito User Pool created
- [ ] API Gateway endpoints responding
- [ ] Frontend loads in browser
- [ ] Can register new user
- [ ] Can login
- [ ] OpenAI API key accessible to Lambda

## Troubleshooting

### Certificate Validation Stuck

If certificate validation takes too long:
1. Check Route 53 for CNAME records
2. Verify domain DNS is pointing to Route 53 name servers
3. Wait up to 30 minutes

### Lambda Functions Not Working

1. Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/<function-name> --follow
```

2. Verify IAM permissions
3. Check environment variables are set

### Frontend Not Loading

1. Check S3 bucket policy allows public read
2. Verify CloudFront distribution is deployed
3. Check browser console for errors
4. Verify .env variables are correct

### API CORS Errors

1. Verify API Gateway CORS configuration
2. Check that frontend is using correct API endpoint
3. Ensure Authorization header is included in CORS allowed headers

## Updating the Application

### Update Infrastructure
```bash
cd infrastructure
cdk diff
cdk deploy
```

### Update Backend
```bash
cd backend
npm run build
npm run package
# Upload new function.zip to Lambda
```

### Update Frontend
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://<bucket-name>/ --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

## Cleanup

To remove all AWS resources:

```bash
cd infrastructure
cdk destroy
```

**Warning:** This will delete all data in DynamoDB tables and remove all resources. Make sure to backup any important data first.

## Cost Monitoring

Set up billing alerts:
```bash
aws budgets create-budget \
  --account-id <your-account-id> \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

Monitor costs in AWS Cost Explorer or set up CloudWatch billing alarms.
