import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand,
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { Device, DeviceType, FrequencyLevel, DEFAULT_PROMPTS, FREQUENCY_WEIGHTS } from '../models/types';
import { randomUUID } from 'crypto';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const DEVICES_TABLE = process.env.DEVICES_TABLE || 'HauntedHome-Devices';

/**
 * Save a device to DynamoDB
 */
export async function saveDevice(
  userId: string,
  deviceData: {
    name: string;
    formalName: string;
    type: DeviceType;
    platform: 'alexa' | 'google';
    mode: 'simple' | 'connected';
    commandExamples?: string[];
  }
): Promise<Device> {
  const now = new Date().toISOString();
  const deviceId = randomUUID();
  
  const defaultPrompt = generateDefaultPrompt(deviceData.type);
  
  const device: Device = {
    id: deviceId,
    userId,
    name: deviceData.name,
    formalName: deviceData.formalName,
    type: deviceData.type,
    platform: deviceData.platform,
    mode: deviceData.mode,
    commandExamples: deviceData.commandExamples || [],
    enabled: true,
    frequency: FrequencyLevel.NORMAL,
    defaultPrompt,
    selectionWeight: calculateSelectionWeight(FrequencyLevel.NORMAL),
    actionCount: 0,
    createdAt: now,
  };

  // Save to DynamoDB with deviceId as the sort key
  await docClient.send(
    new PutCommand({
      TableName: DEVICES_TABLE,
      Item: {
        ...device,
        deviceId: deviceId, // DynamoDB uses deviceId as sort key
      },
    })
  );

  return device;
}

/**
 * Get all devices for a user
 */
export async function getUserDevices(userId: string): Promise<Device[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: DEVICES_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
    })
  );

  return (result.Items || []) as Device[];
}

/**
 * Get a specific device by ID
 */
export async function getDevice(userId: string, deviceId: string): Promise<Device | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: DEVICES_TABLE,
      Key: {
        userId,
        deviceId: deviceId,
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as Device;
}

/**
 * Delete a device
 */
export async function deleteDevice(userId: string, deviceId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: DEVICES_TABLE,
      Key: {
        userId,
        deviceId: deviceId,
      },
    })
  );
}

/**
 * Generate default prompt for a device type
 */
export function generateDefaultPrompt(deviceType: DeviceType): string {
  return DEFAULT_PROMPTS[deviceType] || DEFAULT_PROMPTS[DeviceType.UNKNOWN];
}

/**
 * Update device settings (frequency and custom prompt)
 */
export async function updateDeviceSettings(
  userId: string,
  deviceId: string,
  settings: {
    frequency?: FrequencyLevel;
    customPrompt?: string;
  }
): Promise<Device | null> {
  const device = await getDevice(userId, deviceId);
  if (!device) {
    return null;
  }

  const updates: Partial<Device> = {};
  
  if (settings.frequency !== undefined) {
    updates.frequency = settings.frequency;
    updates.selectionWeight = calculateSelectionWeight(settings.frequency);
  }
  
  if (settings.customPrompt !== undefined) {
    updates.customPrompt = settings.customPrompt;
  }

  const updatedDevice = { ...device, ...updates };

  await docClient.send(
    new PutCommand({
      TableName: DEVICES_TABLE,
      Item: {
        ...updatedDevice,
        deviceId: deviceId,
      },
    })
  );

  return updatedDevice;
}

/**
 * Toggle device enabled/disabled state
 */
export async function toggleDevice(
  userId: string,
  deviceId: string,
  enabled: boolean
): Promise<Device | null> {
  const device = await getDevice(userId, deviceId);
  if (!device) {
    return null;
  }

  const updatedDevice = { ...device, enabled };

  await docClient.send(
    new PutCommand({
      TableName: DEVICES_TABLE,
      Item: {
        ...updatedDevice,
        deviceId: deviceId,
      },
    })
  );

  return updatedDevice;
}

/**
 * Calculate selection weight based on frequency level
 */
export function calculateSelectionWeight(frequency: FrequencyLevel): number {
  return FREQUENCY_WEIGHTS[frequency];
}
