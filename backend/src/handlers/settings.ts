import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSettings, updateSettings, validateSettings } from '../services/settingsService';
import { OrchestratorSettings } from '../models/types';

/**
 * Lambda handler for retrieving orchestrator settings (GET /settings)
 */
export async function getSettingsHandler(
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

    // Retrieve settings
    const settings = await getSettings(userId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(settings),
    };
  } catch (error) {
    console.error('Error retrieving orchestrator settings:', error);
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
 * Lambda handler for updating orchestrator settings (PUT /settings)
 */
export async function updateSettingsHandler(
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

    let settingsData: Partial<OrchestratorSettings>;
    try {
      settingsData = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Validate settings
    const validation = validateSettings(settingsData);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Invalid settings',
          details: validation.errors
        }),
      };
    }

    // Additional validation: if both min and max are provided, ensure min <= max
    if (
      settingsData.minTriggerInterval !== undefined &&
      settingsData.maxTriggerInterval !== undefined &&
      settingsData.minTriggerInterval > settingsData.maxTriggerInterval
    ) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Minimum trigger interval must be less than or equal to maximum trigger interval'
        }),
      };
    }

    // Update settings
    const updatedSettings = await updateSettings(userId, settingsData);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedSettings),
    };
  } catch (error) {
    console.error('Error updating orchestrator settings:', error);
    
    // Handle validation errors specifically
    if (error instanceof Error && error.message.includes('Invalid settings')) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: error.message
        }),
      };
    }

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