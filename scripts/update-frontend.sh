#!/bin/bash

set -e

echo "🎨 Updating Frontend..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get stack outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text 2>/dev/null)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name HauntedHomeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text 2>/dev/null)

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}⚠️  Stack not found. Have you deployed the infrastructure?${NC}"
    echo "Run: cd infrastructure && bun run cdk deploy HauntedHomeStack"
    exit 1
fi

echo "📦 Building frontend..."
cd frontend
bun install
bun run build

echo ""
echo "📤 Uploading to S3 ($BUCKET_NAME)..."
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

echo ""
echo "🔄 Invalidating CloudFront cache ($DISTRIBUTION_ID)..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo ""
echo -e "${GREEN}✅ Frontend updated!${NC}"
echo ""
echo "Invalidation ID: $INVALIDATION_ID"
echo ""
echo "🌐 Your site: https://kiro-haunting.me"
echo "⏱️  Cache invalidation takes 1-2 minutes"
echo ""
