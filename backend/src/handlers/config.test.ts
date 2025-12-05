import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { saveConfig, getConfig } from './config';
import { UserConfig } from '../models/types';

// Mock the configService
const mockSaveUserConfig = mock(() => Promise.resolve({} as UserConfig));
const mockGetUserConfig = mock(() => Promise.resolve({} as UserConfig | null));

mock.module('../services/configService', () => ({
  saveUserConfig: mockSaveUserConfig,
  getUserConfig: mockGetUserConfig,
}));

describe('config handlers', () => {
  beforeEach(() => {
    mockSaveUserConfig.mockClear();
    mockGetUserConfig.mockClear();
  });

  describe('saveConfig', () => {
    test('returns 401 when userId is missing', async () => {
      const event = {
        requestContext: {
          authorizer: {},
        },
        body: JSON.stringify({ platform: 'alexa', mode: 'simple' }),
      } as any as APIGatewayProxyEvent;

      const result = await saveConfig(event);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body).error).toContain('Unauthorized');
    });

    test('returns 400 when body is missing', async () => {
      const event = {
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' },
     