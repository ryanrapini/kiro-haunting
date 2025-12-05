# Custom Domain Quick Reference

## 🚀 One-Command Deployment

```bash
./scripts/deploy-with-domain.sh
```

This script will:
1. Deploy infrastructure with CloudFront + ACM certificate
2. Prompt you to add DNS records in Namecheap
3. Build and deploy your frontend
4. Invalidate CloudFront cache

## 📋 Manual Steps Summary

### 1. Deploy Infrastructure
```bash
cd infrastructure
bun run cdk deploy HauntedHomeStack
```

### 2. Add DNS Records in Namecheap

**Certificate Validation (one-time):**
- Type: CNAME
- Host: `_abc123` (from CDK output)
- Value: `_xyz456.acm-validations.aws` (from CDK output)

**Domain Pointing:**
- Type: CNAME, Host: `@`, Value: `d123.cloudfront.net`
- Type: CNAME, Host: `www`, Value: `d123.cloudfront.net`

### 3. Deploy Frontend
```bash
cd frontend
bun run build
aws s3 sync dist/ s3://YOUR-BUCKET-NAME/
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

## 🔍 Get Stack Outputs

```bash
# CloudFront domain
aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
  --output text

# Bucket name
aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text

# Distribution ID
aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text
```

## 🔄 Update Frontend (After Initial Setup)

```bash
cd frontend && bun run build && \
aws s3 sync dist/ s3://$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)/ && \
aws cloudfront create-invalidation \
  --distribution-id $(aws cloudformation describe-stacks \
    --stack-name HauntedHomeStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text) \
  --paths "/*"
```

## 🐛 Troubleshooting

**Certificate stuck validating?**
```bash
# Check if DNS record is visible
dig _abc123.kiro-haunting.me CNAME
```

**Domain not resolving?**
```bash
# Check if CNAME is visible
dig kiro-haunting.me
dig www.kiro-haunting.me
```

**403 Forbidden?**
- Deploy frontend files to S3
- Invalidate CloudFront cache
- Wait 5-10 minutes

## 📊 DNS Records Checklist

In Namecheap Advanced DNS, you should have:

- [ ] `_abc123` → `_xyz456.acm-validations.aws` (CNAME, for certificate)
- [ ] `@` → `d123.cloudfront.net` (CNAME, for root domain)
- [ ] `www` → `d123.cloudfront.net` (CNAME, for www subdomain)

## 🌐 Your URLs

- Production: https://kiro-haunting.me
- WWW: https://www.kiro-haunting.me
- CloudFront: https://d123.cloudfront.net (backup)

## 💰 Cost Impact

- ACM Certificate: **Free**
- CloudFront: **~$1-5/month**
- Total additional: **~$2-10/month**

## 📚 Full Documentation

See [infrastructure/DOMAIN_SETUP.md](infrastructure/DOMAIN_SETUP.md) for detailed instructions.
