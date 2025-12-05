#!/bin/bash

echo "🔍 Checking HauntedHomeStack Deployment Status..."
echo ""

# Get stack status
STATUS=$(aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].StackStatus' --output text 2>/dev/null)

if [ -z "$STATUS" ]; then
    echo "❌ Stack not found"
    exit 1
fi

echo "📊 Stack Status: $STATUS"
echo ""

# Get latest events
echo "📋 Recent Events:"
echo "─────────────────────────────────────────────────────────────"
aws cloudformation describe-stack-events \
    --stack-name HauntedHomeStack \
    --max-items 5 \
    --query 'StackEvents[].[ResourceType,ResourceStatus]' \
    --output text | while read type status; do
    echo "  $type → $status"
done

echo ""
echo "─────────────────────────────────────────────────────────────"

# Check certificate status
CERT_STATUS=$(aws cloudformation describe-stack-events \
    --stack-name HauntedHomeStack \
    --query 'StackEvents[?ResourceType==`AWS::CertificateManager::Certificate`] | [0].ResourceStatus' \
    --output text 2>/dev/null)

if [ "$CERT_STATUS" = "CREATE_IN_PROGRESS" ]; then
    echo ""
    echo "⏳ Certificate is waiting for DNS validation"
    echo ""
    echo "👉 Add this DNS record in Namecheap:"
    echo "   Host:  _cdd0ce0e7f256ff9632c6e86b5e1b6ce"
    echo "   Value: _9be68f67651a6f4f0841e3bad6c4ec62.jkddzztszm.acm-validations.aws"
    echo ""
    echo "   See SIMPLE_DNS_GUIDE.txt for instructions"
elif [ "$CERT_STATUS" = "CREATE_COMPLETE" ]; then
    echo ""
    echo "✅ Certificate validated!"
fi

# Check if deployment is complete
if [ "$STATUS" = "UPDATE_COMPLETE" ] || [ "$STATUS" = "CREATE_COMPLETE" ]; then
    echo ""
    echo "✅ Deployment Complete!"
    echo ""
    echo "📋 Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name HauntedHomeStack \
        --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' \
        --output table
fi

if [ "$STATUS" = "UPDATE_IN_PROGRESS" ] || [ "$STATUS" = "CREATE_IN_PROGRESS" ]; then
    echo ""
    echo "⏳ Deployment in progress... Run this script again to check status"
fi

echo ""
