import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand 
} from '@aws-sdk/lib-dynamodb';
import { UserConfig, DeviceType } from '../models/types';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USER_CONFIG_TABLE = process.env.USER_CONFIG_TABLE || 'HauntedHome-UserConfig';

/**
 * Save user configuration to DynamoDB
 */
export async function saveUserConfig(
  userId: string,
  configData: Partial<UserConfig>
): Promise<UserConfig> {
  const now = new Date().toISOString();
  
  // Get existing config to preserve fields not being updated
  let existingConfig: UserConfig | null = null;
  try {
    existingConfig = await getUserConfig(userId);
  } catch (error) {
    // Config doesn't exist yet, that's fine
  }

  // Build the config object
  const config: UserConfig = {
    userId,
    platform: configData.platform || existingConfig?.platform || 'alexa',
    mode: configData.mode || existingConfig?.mode || 'simple',
    selectedDevices: configData.selectedDevices || existingConfig?.selectedDevices || [],
    activeTheme: configData.activeTheme || existingConfig?.activeTheme || 'classic-ghost',
    epilepsySafeMode: configData.epilepsySafeMode ?? existingConfig?.epilepsySafeMode ?? false,
    customPrompts: configData.customPrompts || existingConfig?.customPrompts || {},
    platformConfig: configData.platformConfig || existingConfig?.platformConfig,
    createdAt: existingConfig?.createdAt || now,
    updatedAt: now,
  };

  // Save to DynamoDB
  await docClient.send(
    new PutCommand({
      TableName: USER_CONFIG_TABLE,
      Item: config,
    })
  );

  return config;
}

/**
 * Retrieve user configuration from DynamoDB
 */
export async function getUserConfig(userId: string): Promise<UserConfig | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: USER_CONFIG_TABLE,
      Key: {
        userId,
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as UserConfig;
}
