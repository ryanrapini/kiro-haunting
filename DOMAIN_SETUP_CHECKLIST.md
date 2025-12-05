# Domain Setup Checklist

Use this checklist to track your progress setting up kiro-haunting.me with AWS.

## Pre-Deployment

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Bun installed (`bun --version`)
- [ ] Domain purchased (kiro-haunting.me) ✅
- [ ] Access to Namecheap DNS settings

## Step 1: Deploy Infrastructure

- [ ] Run `cd infrastructure && bun install`
- [ ] Run `bun run cdk bootstrap` (first time only)
- [ ] Run `bun run cdk deploy HauntedHomeStack`
- [ ] Save CloudFront domain from output (e.g., `d1234.cloudfront.net`)
- [ ] Save Distribution ID from output
- [ ] Save S3 bucket name from output

## Step 2: Certificate Validation

- [ ] Copy validation CNAME record from CDK output
  - Host: `_abc123`
  - Value: `_xyz456.acm-validations.aws`
- [ ] Log into Namecheap
- [ ] Go to Domain List → kiro-haunting.me → Manage
- [ ] Click "Advanced DNS"
- [ ] Add CNAME record for certificate validation
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Verify with: `dig _abc123.kiro-haunting.me CNAME`
- [ ] Wait for CDK deployment to complete (auto-continues after validation)

## Step 3: Point Domain to CloudFront

- [ ] In Namecheap Advanced DNS, add root domain CNAME:
  - Type: CNAME Record
  - Host: `@`
  - Value: `d1234.cloudfront.net` (your CloudFront domain)
  - TTL: Automatic
- [ ] Add www subdomain CNAME:
  - Type: CNAME Record
  - Host: `www`
  - Value: `d1234.cloudfront.net` (same CloudFront domain)
  - TTL: Automatic
- [ ] Remove any existing A records for @ and www
- [ ] Wait 5-15 minutes for DNS propagation
- [ ] Verify with: `dig kiro-haunting.me` and `dig www.kiro-haunting.me`

## Step 4: Deploy Frontend

- [ ] Run `cd frontend && bun install`
- [ ] Run `bun run build`
- [ ] Upload to S3: `aws s3 sync dist/ s3://YOUR-BUCKET-NAME/`
- [ ] Invalidate cache: `aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"`
- [ ] Wait 1-2 minutes for invalidation to complete

## Step 5: Test

- [ ] Visit https://kiro-haunting.me (should load with HTTPS)
- [ ] Visit https://www.kiro-haunting.me (should load with HTTPS)
- [ ] Check certificate is valid (green lock icon in browser)
- [ ] Test navigation (client-side routing should work)
- [ ] Check browser console for errors

## Verification Commands

Run these to verify everything is working:

```bash
# Check DNS resolution
dig kiro-haunting.me
dig www.kiro-haunting.me

# Check HTTPS
curl -I https://kiro-haunting.me
curl -I https://www.kiro-haunting.me

# Check certificate
openssl s_client -connect kiro-haunting.me:443 -servername kiro-haunting.me < /dev/null

# Get stack outputs
aws cloudformation describe-stacks --stack-name HauntedHomeStack
```

## Troubleshooting

### Certificate validation stuck?
- [ ] Verify CNAME record in Namecheap
- [ ] Check DNS with `dig _abc123.kiro-haunting.me CNAME`
- [ ] Wait 10-15 minutes for propagation
- [ ] Check AWS Certificate Manager console for status

### Domain not resolving?
- [ ] Verify CNAME records in Namecheap (@ and www)
- [ ] Check DNS with `dig kiro-haunting.me`
- [ ] Wait 15-30 minutes for propagation
- [ ] Try from different network (mobile data)

### 403 Forbidden?
- [ ] Verify frontend files uploaded to S3
- [ ] Check S3 bucket has files: `aws s3 ls s3://YOUR-BUCKET/`
- [ ] Invalidate CloudFront cache
- [ ] Wait 5-10 minutes

### Mixed content warnings?
- [ ] Update frontend .env to use HTTPS API endpoints
- [ ] Rebuild and redeploy frontend
- [ ] Clear browser cache

## Post-Deployment

- [ ] Bookmark CloudFront distribution ID
- [ ] Bookmark S3 bucket name
- [ ] Save deployment commands for future updates
- [ ] Set up CloudWatch alarms (optional)
- [ ] Configure monitoring (optional)

## Future Updates

For frontend updates, use:

```bash
./scripts/update-frontend.sh
```

Or manually:

```bash
cd frontend && bun run build && \
aws s3 sync dist/ s3://YOUR-BUCKET/ && \
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

## Quick Reference

| What | Command |
|------|---------|
| Get CloudFront domain | `aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].Outputs[?OutputKey==\`DistributionDomainName\`].OutputValue' --output text` |
| Get bucket name | `aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].Outputs[?OutputKey==\`FrontendBucketName\`].OutputValue' --output text` |
| Get distribution ID | `aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].Outputs[?OutputKey==\`DistributionId\`].OutputValue' --output text` |
| Update frontend | `./scripts/update-frontend.sh` |
| Invalidate cache | `aws cloudfront create-invalidation --distribution-id ID --paths "/*"` |

## Completion

- [ ] Site loads at https://kiro-haunting.me ✅
- [ ] Site loads at https://www.kiro-haunting.me ✅
- [ ] HTTPS certificate is valid ✅
- [ ] All pages work (no 404s) ✅
- [ ] API calls work ✅

**Congratulations! Your custom domain is live! 🎉**

## Estimated Time

- Infrastructure deployment: 10-15 minutes
- Certificate validation: 5-30 minutes
- DNS propagation: 5-30 minutes
- Frontend deployment: 2-5 minutes
- **Total: 30-90 minutes**

## Cost

- ACM Certificate: $0 (free)
- CloudFront: ~$1-5/month
- **Total additional: ~$2-10/month**

## Support

- Detailed guide: [infrastructure/DOMAIN_SETUP.md](infrastructure/DOMAIN_SETUP.md)
- Architecture: [infrastructure/DOMAIN_ARCHITECTURE.md](infrastructure/DOMAIN_ARCHITECTURE.md)
- Quick reference: [DOMAIN_QUICK_REFERENCE.md](DOMAIN_QUICK_REFERENCE.md)
