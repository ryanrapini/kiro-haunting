# Namecheap DNS - Visual Click-by-Click Guide

## Part 1: Getting to Advanced DNS

### Screen 1: Namecheap Dashboard
```
┌─────────────────────────────────────────────────────────┐
│ Namecheap                                    [Profile]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐                                       │
│  │ Domain List │ ← CLICK HERE                          │
│  │ Hosting     │                                       │
│  │ SSL Certs   │                                       │
│  └─────────────┘                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Domain List
```
┌─────────────────────────────────────────────────────────┐
│ Domain List                                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Domain: kiro-haunting.me                               │
│  Expires: [date]                                        │
│  Auto-Renew: On                                         │
│                                                         │
│  [Manage] ← CLICK HERE                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 3: Domain Management Tabs
```
┌─────────────────────────────────────────────────────────┐
│ kiro-haunting.me                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Details] [Advanced DNS] ← CLICK HERE [Redirect]      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Part 2: Adding the Certificate Validation Record

### Screen 4: Advanced DNS Page
```
┌─────────────────────────────────────────────────────────┐
│ Advanced DNS                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HOST RECORDS                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Type │ Host │ Value │ TTL │                        │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ (empty - no records yet)                          │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [+ ADD NEW RECORD] ← CLICK HERE                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 5: Add New Record Form
```
┌─────────────────────────────────────────────────────────┐
│ Add New Record                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Type: [CNAME Record ▼] ← SELECT THIS                  │
│                                                         │
│  Host: [_cdd0ce0e7f256ff9632c6e86b5e1b6ce]             │
│        ↑ TYPE THIS (no domain, no dot)                 │
│                                                         │
│  Value: [_9be68f67651a6f4f0841e3bad6c4ec62.jkddzzt...] │
│         ↑ TYPE THIS (full value, no trailing dot)      │
│                                                         │
│  TTL: [Automatic ▼] ← LEAVE AS IS                      │
│                                                         │
│  [✓ Save] ← CLICK HERE WHEN DONE                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 6: After Saving
```
┌─────────────────────────────────────────────────────────┐
│ Advanced DNS                                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HOST RECORDS                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Type  │ Host                    │ Value           │ │
│  ├───────────────────────────────────────────────────┤ │
│  │ CNAME │ _cdd0ce0e7f256ff963... │ _9be68f67651... │ │
│  │       │                         │                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ✅ Record saved! Wait 5-15 minutes for DNS to update   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Part 3: What Each Field Means

### Type: CNAME Record
- This tells DNS "this name points to another name"
- Like a forwarding address for websites

### Host: _cdd0ce0e7f256ff9632c6e86b5e1b6ce
- This is a subdomain of kiro-haunting.me
- AWS uses this to verify you own the domain
- Only AWS will look at this record, not regular visitors

### Value: _9be68f67651a6f4f0841e3bad6c4ec62.jkddzztszm.acm-validations.aws
- This is AWS's validation server
- When AWS checks your DNS, it looks for this exact value
- If it finds it, AWS knows you control the domain

### TTL: Automatic
- "Time To Live" - how long DNS servers cache this record
- Automatic is fine (usually 30 minutes)

## Part 4: After Adding the Record

### What Happens Automatically:

1. **Namecheap** updates their DNS servers (instant)
2. **DNS propagates** around the internet (5-15 minutes)
3. **AWS checks** for the validation record (every few minutes)
4. **AWS finds it** and issues your SSL certificate (instant)
5. **CloudFormation continues** deploying CloudFront (5-10 minutes)
6. **You get notified** when deployment is complete

### How to Check Progress:

In your terminal, run:
```bash
# Check if DNS has propagated
dig _cdd0ce0e7f256ff9632c6e86b5e1b6ce.kiro-haunting.me CNAME

# Check CloudFormation status
aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].StackStatus'
```

## Part 5: Adding Domain Records (Later)

After CloudFormation finishes, you'll add 2 more records the same way:

### Record 1: Root Domain
```
Type: CNAME Record
Host: @
Value: d1234567890abc.cloudfront.net (from deployment output)
TTL: Automatic
```

### Record 2: WWW Subdomain
```
Type: CNAME Record
Host: www
Value: d1234567890abc.cloudfront.net (same as above)
TTL: Automatic
```

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│ CERTIFICATE VALIDATION (Add Now)                        │
├─────────────────────────────────────────────────────────┤
│ Type:  CNAME Record                                     │
│ Host:  _cdd0ce0e7f256ff9632c6e86b5e1b6ce               │
│ Value: _9be68f67651a6f4f0841e3bad6c4ec62.jkddzztszm... │
│ TTL:   Automatic                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ DOMAIN RECORDS (Add After Deployment)                   │
├─────────────────────────────────────────────────────────┤
│ Root Domain:                                            │
│   Type:  CNAME Record                                   │
│   Host:  @                                              │
│   Value: [CloudFront domain from output]                │
│   TTL:   Automatic                                      │
│                                                         │
│ WWW Subdomain:                                          │
│   Type:  CNAME Record                                   │
│   Host:  www                                            │
│   Value: [CloudFront domain from output]                │
│   TTL:   Automatic                                      │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### "I don't see Advanced DNS tab"
- Make sure you clicked "Manage" next to kiro-haunting.me
- Look for tabs at the top: Details, Advanced DNS, Redirect

### "It says CNAME already exists"
- You might have an A record for the same host
- Delete the A record first, then add the CNAME

### "I added it but nothing happens"
- DNS takes 5-15 minutes to propagate
- Run `dig _cdd0ce0e7f256ff9632c6e86b5e1b6ce.kiro-haunting.me CNAME` to check
- If you see the validation value, it's working!

### "I made a mistake"
- Click the trash icon next to the record to delete it
- Then add it again with the correct values

## Ready?

1. Open Namecheap in your browser
2. Follow the screens above
3. Add the certificate validation record
4. Come back here and let me know when it's done!

I'll monitor the deployment and let you know when to add the domain records.
