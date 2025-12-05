# Your Namecheap DNS Records

## Step-by-Step Guide

### Step 1: Log into Namecheap

1. Go to https://www.namecheap.com/myaccount/login/
2. Log in with your credentials

### Step 2: Access DNS Settings

1. Click "Domain List" in the left sidebar
2. Find `kiro-haunting.me` in your list
3. Click the "Manage" button next to it
4. Click the "Advanced DNS" tab at the top

### Step 3: Add Certificate Validation Record (REQUIRED FIRST!)

**This record proves you own the domain so AWS can issue your SSL certificate.**

Click "+ ADD NEW RECORD" button and enter:

```
Type: CNAME Record
Host: _cdd0ce0e7f256ff9632c6e86b5e1b6ce
Value: _9be68f67651a6f4f0841e3bad6c4ec62.jkddzztszm.acm-validations.aws
TTL: Automatic
```

**IMPORTANT NOTES:**
- The Host is ONLY the part before `.kiro-haunting.me`
- Do NOT include `.kiro-haunting.me` in the Host field
- Do NOT include a trailing dot (.) at the end of the Value
- Click the green checkmark to save

### Step 4: Wait for Certificate Validation

After adding the record:
- Wait 5-15 minutes for DNS to propagate
- AWS will automatically detect the record and issue your certificate
- The CloudFormation stack will continue deploying automatically

You can check if DNS has propagated by running:
```bash
dig _cdd0ce0e7f256ff9632c6e86b5e1b6ce.kiro-haunting.me CNAME
```

### Step 5: Add Domain Records (AFTER certificate is issued)

Once the stack finishes deploying (you'll get CloudFront domain), add these two records:

#### Root Domain Record
```
Type: CNAME Record
Host: @
Value: [CloudFront domain from deployment output]
TTL: Automatic
```

#### WWW Subdomain Record
```
Type: CNAME Record
Host: www
Value: [CloudFront domain from deployment output]
TTL: Automatic
```

**IMPORTANT:** If you have existing A records for `@` or `www`, DELETE them first. You can only have one record type per host.

## Visual Example

Your Advanced DNS page should look like this:

```
┌─────────────────────────────────────────────────────────────────┐
│ Type    │ Host                              │ Value              │
├─────────────────────────────────────────────────────────────────┤
│ CNAME   │ _cdd0ce0e7f256ff9632c6e86b5e1b6ce │ _9be68f67651a6f... │
│ CNAME   │ @                                 │ d123.cloudfront... │
│ CNAME   │ www                               │ d123.cloudfront... │
└─────────────────────────────────────────────────────────────────┘
```

## Common Mistakes to Avoid

❌ **WRONG:** Host: `_cdd0ce0e7f256ff9632c6e86b5e1b6ce.kiro-haunting.me`
✅ **RIGHT:** Host: `_cdd0ce0e7f256ff9632c6e86b5e1b6ce`

❌ **WRONG:** Value: `_9be68f67651a6f4f0841e3bad6c4ec62.jkddzztszm.acm-validations.aws.` (with dot)
✅ **RIGHT:** Value: `_9be68f67651a6f4f0841e3bad6c4ec62.jkddzztszm.acm-validations.aws` (no dot)

❌ **WRONG:** Having both A record and CNAME for `@`
✅ **RIGHT:** Delete A record, only use CNAME

## What Happens Next?

1. **Now:** Add the certificate validation CNAME record
2. **5-15 min:** DNS propagates, AWS validates your domain
3. **10-20 min:** CloudFormation finishes deploying CloudFront
4. **Then:** You'll get the CloudFront domain (like `d1234.cloudfront.net`)
5. **Then:** Add the `@` and `www` CNAME records pointing to CloudFront
6. **5-30 min:** DNS propagates again
7. **Done:** Your site is live at https://kiro-haunting.me

## Current Status

✅ Certificate validation record ready to add
⏳ Waiting for you to add it to Namecheap
⏳ Stack is deploying (will take 10-20 minutes after DNS validates)

## Need Help?

Run this to check if your DNS record is visible:
```bash
dig _cdd0ce0e7f256ff9632c6e86b5e1b6ce.kiro-haunting.me CNAME
```

If you see the validation target in the output, DNS has propagated!
