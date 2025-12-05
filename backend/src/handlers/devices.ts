import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { callOpenRouter, OpenRouterMessage } from '../services/openRouterService';
import { getDeviceSetupSystemPrompt } from '../prompts/deviceSetupAgent';
import { saveDevice, getUserDevices, deleteDevice } from '../services/deviceService';
import { getUserConfig } from '../services/configService';
import { DeviceType } from '../models/types';

/**
 * Lambda handler for device chat endpoint (POST /devices/chat)
 * Handles conversational device setup with AI agent
 */
export async function deviceChat(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Extract userId from Cognito authorizer context
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized: No user ID found' }),
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { message, conversationHistory } = JSON.parse(event.body);

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    // Get user config to determine platform
    const config = await getUserConfig(userId);
    const platform = config?.platform || 'alexa';

    // Build conversation messages
    const systemPrompt = getDeviceSetupSystemPrompt(platform);
    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call OpenRouter API
    const response = await callOpenRouter(messages, 0.7);

    // Parse response to check if device should be saved
    const deviceData = extractDeviceData(response);
    
    if (deviceData) {
      // Save device to DynamoDB
      const savedDevice = await saveDevice(userId, {
        name: deviceData.name,
        formalName: deviceData.formalName,
        type: deviceData.type,
        platform,
        mode: 'simple',
        commandExamples: deviceData.commandExamples,
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          response,
          deviceSaved: true,
          device: savedDevice,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        response,
        deviceSaved: false,
      }),
    };
  } catch (error) {
    console.error('Error in device chat:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

/**
 * Extract device data from agent response if present
 */
function extractDeviceData(response: string): {
  name: string;
  formalName: string;
  type: DeviceType;
  commandExamples: string[];
} | null {
  try {
    // Look for JSON code block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      return null;
    }

    const jsonData = JSON.parse(jsonMatch[1]);
    
    if (jsonData.action === 'save_device' && jsonData.device) {
      const device = jsonData.device;
      
      // Validate device type
      const validTypes = Object.values(DeviceType);
      if (!validTypes.includes(device.type)) {
        console.error('Invalid device type:', device.type);
        return null;
      }

      return {
        name: device.name,
        formalName: device.formalName,
        type: device.type as DeviceType,
        commandExamples: device.commandExamples || [],
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting device data:', error);
    return null;
  }
}

/**
 * Lambda handler for getting all user devices (GET /devices)
 */
export async function getDevices(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Extract userId from Cognito authorizer context
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized: No user ID found' }),
      };
    }

    // Get all devices for user
    const devices = await getUserDevices(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ devices }),
    };
  } catch (error) {
    console.error('Error getting devices:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}

/**
 * Lambda handler for deleting a device (DELETE /devices/:id)
 */
export async function deleteDeviceHandler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Extract userId from Cognito authorizer context
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Unauthorized: No user ID found' }),
      };
    }

    // Get device ID from path parameters
    const deviceId = event.pathParameters?.id;
    
    if (!deviceId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Device ID is required' }),
      };
    }

    // Delete device
    await deleteDevice(userId, deviceId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error deleting device:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}
