#!/bin/bash

# Script to mark all users' emails as verified in Cognito User Pool

USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name HauntedHomeStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text)

echo "User Pool ID: $USER_POOL_ID"
echo "Fetching all users..."

# Get all users
USERS=$(aws cognito-idp list-users --user-pool-id "$USER_POOL_ID" --query 'Users[].Username' --output text)

if [ -z "$USERS" ]; then
  echo "No users found in the user pool."
  exit 0
fi

echo "Found users: $USERS"
echo ""

# Loop through each user and mark email as verified
for USERNAME in $USERS; do
  echo "Verifying email for user: $USERNAME"
  aws cognito-idp admin-update-user-attributes \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --user-attributes Name=email_verified,Value=true
  
  if [ $? -eq 0 ]; then
    echo "✓ Successfully verified email for $USERNAME"
  else
    echo "✗ Failed to verify email for $USERNAME"
  fi
  echo ""
done

echo "Done! All users have been processed."
