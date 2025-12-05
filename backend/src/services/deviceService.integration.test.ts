import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { toggleDevice, updateDeviceSettings } from './deviceService';
import { DeviceType, FrequencyLevel, DEFAULT_PROMPTS, Device } from '../models/types';

// Mock DynamoDB operations for integration testing
const mockSend = mock();

mock.module('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: () => ({ send: mockSend })
  },
  PutCommand: class PutCommand {
    constructor(public input: any) {}
  },
  GetCommand: class GetCommand {
    constructor(public input: any) {}
  }
}));

mock.module('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: class DynamoDBClient {
    constructor() {}
  }
}));

describe('Device Service Integration Tests', () => {
  beforeEach(() => {
    mockSend.mockClear();
  });

  describe('Toggle device functionality', () => {
    test('toggleDevice returns updated device when device exists', async () => {
      const mockDevice: Device = {
        id: 'device-123',
        userId: 'user-123',
        name: 'Test Light',
        formalName: 'Living Room Light',
        type: DeviceType.LIGHT,
        platform: 'alexa',
        mode: 'simple',
        enabled: false,
        frequency: FrequencyLevel.NORMAL,
        defaultPrompt: DEFAULT_PROMPTS[DeviceType.LIGHT],
        selectionWeight: 1.0,
        actionCount: 0,
        createdAt: new Date().toISOString()
      };

      // Mock GetCommand to return existing device
      mockSend.mockResolvedValueOnce({ Item: mockDevice });
      // Mock PutCommand for update
      mockSend.mockResolvedValueOnce({});

      const result = await toggleDevice('user-123', 'device-123', true);

      expect(result).not.toBeNull();
      expect(result?.enabled).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2); // Get + Put
    });

    test('toggleDevice returns null when device does not exist', async () => {
      // Mock GetCommand to return no device
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await toggleDevice('user-123', 'nonexistent', true);

      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1); // Only Get
    });
  });

  describe('Update device settings functionality', () => {
    test('updateDeviceSettings returns updated device with new frequency and prompt', async () => {
      const mockDevice: Device = {
        id: 'device-123',
        userId: 'user-123',
        name: 'Test Light',
        formalName: 'Living Room Light',
        type: DeviceType.LIGHT,
        platform: 'alexa',
        mode: 'simple',
        enabled: true,
        frequency: FrequencyLevel.NORMAL,
        defaultPrompt: DEFAULT_PROMPTS[DeviceType.LIGHT],
        selectionWeight: 1.0,
        actionCount: 0,
        createdAt: new Date().toISOString()
      };

      // Mock GetCommand to return existing device
      mockSend.mockResolvedValueOnce({ Item: mockDevice });
      // Mock PutCommand for update
      mockSend.mockResolvedValueOnce({});

      const result = await updateDeviceSettings('user-123', 'device-123', {
        frequency: FrequencyLevel.FREQUENT,
        customPrompt: 'Custom spooky behavior'
      });

      expect(result).not.toBeNull();
      expect(result?.frequency).toBe(FrequencyLevel.FREQUENT);
      expect(result?.customPrompt).toBe('Custom spooky behavior');
      expect(result?.selectionWeight).toBe(2.0); // FREQUENT weight
      expect(mockSend).toHaveBeenCalledTimes(2); // Get + Put
    });

    test('updateDeviceSettings returns null when device does not exist', async () => {
      // Mock GetCommand to return no device
      mockSend.mockResolvedValueOnce({ Item: null });

      const result = await updateDeviceSettings('user-123', 'nonexistent', {
        frequency: FrequencyLevel.FREQUENT
      });

      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1); // Only Get
    });
  });
});