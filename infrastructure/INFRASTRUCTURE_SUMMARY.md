# Infrastructure Summary

This document summarizes the AWS infrastructure created for the Haunted Home Orchestrator.

## Created Resources

### DynamoDB Tables

1. **HauntedHome-UserConfig**
   - Purpose: Store user configuration and preferences
   - Partition Key: `userId` (String)
   - Billing: Pay-per-request
   - Features: Point-in-time recovery enabled

2. **HauntedHome-Devices**
   - Purpose: Store user devices and their states
   - Partition Key: `userId` (String)
   - Sort Key: `deviceId` (String)
   - Billing: Pay-per-request
   - Features: Point-in-time recovery enabled

3. **HauntedHome-HauntingSessions**
   - Purpose: Store haunting session data and command queues
   - Partition Key: `userId` (String)
   - Sort Key: `sessionId` (String)
   - GSI: ActiveSessionsIndex (userId + isActive)
   - Billing: Pay-per-request
   - Features: Point-in-time recovery enabled

### Cognito

- **User Pool**: HauntedHomeUsers
  - Email-based authentication
  - Self-registration enabled
  - Email verification required
  - Password policy: 8+ chars, upper, lower, digits
  
- **User Pool Client**: HauntedHomeWebClient
  - Auth flows: USER_PASSWORD_AUTH, USER_SRP_AUTH
  - No client secret (for web apps)

### API Gateway

- **REST API**: Haunted Home API
- **CORS**: Enabled for all origins (configure for production)
- **Authorizer**: Cognito User Pools
- **Endpoints**:
  - POST /auth - Authentication
  - GET/POST /config - User configuration
  - GET/POST /devices - Device management
  - POST /haunting/start - Start haunting
  - POST /haunting/stop - Stop haunting
  - GET /haunting/command - Get next command (Simple Mode)

### Lambda Functions

- **Placeholder Functions**: Created by CDK
- **Runtime**: Node.js 20.x
- **Environment Variables**:
  - USER_CONFIG_TABLE
  - DEVICES_TABLE
  - HAUNTING_SESSIONS_TABLE
  - USER_POOL_ID
  - USER_POOL_CLIENT_ID
- **Permissions**:
  - DynamoDB read/write access
  - SSM parameter read access
  - CloudWatch Logs write access

### IAM

- **Lambda Execution Role**
  - DynamoDB table access
  - SSM parameter access (/haunted-home/*)
  - CloudWatch Logs access

### S3

- **Frontend Bucket**: haunted-home-frontend-{account-id}
  - Purpose: Host React frontend
  - Public access: Blocked (served via CloudFront)
  - Website hosting: Enabled
  - Error document: index.html (for SPA routing)

### Route 53 & CloudFront (Optional)

When custom domain is configured:
- **Hosted Zone**: kiro-haunting.me
- **SSL Certificate**: ACM certificate with DNS validation
- **CloudFront Distribution**: CDN for frontend
- **DNS Records**:
  - A record: kiro-haunting.me → CloudFront
  - A record: api.kiro-haunting.me → API Gateway

### Systems Manager

- **Parameter**: /haunted-home/openai-api-key
  - Type: SecureString
  - Purpose: Store OpenAI API key
  - Access: Lambda functions only

## CDK Outputs

After deployment, CDK provides these outputs:

- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito Client ID
- **ApiEndpoint**: API Gateway URL
- **FrontendBucketName**: S3 bucket name
- **UserConfigTableName**: DynamoDB table name
- **DevicesTableName**: DynamoDB table name
- **HauntingSessionsTableName**: DynamoDB table name

## Security Features

1. **Authentication**: AWS Cognito with email verification
2. **Authorization**: Cognito authorizer on API Gateway
3. **Encryption**: 
   - DynamoDB encryption at rest (default)
   - SSM SecureString for API keys
   - HTTPS for all API communication
4. **IAM**: Least privilege access for Lambda functions
5. **Point-in-time Recovery**: Enabled on all DynamoDB tables

## Monitoring & Logging

- **CloudWatch Logs**: Automatic logging for Lambda functions
- **API Gateway Logs**: Can be enabled for debugging
- **DynamoDB Metrics**: Automatic CloudWatch metrics
- **X-Ray**: Can be enabled for distributed tracing

## Cost Optimization

- **DynamoDB**: Pay-per-request billing (no idle costs)
- **Lambda**: Pay per invocation (free tier: 1M requests/month)
- **S3**: Pay for storage and transfer (minimal for static site)
- **Cognito**: Free tier: 50,000 MAUs
- **API Gateway**: Pay per request (free tier: 1M requests/month)

## Deployment Commands

```bash
# Initial deployment
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy

# Update infrastructure
cdk diff       # Preview changes
cdk deploy     # Apply changes

# Remove all resources
cdk destroy    # WARNING: Deletes all data
```

## Next Steps

1. Deploy backend Lambda functions (replace placeholders)
2. Build and deploy frontend application
3. Configure custom domain (if desired)
4. Set up monitoring and alerts
5. Implement remaining features from tasks.md

## Troubleshooting

### Deployment Fails

Check CloudFormation console for detailed error messages:
```bash
aws cloudformation describe-stack-events --stack-name HauntedHomeStack
```

### Can't Access Resources

Verify IAM permissions:
```bash
aws sts get-caller-identity
aws iam get-user
```

### Certificate Validation Stuck

Check Route 53 for validation records:
```bash
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>
```

## Maintenance

### Update OpenAI API Key

```bash
aws ssm put-parameter \
  --name "/haunted-home/openai-api-key" \
  --value "new-key" \
  --type "SecureString" \
  --overwrite
```

### View Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/<function-name> --follow

# API Gateway logs (if enabled)
aws logs tail /aws/apigateway/HauntedHomeAPI --follow
```

### Backup DynamoDB Tables

```bash
aws dynamodb create-backup \
  --table-name HauntedHome-UserConfig \
  --backup-name UserConfig-$(date +%Y%m%d)
```

## Resource Limits

- **DynamoDB**: No table limits with on-demand billing
- **Lambda**: 1000 concurrent executions (can request increase)
- **API Gateway**: 10,000 requests/second (can request increase)
- **Cognito**: 50,000 MAUs free tier

## Cleanup

To remove all resources and stop charges:

```bash
cd infrastructure
cdk destroy
```

Manual cleanup required:
- Route 53 hosted zone (if created)
- SSM parameters
- CloudWatch log groups (optional)
- S3 bucket contents (if not empty)
