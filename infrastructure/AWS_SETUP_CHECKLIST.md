# AWS Setup Checklist

Complete this checklist to set up your AWS infrastructure for the Haunted Home Orchestrator.

## Phase 1: AWS Account Setup

- [ ] **Create AWS Account**
  - Go to https://aws.amazon.com
  - Click "Create an AWS Account"
  - Follow the registration process
  - Add payment method (required even for free tier)

- [ ] **Enable MFA (Multi-Factor Authentication)**
  - Go to IAM Console
  - Click on your username → Security credentials
  - Assign MFA device
  - Recommended: Use authenticator app (Google Authenticator, Authy)

- [ ] **Create IAM User for Development**
  - Go to IAM Console → Users → Add user
  - Username: `haunted-home-dev`
  - Access type: Programmatic access
  - Attach policies:
    - `AdministratorAccess` (for development)
    - Or create custom policy with minimum required permissions
  - Save Access Key ID and Secret Access Key

## Phase 2: AWS CLI Configuration

- [ ] **Install AWS CLI**
  - macOS: `brew install awscli`
  - Linux: `sudo apt-get install awscli`
  - Windows: Download from https://aws.amazon.com/cli/
  - Verify: `aws --version`

- [ ] **Configure AWS CLI**
  ```bash
  aws configure
  ```
  - AWS Access Key ID: [from IAM user]
  - AWS Secret Access Key: [from IAM user]
  - Default region: `us-east-1` (recommended for ACM certificates)
  - Default output format: `json`

- [ ] **Verify Configuration**
  ```bash
  aws sts get-caller-identity
  ```
  Should show your account ID and user ARN

## Phase 3: Domain Setup (Optional but Recommended)

### Option A: Register New Domain in Route 53

- [ ] **Check Domain Availability**
  ```bash
  aws route53domains check-domain-availability --domain-name kiro-haunting.me
  ```

- [ ] **Register Domain**
  - Cost: ~$12/year for .me domain
  - Can be done via AWS Console or CLI
  - Requires contact information

### Option B: Use Existing Domain

- [ ] **Create Hosted Zone**
  ```bash
  aws route53 create-hosted-zone \
    --name kiro-haunting.me \
    --caller-reference $(date +%s)
  ```

- [ ] **Update Domain Name Servers**
  - Note the 4 name servers from hosted zone
  - Update at your domain registrar
  - Wait for DNS propagation (up to 48 hours)

- [ ] **Verify DNS Propagation**
  ```bash
  dig kiro-haunting.me NS
  ```

### Option C: Skip Domain (Use AWS URLs)

- [ ] **Note:** You can skip domain setup and use:
  - API Gateway URL for backend
  - S3 website URL or CloudFront URL for frontend
  - Comment out domain-related code in CDK stack

## Phase 4: OpenAI API Setup

- [ ] **Get OpenAI API Key**
  - Go to https://platform.openai.com
  - Sign up or log in
  - Navigate to API Keys
  - Create new secret key
  - Copy and save securely

- [ ] **Store in AWS Systems Manager**
  ```bash
  aws ssm put-parameter \
    --name "/haunted-home/openai-api-key" \
    --value "sk-your-actual-key-here" \
    --type "SecureString" \
    --description "OpenAI API key for Haunted Home"
  ```

- [ ] **Verify Storage**
  ```bash
  aws ssm get-parameter \
    --name "/haunted-home/openai-api-key" \
    --with-decryption
  ```

## Phase 5: CDK Setup

- [ ] **Install AWS CDK**
  ```bash
  npm install -g aws-cdk
  ```

- [ ] **Verify Installation**
  ```bash
  cdk --version
  ```

- [ ] **Bootstrap CDK** (First time only per account/region)
  ```bash
  cd infrastructure
  cdk bootstrap
  ```
  This creates necessary S3 buckets and IAM roles

## Phase 6: Deploy Infrastructure

- [ ] **Install Dependencies**
  ```bash
  cd infrastructure
  npm install
  ```

- [ ] **Review Stack**
  ```bash
  cdk synth
  ```
  This generates CloudFormation template

- [ ] **Preview Changes**
  ```bash
  cdk diff
  ```

- [ ] **Deploy Stack**
  ```bash
  cdk deploy
  ```
  - Review changes
  - Type 'y' to confirm
  - Wait for deployment (5-10 minutes)

- [ ] **Save Outputs**
  Copy these values from the deployment output:
  - UserPoolId: `__________________`
  - UserPoolClientId: `__________________`
  - ApiEndpoint: `__________________`
  - FrontendBucketName: `__________________`
  - UserConfigTableName: `__________________`
  - DevicesTableName: `__________________`
  - HauntingSessionsTableName: `__________________`

## Phase 7: Verify Infrastructure

- [ ] **Check DynamoDB Tables**
  ```bash
  aws dynamodb list-tables
  ```
  Should show: HauntedHome-UserConfig, HauntedHome-Devices, HauntedHome-HauntingSessions

- [ ] **Check Cognito User Pool**
  ```bash
  aws cognito-idp list-user-pools --max-results 10
  ```

- [ ] **Check API Gateway**
  ```bash
  aws apigateway get-rest-apis
  ```

- [ ] **Check S3 Bucket**
  ```bash
  aws s3 ls | grep haunted-home
  ```

- [ ] **Test API Endpoint**
  ```bash
  curl <ApiEndpoint>/auth
  ```
  Should return placeholder response

## Phase 8: SSL Certificate (If Using Custom Domain)

- [ ] **Uncomment Domain Code**
  - Edit `infrastructure/lib/haunted-home-stack.ts`
  - Uncomment Route 53 and CloudFront sections
  - Update hosted zone domain name if different

- [ ] **Deploy Again**
  ```bash
  cdk deploy
  ```

- [ ] **Wait for Certificate Validation**
  - Check AWS Certificate Manager console
  - Validation can take 5-30 minutes
  - DNS validation records are created automatically

- [ ] **Verify Certificate**
  ```bash
  aws acm list-certificates --region us-east-1
  ```
  Status should be "ISSUED"

## Phase 9: Set Up Billing Alerts

- [ ] **Enable Billing Alerts**
  - Go to AWS Billing Console
  - Preferences → Receive Billing Alerts
  - Enable

- [ ] **Create Budget**
  - Go to AWS Budgets
  - Create budget
  - Set monthly limit (e.g., $25)
  - Add email notification at 80% and 100%

- [ ] **Set Up Cost Explorer**
  - Enable AWS Cost Explorer
  - Review estimated monthly costs

## Phase 10: Security Best Practices

- [ ] **Review IAM Policies**
  - Ensure least privilege access
  - Remove AdministratorAccess if not needed
  - Create specific policies for production

- [ ] **Enable CloudTrail**
  - Go to CloudTrail console
  - Create trail for audit logging
  - Store logs in S3

- [ ] **Enable GuardDuty** (Optional)
  - Go to GuardDuty console
  - Enable threat detection
  - Free 30-day trial

- [ ] **Review Security Groups**
  - Ensure no unnecessary ports are open
  - API Gateway handles all external access

## Troubleshooting

### CDK Bootstrap Fails
- Ensure AWS credentials are configured correctly
- Check IAM permissions
- Try specifying region: `cdk bootstrap aws://ACCOUNT-ID/REGION`

### Certificate Validation Stuck
- Verify domain DNS points to Route 53
- Check Route 53 for CNAME validation records
- Wait up to 30 minutes

### Deployment Fails
- Check CloudFormation console for detailed errors
- Review IAM permissions
- Ensure region is correct (us-east-1 recommended)

### Can't Access API
- Verify API Gateway deployment
- Check CORS configuration
- Test with curl first before frontend

## Next Steps

After completing this checklist:

1. ✅ Deploy backend Lambda functions (Task 2)
2. ✅ Deploy frontend application (Task 3)
3. ✅ Test end-to-end functionality
4. ✅ Begin implementing features from tasks.md

## Cleanup (When Done)

To remove all resources and stop charges:

```bash
cd infrastructure
cdk destroy
```

**Warning:** This deletes all data. Backup first if needed.

Also manually delete:
- Route 53 hosted zone (if created)
- SSM parameters
- CloudWatch log groups (if desired)
