# Lambda Handlers

## Configuration Handlers

### POST /config - Save User Configuration
**Handler:** `saveConfig.handler`
**File:** `saveConfig.ts`

Saves user configuration to DynamoDB. Automatically merges with existing config.

**Request Body:**
```json
{
  "platform": "alexa" | "google",
  "mode": "simple" | "connected",
  "selectedDevices": ["device-id-1", "device-id-2"],
  "activeTheme": "classic-ghost",
  "epilepsySafeMode": false,
  "customPrompts": {
    "light": "Custom prompt..."
  }
}
```

**Response:**
```json
{
  "userId": "user-123",
  "platform": "alexa",
  "mode": "simple",
  "selectedDevices": [],
  "activeTheme": "classic-ghost",
  "epilepsySafeMode": false,
  "customPrompts": {},
  "createdAt": "2024-12-04T...",
  "updatedAt": "2024-12-04T..."
}
```

### GET /config - Get User Configuration
**Handler:** `getConfig.handler`
**File:** `getConfig.ts`

Retrieves user configuration from DynamoDB.

**Response:**
```json
{
  "userId": "user-123",
  "platform": "alexa",
  "mode": "simple",
  "selectedDevices": ["device-1"],
  "activeTheme": "classic-ghost",
  "epilepsySafeMode": false,
  "customPrompts": {},
  "createdAt": "2024-12-04T...",
  "updatedAt": "2024-12-04T..."
}
```

## Deployment

Both handlers require these environment variables:
- `USER_CONFIG_TABLE` - DynamoDB table name for user configs

The handlers automatically extract the userId from the Cognito authorizer context.
