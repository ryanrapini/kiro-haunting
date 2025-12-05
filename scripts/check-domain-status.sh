#!/bin/bash

echo "🔍 Checking Domain Setup Status..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check AWS CLI
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI configured${NC}"

# Check if stack exists
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].StackStatus' \
  --output text 2>/dev/null)

if [ -z "$STACK_STATUS" ]; then
    echo -e "${RED}❌ Stack not deployed${NC}"
    echo ""
    echo "Run: cd infrastructure && bun run cdk deploy HauntedHomeStack"
    exit 1
fi

echo -e "${GREEN}✓ Stack deployed ($STACK_STATUS)${NC}"

# Get stack outputs
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
  --output text 2>/dev/null)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text 2>/dev/null)

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text 2>/dev/null)

echo ""
echo "📋 Stack Outputs:"
echo "  CloudFront: $CLOUDFRONT_DOMAIN"
echo "  Distribution ID: $DISTRIBUTION_ID"
echo "  S3 Bucket: $BUCKET_NAME"
echo ""

# Check CloudFront distribution status
DIST_STATUS=$(aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.Status' \
  --output text 2>/dev/null)

if [ "$DIST_STATUS" = "Deployed" ]; then
    echo -e "${GREEN}✓ CloudFront distribution deployed${NC}"
else
    echo -e "${YELLOW}⏳ CloudFront distribution deploying ($DIST_STATUS)${NC}"
fi

# Check if files exist in S3
FILE_COUNT=$(aws s3 ls s3://$BUCKET_NAME/ --recursive 2>/dev/null | wc -l)

if [ "$FILE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Frontend files in S3 ($FILE_COUNT files)${NC}"
else
    echo -e "${RED}❌ No files in S3${NC}"
    echo "  Run: cd frontend && bun run build && aws s3 sync dist/ s3://$BUCKET_NAME/"
fi

echo ""
echo "🌐 DNS Status:"

# Check root domain DNS
ROOT_DNS=$(dig +short kiro-haunting.me 2>/dev/null | head -n 1)
if [ -z "$ROOT_DNS" ]; then
    echo -e "${RED}❌ kiro-haunting.me not resolving${NC}"
    echo "  Add CNAME: @ → $CLOUDFRONT_DOMAIN"
else
    if [[ "$ROOT_DNS" == *"cloudfront"* ]]; then
        echo -e "${GREEN}✓ kiro-haunting.me → $ROOT_DNS${NC}"
    else
        echo -e "${YELLOW}⚠️  kiro-haunting.me → $ROOT_DNS (not CloudFront)${NC}"
        echo "  Expected: $CLOUDFRONT_DOMAIN"
    fi
fi

# Check www subdomain DNS
WWW_DNS=$(dig +short www.kiro-haunting.me 2>/dev/null | head -n 1)
if [ -z "$WWW_DNS" ]; then
    echo -e "${RED}❌ www.kiro-haunting.me not resolving${NC}"
    echo "  Add CNAME: www → $CLOUDFRONT_DOMAIN"
else
    if [[ "$WWW_DNS" == *"cloudfront"* ]]; then
        echo -e "${GREEN}✓ www.kiro-haunting.me → $WWW_DNS${NC}"
    else
        echo -e "${YELLOW}⚠️  www.kiro-haunting.me → $WWW_DNS (not CloudFront)${NC}"
        echo "  Expected: $CLOUDFRONT_DOMAIN"
    fi
fi

echo ""
echo "🔒 HTTPS Status:"

# Check HTTPS for root domain
if curl -s -o /dev/null -w "%{http_code}" https://kiro-haunting.me 2>/dev/null | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ https://kiro-haunting.me is accessible${NC}"
else
    echo -e "${RED}❌ https://kiro-haunting.me not accessible${NC}"
fi

# Check HTTPS for www
if curl -s -o /dev/null -w "%{http_code}" https://www.kiro-haunting.me 2>/dev/null | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ https://www.kiro-haunting.me is accessible${NC}"
else
    echo -e "${RED}❌ https://www.kiro-haunting.me not accessible${NC}"
fi

echo ""
echo "📊 Summary:"

# Count successes
SUCCESS_COUNT=0
TOTAL_CHECKS=6

[ "$STACK_STATUS" = "CREATE_COMPLETE" ] || [ "$STACK_STATUS" = "UPDATE_COMPLETE" ] && ((SUCCESS_COUNT++))
[ "$DIST_STATUS" = "Deployed" ] && ((SUCCESS_COUNT++))
[ "$FILE_COUNT" -gt 0 ] && ((SUCCESS_COUNT++))
[[ "$ROOT_DNS" == *"cloudfront"* ]] && ((SUCCESS_COUNT++))
[[ "$WWW_DNS" == *"cloudfront"* ]] && ((SUCCESS_COUNT++))
curl -s -o /dev/null -w "%{http_code}" https://kiro-haunting.me 2>/dev/null | grep -q "200\|301\|302" && ((SUCCESS_COUNT++))

if [ $SUCCESS_COUNT -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✅ All checks passed! Your site is live!${NC}"
    echo ""
    echo "🌐 Visit: https://kiro-haunting.me"
elif [ $SUCCESS_COUNT -ge 4 ]; then
    echo -e "${YELLOW}⚠️  $SUCCESS_COUNT/$TOTAL_CHECKS checks passed. Almost there!${NC}"
    echo ""
    echo "💡 Wait 5-15 minutes for DNS propagation, then run this script again."
else
    echo -e "${RED}❌ $SUCCESS_COUNT/$TOTAL_CHECKS checks passed. More work needed.${NC}"
    echo ""
    echo "📖 See: infrastructure/DOMAIN_SETUP.md"
fi

echo ""
