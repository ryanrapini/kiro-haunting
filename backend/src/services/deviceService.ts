import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand,
  QueryCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { Device, DeviceType } from '../models/types';
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
  
  const device: Device = {
    id: randomUUID(),
    userId,
    name: deviceData.name,
    formalName: deviceData.formalName,
    type: deviceData.type,
    platform: deviceData.platform,
    mode: deviceData.mode,
    commandExamples: deviceData.commandExamples || [],
    enabled: true,
    createdAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: DEVICES_TABLE,
      Item: device,
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
        id: deviceId,
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
        id: deviceId,
      },
    })
  );
}
