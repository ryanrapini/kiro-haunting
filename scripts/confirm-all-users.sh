#!/bin/bash

# Script to confirm all unconfirmed users in Cognito User Pool
# This is useful if users were created before the auto-confirm Lambda trigger was set up

USER_POOL_ID="us-east-1_oQOK4pJ17"
REGION="us-east-1"

echo "Checking for unconfirmed users..."

# Get all unconfirmed users
UNCONFIRMED_USERS=$(aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID \
  --region $REGION \
  --filter "cognito:user_status = \"UNCONFIRMED\"" \
  --query 'Users[*].Username' \
  --output text)

if [ -z "$UNCONFIRMED_USERS" ]; then
  echo "✓ No unconfirmed users found. All users are confirmed."
  exit 0
fi

echo "Found unconfirmed users. Confirming them now..."

for USERNAME in $UNCONFIRMED_USERS; do
  echo "  Confirming user: $USERNAME"
  aws cognito-idp admin-confirm-sign-up \
    --user-pool-id $USER_POOL_ID \
    --username $USERNAME \
    --region $REGION
  
  if [ $? -eq 0 ]; then
    echo "  ✓ User $USERNAME confirmed"
  else
    echo "  ✗ Failed to confirm user $USERNAME"
  fi
done

echo ""
echo "Done! All users should now be confirmed."
