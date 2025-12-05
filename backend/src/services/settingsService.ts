import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand 
} from '@aws-sdk/lib-dynamodb';
import { OrchestratorSettings, SETTINGS_CONSTRAINTS } from '../models/types';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SETTINGS_TABLE = process.env.ORCHESTRATOR_SETTINGS_TABLE || 'HauntedHome-OrchestratorSettings';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Get orchestrator settings for a user
 */
export async function getSettings(userId: string): Promise<OrchestratorSettings> {
  const result = await docClient.send(
    new GetCommand({
      TableName: SETTINGS_TABLE,
      Key: {
        userId,
      },
    })
  );

  if (!result.Item) {
    // Return default settings if none exist
    const now = new Date().toISOString();
    const defaultSettings: OrchestratorSettings = {
      userId,
      minTriggerInterval: 5000,  // 5 seconds
      maxTriggerInterval: 30000, // 30 seconds
      epilepsyMode: false,
      createdAt: now,
      updatedAt: now,
    };
    
    // Save default settings
    await docClient.send(
      new PutCommand({
        TableName: SETTINGS_TABLE,
        Item: defaultSettings,
      })
    );
    
    return defaultSettings;
  }

  return result.Item as OrchestratorSettings;
}

/**
 * Update orchestrator settings for a user
 */
export async function updateSettings(
  userId: string,
  settings: Partial<OrchestratorSettings>
): Promise<OrchestratorSettings> {
  // Validate settings first
  const validation = validateSettings(settings);
  if (!validation.isValid) {
    throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
  }

  // Get existing settings
  const existingSettings = await getSettings(userId);
  
  const now = new Date().toISOString();
  const updatedSettings: OrchestratorSettings = {
    ...existingSettings,
    ...settings,
    userId, // Ensure userId cannot be changed
    updatedAt: now,
  };

  // Additional validation: min <= max
  if (updatedSettings.minTriggerInterval > updatedSettings.maxTriggerInterval) {
    throw new Error('Minimum trigger interval must be less than or equal to maximum trigger interval');
  }

  // Save to DynamoDB
  await docClient.send(
    new PutCommand({
      TableName: SETTINGS_TABLE,
      Item: updatedSettings,
    })
  );

  return updatedSettings;
}

/**
 * Validate orchestrator settings
 */
export function validateSettings(settings: Partial<OrchestratorSettings>): ValidationResult {
  const errors: string[] = [];

  // Validate minTriggerInterval
  if (settings.minTriggerInterval !== undefined) {
    if (typeof settings.minTriggerInterval !== 'number') {
      errors.push('minTriggerInterval must be a number');
    } else if (
      settings.minTriggerInterval < SETTINGS_CONSTRAINTS.minTriggerInterval.min ||
      settings.minTriggerInterval > SETTINGS_CONSTRAINTS.minTriggerInterval.max
    ) {
      errors.push(
        `minTriggerInterval must be between ${SETTINGS_CONSTRAINTS.minTriggerInterval.min} and ${SETTINGS_CONSTRAINTS.minTriggerInterval.max} milliseconds`
      );
    }
  }

  // Validate maxTriggerInterval
  if (settings.maxTriggerInterval !== undefined) {
    if (typeof settings.maxTriggerInterval !== 'number') {
      errors.push('maxTriggerInterval must be a number');
    } else if (
      settings.maxTriggerInterval < SETTINGS_CONSTRAINTS.maxTriggerInterval.min ||
      settings.maxTriggerInterval > SETTINGS_CONSTRAINTS.maxTriggerInterval.max
    ) {
      errors.push(
        `maxTriggerInterval must be between ${SETTINGS_CONSTRAINTS.maxTriggerInterval.min} and ${SETTINGS_CONSTRAINTS.maxTriggerInterval.max} milliseconds`
      );
    }
  }

  // Validate epilepsyMode
  if (settings.epilepsyMode !== undefined && typeof settings.epilepsyMode !== 'boolean') {
    errors.push('epilepsyMode must be a boolean');
  }

  // Cross-validation: min <= max (if both are provided)
  if (
    settings.minTriggerInterval !== undefined &&
    settings.maxTriggerInterval !== undefined &&
    settings.minTriggerInterval > settings.maxTriggerInterval
  ) {
    errors.push('minTriggerInterval must be less than or equal to maxTriggerInterval');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}