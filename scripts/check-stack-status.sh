#!/bin/bash

echo "=== Stack Status ==="
aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].StackStatus' --output text

echo ""
echo "=== Key Resources ==="
echo "S3 Bucket:"
aws cloudformation describe-stack-resources --stack-name HauntedHomeStack --query 'StackResources[?ResourceType==`AWS::S3::Bucket`].PhysicalResourceId' --output text

echo ""
echo "CloudFront Distribution:"
aws cloudformation describe-stack-resources --stack-name HauntedHomeStack --query 'StackResources[?ResourceType==`AWS::CloudFront::Distribution`].PhysicalResourceId' --output text

echo ""
echo "ACM Certificate:"
aws cloudformation describe-stack-resources --stack-name HauntedHomeStack --query 'StackResources[?ResourceType==`AWS::CertificateManager::Certificate`].PhysicalResourceId' --output text

echo ""
echo "API Gateway:"
aws cloudformation describe-stack-resources --stack-name HauntedHomeStack --query 'StackResources[?ResourceType==`AWS::ApiGateway::RestApi`].PhysicalResourceId' --output text
