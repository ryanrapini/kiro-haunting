# Quick Setup Guide

## Step 1: Store Your OpenRouter API Key

Run this command with your actual OpenRouter API key:

```bash
aws ssm put-parameter \
  --name "/haunted-home/openrouter-api-key" \
  --value "sk-or-v1-YOUR-ACTUAL-KEY-HERE" \
  --type "SecureString" \
  --description "OpenRouter API key for Haunted Home Orchestrator"
```

**Get a free OpenRouter key at:** https://openrouter.ai/

**Recommended free model:** `meta-llama/llama-3.1-8b-instruct:free`

## Step 2: Verify It's Stored

```bash
aws ssm get-parameter --name "/haunted-home/openrouter-api-key" --with-decryption
```

You should see your key in the output.

## Step 3: Deploy Infrastructure

```bash
cd infrastructure
bun install
bunx cdk bootstrap  # First time only
bunx cdk deploy
```

Save the outputs - you'll need them for the frontend!

## Step 4: Deploy Frontend

```bash
cd ../frontend

# Create .env with the outputs from Step 3
cat > .env << EOF
VITE_API_ENDPOINT=<paste ApiEndpoint here>
VITE_USER_POOL_ID=<paste UserPoolId here>
VITE_USER_POOL_CLIENT_ID=<paste UserPoolClientId here>
VITE_AWS_REGION=us-east-1
EOF

bun install
bun run build
aws s3 sync dist/ s3://<paste FrontendBucketName here>/
```

## Step 5: Visit Your App

Open the `FrontendUrl` from the CDK outputs in your browser!

## OpenRouter Configuration

The backend will use OpenRouter's OpenAI-compatible API:
- **Base URL:** `https://openrouter.ai/api/v1`
- **Free Model:** `meta-llama/llama-3.1-8b-instruct:free`
- **Paid Models:** Many options starting at $0.0001/1K tokens

## Cleanup

To remove everything:

```bash
cd infrastructure
bunx cdk destroy
```
