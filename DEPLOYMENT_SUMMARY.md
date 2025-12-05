# Deployment Summary - Custom Domain Setup

## What Changed

Your infrastructure now includes:

1. **CloudFront Distribution** - CDN for fast, global content delivery
2. **ACM SSL Certificate** - Free HTTPS certificate for kiro-haunting.me
3. **Private S3 Bucket** - Secure hosting with CloudFront access only
4. **Custom Domain Support** - Both kiro-haunting.me and www.kiro-haunting.me

## Files Modified

- `infrastructure/lib/haunted-home-stack.ts` - Added CloudFront + ACM
- `infrastructure/DOMAIN_SETUP.md` - Detailed setup guide
- `scripts/deploy-with-domain.sh` - Automated deployment script
- `scripts/update-frontend.sh` - Quick frontend update script
- `DOMAIN_QUICK_REFERENCE.md` - Quick reference card
- `README.md` - Added domain setup link

## Next Steps

### Option 1: Automated Deployment (Recommended)

```bash
./scripts/deploy-with-domain.sh
```

This will:
1. Deploy infrastructure
2. Show you DNS records to add in Namecheap
3. Wait for you to confirm
4. Deploy frontend
5. Invalidate cache

### Option 2: Manual Deployment

Follow the detailed guide: [infrastructure/DOMAIN_SETUP.md](infrastructure/DOMAIN_SETUP.md)

## DNS Records You'll Need to Add

In Namecheap Advanced DNS:

### 1. Certificate Validation (one-time)
After running `cdk deploy`, you'll get a CNAME record like:
```
_abc123.kiro-haunting.me → _xyz456.acm-validations.aws
```

Add this in Namecheap:
- Type: CNAME Record
- Host: `_abc123`
- Value: `_xyz456.acm-validations.aws`

### 2. Domain Pointing (permanent)
After deployment completes, you'll get a CloudFront domain like:
```
d1234567890abc.cloudfront.net
```

Add these in Namecheap:
- Type: CNAME, Host: `@`, Value: `d1234567890abc.cloudfront.net`
- Type: CNAME, Host: `www`, Value: `d1234567890abc.cloudfront.net`

## Timeline

1. **Deploy infrastructure**: 10-15 minutes
2. **Add DNS validation record**: 2 minutes
3. **Certificate validation**: 5-30 minutes (automatic)
4. **Add domain CNAME records**: 2 minutes
5. **DNS propagation**: 5-30 minutes
6. **Total**: 30-90 minutes

## Cost Impact

- ACM Certificate: **$0** (free)
- CloudFront: **~$1-5/month** for low traffic
- Data transfer: **$0.085/GB** after first 1TB/month
- **Total additional cost: ~$2-10/month**

## Testing

After DNS propagates (5-30 minutes), test:

```bash
# Check DNS
dig kiro-haunting.me
dig www.kiro-haunting.me

# Test HTTPS
curl -I https://kiro-haunting.me
curl -I https://www.kiro-haunting.me
```

Both should return 200 OK with valid SSL certificates.

## Future Updates

After initial setup, update your frontend with:

```bash
./scripts/update-frontend.sh
```

Or manually:

```bash
cd frontend
bun run build
aws s3 sync dist/ s3://YOUR-BUCKET/
aws cloudfront create-invalidation --distribution-id YOUR-DIST-ID --paths "/*"
```

## Rollback

If you need to rollback:

```bash
cd infrastructure
bun run cdk destroy HauntedHomeStack
```

This will remove all AWS resources. Your domain will stop working until you redeploy.

## Support

- **Detailed Guide**: [infrastructure/DOMAIN_SETUP.md](infrastructure/DOMAIN_SETUP.md)
- **Quick Reference**: [DOMAIN_QUICK_REFERENCE.md](DOMAIN_QUICK_REFERENCE.md)
- **Troubleshooting**: See DOMAIN_SETUP.md troubleshooting section

## Architecture Diagram

```
User Browser
    ↓
kiro-haunting.me (DNS → CloudFront)
    ↓
CloudFront Distribution (CDN + HTTPS)
    ↓
S3 Bucket (Private, Frontend Files)

API Calls:
    ↓
API Gateway
    ↓
Lambda Functions
    ↓
DynamoDB / Cognito
```

## Security

- S3 bucket is private (not publicly accessible)
- CloudFront uses Origin Access Identity (OAI)
- HTTPS enforced (HTTP redirects to HTTPS)
- Certificate auto-renews (ACM handles this)

## Monitoring

Check CloudFront metrics in AWS Console:
- Requests
- Data transfer
- Error rates
- Cache hit ratio

## Questions?

See the detailed guides or check AWS CloudFormation outputs:

```bash
aws cloudformation describe-stacks --stack-name HauntedHomeStack
```
