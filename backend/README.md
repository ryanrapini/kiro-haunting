# Haunted Home Backend

AWS Lambda functions for the Haunted Home Orchestrator backend.

## Structure

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   ├── services/          # Business logic services
│   ├── models/            # TypeScript interfaces and types
│   ├── utils/             # Utility functions
│   └── config/            # Configuration
├── dist/                  # Compiled JavaScript (generated)
└── tests/                 # Test files
```

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run watch
```

## Lambda Functions

### Authentication
- `register` - User registration
- `login` - User login

### Configuration
- `saveConfig` - Save user configuration
- `getConfig` - Retrieve user configuration

### Device Management
- `discoverDevices` - Discover smart home devices (Connected Mode)
- `chatWithDeviceAgent` - Chat interface for device setup (Simple Mode)
- `getDevices` - Get user's devices
- `updateDeviceSelection` - Update device selection
- `deleteDevice` - Delete a device

### Haunting Control
- `startHaunting` - Start haunting routine
- `stopHaunting` - Stop haunting routine
- `getNextCommand` - Get next voice command (Simple Mode)

## Environment Variables

Each Lambda function expects these environment variables:

- `USER_CONFIG_TABLE` - DynamoDB UserConfig table name
- `DEVICES_TABLE` - DynamoDB Devices table name
- `HAUNTING_SESSIONS_TABLE` - DynamoDB HauntingSessions table name
- `USER_POOL_ID` - Cognito User Pool ID
- `USER_POOL_CLIENT_ID` - Cognito User Pool Client ID

OpenAI API key is stored in AWS Systems Manager Parameter Store at `/haunted-home/openai-api-key`.

## Deployment

Package Lambda functions:

```bash
npm run package
```

This creates `function.zip` ready for deployment to AWS Lambda.
