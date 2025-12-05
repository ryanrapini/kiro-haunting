#!/bin/bash

# Simple deployment script for Haunted Home Orchestrator

echo "🎃 Haunted Home Orchestrator - Deployment Script"
echo ""

# Check if AWS credentials are available
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not found!"
    echo ""
    echo "Please configure AWS credentials:"
    echo "  Option 1: aws configure"
    echo "  Option 2: aws sso login (if using SSO)"
    echo "  Option 3: Export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

echo "✅ AWS Account: $ACCOUNT_ID"
echo "✅ Region: $REGION"
echo ""

# Check if OpenRouter API key is stored
echo "Checking OpenRouter API key..."
if ! aws ssm get-parameter --name "/haunted-home/openrouter-api-key" > /dev/null 2>&1; then
    echo "❌ OpenRouter API key not found!"
    echo ""
    echo "Please store your OpenRouter API key:"
    echo '  aws ssm put-parameter --name "/haunted-home/openrouter-api-key" --value "your-key" --type "SecureString"'
    exit 1
fi

echo "✅ OpenRouter API key found"
echo ""

# Bootstrap CDK (if needed)
echo "Bootstrapping CDK..."
if aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION > /dev/null 2>&1; then
    echo "✅ CDK already bootstrapped"
else
    echo "Bootstrapping CDK for the first time..."
    npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
fi

echo ""
echo "Deploying infrastructure..."
npx cdk deploy --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Copy the outputs above (UserPoolId, ApiEndpoint, etc.)"
echo "2. Configure frontend/.env with these values"
echo "3. Deploy frontend: cd ../frontend && bun run build && aws s3 sync dist/ s3://<bucket>/"
