#!/bin/bash

set -e

echo "🎃 Haunted Home - Custom Domain Deployment"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI configured${NC}"
echo ""

# Step 1: Deploy infrastructure
echo "📦 Step 1: Deploying infrastructure with CloudFront..."
echo ""
cd infrastructure
bun install
bun run cdk deploy HauntedHomeStack --require-approval never

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Infrastructure deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Infrastructure deployed${NC}"
echo ""

# Get outputs
CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionDomainName`].OutputValue' \
  --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

echo "📋 Deployment Information:"
echo "=========================="
echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
echo "S3 Bucket: $BUCKET_NAME"
echo "Distribution ID: $DISTRIBUTION_ID"
echo ""

# Step 2: DNS Instructions
echo -e "${YELLOW}⚠️  IMPORTANT: DNS Configuration Required${NC}"
echo ""
echo "Go to Namecheap and add these DNS records:"
echo ""
echo "1. Root domain (@):"
echo "   Type: CNAME"
echo "   Host: @"
echo "   Value: $CLOUDFRONT_DOMAIN"
echo ""
echo "2. WWW subdomain:"
echo "   Type: CNAME"
echo "   Host: www"
echo "   Value: $CLOUDFRONT_DOMAIN"
echo ""
echo "Note: If certificate validation is pending, you'll also need to add"
echo "the validation CNAME records shown in the CDK output above."
echo ""

read -p "Press Enter once you've added the DNS records in Namecheap..."

# Step 3: Deploy frontend
echo ""
echo "🎨 Step 2: Building and deploying frontend..."
echo ""
cd ../frontend
bun install
bun run build

echo "📤 Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --no-cli-pager

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "🌐 Your site will be available at:"
echo "   https://kiro-haunting.me"
echo "   https://www.kiro-haunting.me"
echo ""
echo "⏱️  DNS propagation may take 5-30 minutes"
echo ""
echo "💡 To deploy frontend updates in the future, run:"
echo "   cd frontend && bun run build && \\"
echo "   aws s3 sync dist/ s3://$BUCKET_NAME/ && \\"
echo "   aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/*'"
echo ""
