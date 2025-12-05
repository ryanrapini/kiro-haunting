# Namecheap DNS Configuration Guide

Visual guide for adding DNS records in Namecheap for kiro-haunting.me.

## Step 1: Access DNS Settings

1. Log into Namecheap: https://www.namecheap.com/myaccount/login/
2. Click "Domain List" in the left sidebar
3. Find `kiro-haunting.me` and click "Manage"
4. Click the "Advanced DNS" tab

## Step 2: Certificate Validation (One-Time)

After running `cdk deploy`, you'll see output like:

```
Certificate validation records:
_abc123def456.kiro-haunting.me CNAME _xyz789.acm-validations.aws.
```

### Add this record in Namecheap:

```
┌─────────────────────────────────────────────────────────────┐
│ Type: CNAME Record                                          │
│ Host: _abc123def456                                         │
│ Value: _xyz789.acm-validations.aws                          │
│ TTL: Automatic                                              │
└─────────────────────────────────────────────────────────────┘
```

**Important**: 
- Only use the part BEFORE `.kiro-haunting.me` as the Host
- Use the FULL validation target as the Value
- Don't include trailing dots

### Example:

If CDK shows:
```
_1234abcd5678efgh.kiro-haunting.me → _9876zyxw5432vuut.acm-validations.aws.
```

Add in Namecheap:
- Host: `_1234abcd5678efgh`
- Value: `_9876zyxw5432vuut.acm-validations.aws`

## Step 3: Point Domain to CloudFront

After deployment completes, you'll see:

```
DistributionDomainName: d1234567890abc.cloudfront.net
```

### Add TWO records in Namecheap:

#### Record 1: Root Domain (@)

```
┌─────────────────────────────────────────────────────────────┐
│ Type: CNAME Record                                          │
│ Host: @                                                     │
│ Value: d1234567890abc.cloudfront.net                        │
│ TTL: Automatic                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Record 2: WWW Subdomain

```
┌─────────────────────────────────────────────────────────────┐
│ Type: CNAME Record                                          │
│ Host: www                                                   │
│ Value: d1234567890abc.cloudfront.net                        │
│ TTL: Automatic                                              │
└─────────────────────────────────────────────────────────────┘
```

## Step 4: Remove Old Records

**Important**: Remove any existing A records for:
- `@` (root domain)
- `www` (www subdomain)

You can only have CNAME records for these hosts.

## Final DNS Configuration

Your Advanced DNS page should look like this:

```
┌──────────────────────────────────────────────────────────────────┐
│ Type    │ Host              │ Value                              │
├──────────────────────────────────────────────────────────────────┤
│ CNAME   │ _abc123def456     │ _xyz789.acm-validations.aws        │
│ CNAME   │ @                 │ d1234567890abc.cloudfront.net      │
│ CNAME   │ www               │ d1234567890abc.cloudfront.net      │
└──────────────────────────────────────────────────────────────────┘
```

## Common Mistakes

### ❌ Wrong: Including domain in Host

```
Host: _abc123.kiro-haunting.me  ← Don't include domain
```

### ✅ Correct: Just the subdomain

```
Host: _abc123  ← Just the subdomain part
```

### ❌ Wrong: Including trailing dot

```
Value: _xyz789.acm-validations.aws.  ← Don't include trailing dot
```

### ✅ Correct: No trailing dot

```
Value: _xyz789.acm-validations.aws  ← No trailing dot
```

### ❌ Wrong: Using A record for root domain

```
Type: A Record
Host: @
Value: 1.2.3.4
```

### ✅ Correct: Using CNAME record

```
Type: CNAME Record
Host: @
Value: d1234567890abc.cloudfront.net
```

## Verification

After adding records, verify with these commands:

```bash
# Check certificate validation record
dig _abc123def456.kiro-haunting.me CNAME

# Check root domain
dig kiro-haunting.me

# Check www subdomain
dig www.kiro-haunting.me
```

Expected output:
```
kiro-haunting.me → d1234567890abc.cloudfront.net
www.kiro-haunting.me → d1234567890abc.cloudfront.net
```

## Timeline

- **Add records**: 2 minutes
- **DNS propagation**: 5-30 minutes
- **Certificate validation**: 5-30 minutes (automatic)
- **Total**: 15-60 minutes

## Troubleshooting

### Certificate validation stuck?

1. Check the validation record is correct
2. Wait 10-15 minutes for DNS propagation
3. Run: `dig _abc123.kiro-haunting.me CNAME`
4. Should show the ACM validation target

### Domain not resolving?

1. Check CNAME records are correct
2. Wait 15-30 minutes for DNS propagation
3. Run: `dig kiro-haunting.me`
4. Should show CloudFront domain

### "CNAME already exists" error?

1. Remove existing A records for @ and www
2. You can only have one record type per host
3. CNAME records replace A records

## Screenshots Guide

### 1. Namecheap Dashboard
```
Domain List → kiro-haunting.me → [Manage] button
```

### 2. Advanced DNS Tab
```
[Basic DNS] [Advanced DNS] ← Click this tab
```

### 3. Add New Record
```
[+ ADD NEW RECORD] button at bottom
```

### 4. Record Form
```
Type: [CNAME Record ▼]
Host: [_abc123      ]
Value: [_xyz789.acm-validations.aws]
TTL: [Automatic ▼]
[✓ Save] button
```

## Quick Reference

| What | Host | Value |
|------|------|-------|
| Certificate validation | `_abc123` | `_xyz789.acm-validations.aws` |
| Root domain | `@` | `d1234.cloudfront.net` |
| WWW subdomain | `www` | `d1234.cloudfront.net` |

## Need Help?

Run the status checker:
```bash
./scripts/check-domain-status.sh
```

Or see the detailed guide:
```bash
open infrastructure/DOMAIN_SETUP.md
```

## Success Indicators

✅ Certificate validation record added
✅ Root domain CNAME added
✅ WWW subdomain CNAME added
✅ Old A records removed
✅ DNS propagation complete (15-30 min)
✅ Site loads at https://kiro-haunting.me
✅ Site loads at https://www.kiro-haunting.me

---

**Once all records are added, wait 15-30 minutes for DNS propagation!**
