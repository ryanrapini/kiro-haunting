# Custom Domain Setup Guide

This guide walks you through connecting your Namecheap domain `kiro-haunting.me` to your AWS deployment.

## Overview

Your stack now includes:
- **S3 Bucket**: Hosts your frontend files (private)
- **CloudFront**: CDN that serves your site with HTTPS
- **ACM Certificate**: SSL/TLS certificate for HTTPS
- **Custom Domain**: kiro-haunting.me and www.kiro-haunting.me

## Step 1: Deploy Updated Infrastructure

```bash
cd infrastructure
bun install
bun run cdk deploy HauntedHomeStack
```

**Important**: The deployment will pause waiting for DNS validation. Keep the terminal open and proceed to Step 2.

## Step 2: Validate Certificate in Namecheap

After running deploy, CDK will output DNS validation records. You'll see something like:

```
Certificate validation records:
_abc123.kiro-haunting.me CNAME _xyz456.acm-validations.aws
```

### Add DNS Records in Namecheap:

1. Log into Namecheap
2. Go to Domain List → kiro-haunting.me → Manage
3. Click "Advanced DNS"
4. Add a new CNAME record:
   - **Type**: CNAME Record
   - **Host**: `_abc123` (the part before .kiro-haunting.me)
   - **Value**: `_xyz456.acm-validations.aws` (the full CNAME target)
   - **TTL**: Automatic

5. Wait 5-10 minutes for DNS propagation
6. The CDK deployment will automatically continue once validated

## Step 3: Point Domain to CloudFront

After deployment completes, you'll get a CloudFront domain name like:
```
DistributionDomainName: d1234567890abc.cloudfront.net
```

### Update Namecheap DNS:

1. In Namecheap Advanced DNS, add these records:

   **For root domain (kiro-haunting.me):**
   - **Type**: CNAME Record
   - **Host**: `@`
   - **Value**: `d1234567890abc.cloudfront.net` (your CloudFront domain)
   - **TTL**: Automatic

   **For www subdomain:**
   - **Type**: CNAME Record
   - **Host**: `www`
   - **Value**: `d1234567890abc.cloudfront.net` (same CloudFront domain)
   - **TTL**: Automatic

2. **Remove any existing A records** for @ and www if they exist

## Step 4: Deploy Frontend

```bash
cd frontend
bun install
bun run build

# Upload to S3
aws s3 sync dist/ s3://$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $(aws cloudformation describe-stacks \
    --stack-name HauntedHomeStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text) \
  --paths "/*"
```

## Step 5: Test Your Domain

Wait 5-15 minutes for DNS propagation, then visit:
- https://kiro-haunting.me
- https://www.kiro-haunting.me

Both should work with HTTPS!

## Troubleshooting

### Certificate validation stuck?
- Check DNS records are correct in Namecheap
- Wait 10-15 minutes for DNS propagation
- Use `dig _abc123.kiro-haunting.me` to verify CNAME is visible

### Domain not resolving?
- Check CNAME records point to CloudFront domain
- Wait 15-30 minutes for DNS propagation
- Use `dig kiro-haunting.me` to verify CNAME is visible

### 403 Forbidden error?
- Make sure you deployed frontend files to S3
- Check CloudFront distribution is enabled
- Invalidate CloudFront cache

### Mixed content warnings?
- Update frontend .env to use HTTPS API endpoints
- Ensure all API calls use HTTPS

## Quick Commands

**Get CloudFront domain:**
```bash
aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
  --output text
```

**Invalidate CloudFront cache:**
```bash
aws cloudfront create-invalidation \
  --distribution-id $(aws cloudformation describe-stacks \
    --stack-name HauntedHomeStack \
    --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
    --output text) \
  --paths "/*"
```

**Deploy frontend:**
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

## Cost Impact

Adding CloudFront and ACM:
- **ACM Certificate**: Free
- **CloudFront**: ~$1-5/month for low traffic
- **Data transfer**: First 1TB/month is $0.085/GB

Total additional cost: ~$2-10/month depending on traffic
