# Domain Architecture

## Overview

This document explains how your custom domain connects to AWS infrastructure.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS Request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Namecheap DNS (kiro-haunting.me)             │
│                                                                 │
│  @ (root)  → CNAME → d1234.cloudfront.net                      │
│  www       → CNAME → d1234.cloudfront.net                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ DNS Resolution
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS CloudFront (CDN)                         │
│                                                                 │
│  • Global edge locations (low latency)                         │
│  • HTTPS termination (ACM certificate)                         │
│  • Caching (faster page loads)                                 │
│  • DDoS protection                                             │
│  • Compression (gzip/brotli)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Origin Access Identity (OAI)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    S3 Bucket (Private)                          │
│                                                                 │
│  • index.html                                                  │
│  • assets/                                                     │
│  • *.js, *.css                                                 │
│  • Only accessible via CloudFront                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls from Browser
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway                                  │
│                                                                 │
│  • /auth/login, /auth/register                                 │
│  • /devices, /config                                           │
│  • /haunting/start, /haunting/stop                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lambda Functions                             │
│                                                                 │
│  • Auth Handler                                                │
│  • Device Handler                                              │
│  • Config Handler                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              DynamoDB + Cognito                                 │
│                                                                 │
│  • User data                                                   │
│  • Device configurations                                       │
│  • Haunting sessions                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. User visits https://kiro-haunting.me

```
User Browser
    ↓
DNS Lookup (kiro-haunting.me)
    ↓
Namecheap DNS returns: d1234.cloudfront.net
    ↓
Browser connects to CloudFront edge location (nearest)
    ↓
CloudFront checks cache
    ├─ Cache HIT → Return cached content (fast!)
    └─ Cache MISS → Fetch from S3 origin
           ↓
       S3 Bucket (via OAI)
           ↓
       Return index.html + assets
           ↓
       CloudFront caches response
           ↓
       Return to user
```

### 2. User makes API call

```
Browser (JavaScript)
    ↓
fetch('https://abc123.execute-api.us-east-1.amazonaws.com/prod/devices')
    ↓
API Gateway
    ↓
Lambda Function
    ↓
DynamoDB / Cognito
    ↓
Response back to browser
```

## Components

### 1. Namecheap DNS

**Purpose**: Translate domain name to CloudFront address

**Records**:
- `@` (root domain) → CloudFront distribution
- `www` → CloudFront distribution
- `_validation` → ACM certificate validation (one-time)

**TTL**: Automatic (typically 5-30 minutes)

### 2. AWS Certificate Manager (ACM)

**Purpose**: Provide SSL/TLS certificate for HTTPS

**Features**:
- Free SSL certificate
- Auto-renewal (no manual work)
- Validates domain ownership via DNS
- Must be in us-east-1 for CloudFront

**Validation**: DNS CNAME record proves you own the domain

### 3. CloudFront Distribution

**Purpose**: Content Delivery Network (CDN)

**Benefits**:
- **Speed**: Caches content at edge locations worldwide
- **Security**: DDoS protection, HTTPS enforcement
- **Cost**: Reduces S3 data transfer costs
- **Compression**: Automatic gzip/brotli compression

**Cache Behavior**:
- HTML: 5 minutes (for updates)
- JS/CSS: 1 year (versioned filenames)
- Images: 1 year

**Error Handling**:
- 404 → Serve index.html (for client-side routing)
- 403 → Serve index.html (for client-side routing)

### 4. Origin Access Identity (OAI)

**Purpose**: Secure S3 access

**How it works**:
- CloudFront has special identity
- S3 bucket policy allows only this identity
- Direct S3 URLs don't work (secure!)

### 5. S3 Bucket

**Purpose**: Store frontend files

**Configuration**:
- Private (not public)
- No website hosting (CloudFront handles this)
- Versioning disabled (optional)
- Lifecycle rules (optional, for old versions)

## Security

### HTTPS Everywhere

```
HTTP Request (port 80)
    ↓
CloudFront redirects to HTTPS (port 443)
    ↓
Encrypted connection
```

### Private S3 Bucket

```
Direct S3 URL: https://bucket.s3.amazonaws.com/index.html
    ↓
Access Denied (403)

CloudFront URL: https://kiro-haunting.me/
    ↓
Success (200) - OAI grants access
```

### Certificate Validation

```
You add DNS record: _abc123.kiro-haunting.me → _xyz456.acm-validations.aws
    ↓
AWS checks DNS record exists
    ↓
Proves you control the domain
    ↓
Certificate issued
```

## Performance

### Without CloudFront

```
User in Tokyo → S3 in us-east-1 (Virginia)
    ↓
~150ms latency
    ↓
Every request goes to Virginia
```

### With CloudFront

```
User in Tokyo → CloudFront edge in Tokyo
    ↓
~10ms latency (cached)
    ↓
Only first request goes to Virginia
```

### Cache Hit Ratio

Typical: 80-95% of requests served from cache

```
100 requests
    ├─ 85 from cache (fast, cheap)
    └─ 15 from S3 (slower, more expensive)
```

## Cost Breakdown

### Monthly Costs (Low Traffic)

| Service | Cost | Notes |
|---------|------|-------|
| ACM Certificate | $0 | Free |
| CloudFront Requests | $0.50 | First 10M requests free |
| CloudFront Data Transfer | $1-3 | First 1TB at $0.085/GB |
| S3 Storage | $0.10 | ~5GB frontend files |
| S3 Requests | $0.01 | Mostly cached |
| **Total** | **$2-5/month** | For ~10k visitors/month |

### Comparison

| Setup | Cost | Speed | Security |
|-------|------|-------|----------|
| S3 Website Only | $1/mo | Slow | HTTP only |
| S3 + CloudFront | $3/mo | Fast | HTTPS |
| S3 + CloudFront + Domain | $3/mo | Fast | HTTPS + Custom |

## Monitoring

### CloudFront Metrics (AWS Console)

- **Requests**: Total requests per minute
- **Bytes Downloaded**: Data transfer
- **Error Rate**: 4xx and 5xx errors
- **Cache Hit Rate**: % of requests from cache

### Useful Commands

```bash
# Check cache hit ratio
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=YOUR-DIST-ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average

# Check error rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name 4xxErrorRate \
  --dimensions Name=DistributionId,Value=YOUR-DIST-ID \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## Troubleshooting

### DNS Not Resolving

```bash
# Check DNS propagation
dig kiro-haunting.me
dig www.kiro-haunting.me

# Should show CNAME to CloudFront
# If not, wait 5-30 minutes for propagation
```

### Certificate Validation Stuck

```bash
# Check validation record
dig _abc123.kiro-haunting.me CNAME

# Should show ACM validation target
# If not, check Namecheap DNS settings
```

### 403 Forbidden

```bash
# Check if files exist in S3
aws s3 ls s3://YOUR-BUCKET/

# Should show index.html and assets/
# If not, deploy frontend
```

### Stale Content

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR-DIST-ID \
  --paths "/*"

# Wait 1-2 minutes for invalidation
```

## Best Practices

### 1. Cache Invalidation

After deploying frontend updates:
```bash
aws cloudfront create-invalidation --distribution-id ID --paths "/*"
```

### 2. Versioned Assets

Use content hashes in filenames:
```
main.abc123.js  # Can cache forever
main.xyz789.js  # New version, different hash
```

### 3. Monitoring

Set up CloudWatch alarms:
- High error rate (>5%)
- Low cache hit rate (<70%)
- High data transfer (unexpected traffic)

### 4. Cost Optimization

- Enable compression (gzip/brotli)
- Set appropriate cache TTLs
- Use CloudFront for static assets only
- Consider CloudFront Functions for edge logic

## References

- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [ACM Documentation](https://docs.aws.amazon.com/acm/)
- [S3 Documentation](https://docs.aws.amazon.com/s3/)
- [DNS Propagation Checker](https://www.whatsmydns.net/)
