import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserConfig } from '../services/configService';
import { getUserDevices } from '../services/deviceService';
import { getSettings } from '../services/settingsService';
import { 
  createSession, 
  getActiveSession, 
  stopSession,
  markCommandSpoken,
  updateCommandQueue,
  EnhancedHauntingService
} from '../services/hauntingService';
import { Orchestrator } from '../services/orchestratorService';
import { SceneSetupService } from '../services/sceneSetupService';
import { orchestratorConfig } from '../config/orchestrator';

// Store active orchestrators and scene setup services in memory (Lambda container reuse)
const activeOrchestrators = new Map<string, Orchestrator>();
const activeSceneSetups = new Map<string, SceneSetupService>();
const activeHauntingServices = new Map<string, EnhancedHauntingService>();

/**
 * Lambda handler for starting a haunting session (POST /haunting/start)
 */
export async function startHaunting(
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

    // Check if there's already an active session
    const existingSession = await getActiveSession(userId);
    if (existingSession) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'A haunting session is already active',
          sessionId: existingSession.sessionId,
        }),
      };
    }

    // Get user config, devices, and settings
    const config = await getUserConfig(userId);
    if (!config) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'User configuration not found. Please complete setup first.' }),
      };
    }

    const devices = await getUserDevices(userId);
    const enabledDevices = devices.filter(d => d.enabled);
    
    if (enabledDevices.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No enabled devices found. Please add devices first.' }),
      };
    }

    // Get orchestrator settings
    const settings = await getSettings(userId);
    
    // Create enhanced haunting service with settings
    const hauntingService = new EnhancedHauntingService(settings);
    activeHauntingServices.set(userId, hauntingService);

    // PHASE 1: Scene Setup
    const sceneSetupService = new SceneSetupService(userId, config);
    activeSceneSetups.set(userId, sceneSetupService);
    
    const sceneSetupResult = await sceneSetupService.executeSceneSetup(enabledDevices);
    
    // PHASE 2: Create orchestrator for random triggers
    const orchestrator = new Orchestrator(userId, config, enabledDevices);
    const randomCommands = await orchestrator.start();
    
    // Store orchestrator in memory
    activeOrchestrators.set(userId, orchestrator);
    
    // Combine scene setup commands with initial random commands
    const allCommands = [...sceneSetupResult.commands, ...randomCommands];
    
    // Create session in DynamoDB
    const session = await createSession(userId, config.mode, allCommands);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Haunting started successfully',
        sessionId: session.sessionId,
        sceneSetup: {
          devicesConfigured: sceneSetupResult.devicesConfigured,
          setupDuration: sceneSetupResult.setupDuration,
        },
        commandsGenerated: allCommands.length,
        deviceCount: enabledDevices.length,
        phases: ['scene_setup', 'random_triggers'],
      }),
    };
  } catch (error) {
    console.error('Error starting haunting:', error);
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
 * Lambda handler for stopping a haunting session (POST /haunting/stop)
 */
export async function stopHaunting(
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

    // Get active session
    const session = await getActiveSession(userId);
    if (!session) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No active haunting session found' }),
      };
    }

    // Stop the orchestrator if it exists in memory
    const orchestrator = activeOrchestrators.get(userId);
    if (orchestrator) {
      orchestrator.stop();
      activeOrchestrators.delete(userId);
    }
    
    // Clean up scene setup service
    activeSceneSetups.delete(userId);
    
    // Clean up haunting service
    activeHauntingServices.delete(userId);

    // Mark session as stopped in DynamoDB
    await stopSession(userId, session.sessionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Haunting stopped successfully',
        sessionId: session.sessionId,
      }),
    };
  } catch (error) {
    console.error('Error stopping haunting:', error);
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
 * Lambda handler for getting scene setup progress (GET /haunting/setup-progress)
 */
export async function getSetupProgress(
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

    // Get scene setup service from memory
    const sceneSetupService = activeSceneSetups.get(userId);
    
    if (!sceneSetupService) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No active scene setup found' }),
      };
    }

    const progress = sceneSetupService.getSetupProgress();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ progress }),
    };
  } catch (error) {
    console.error('Error getting setup progress:', error);
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
 * Lambda handler for updating orchestrator settings during active session (PUT /haunting/settings)
 */
export async function updateLiveSettings(
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

    const newSettings = JSON.parse(event.body);
    
    // Get haunting service from memory
    const hauntingService = activeHauntingServices.get(userId);
    
    if (!hauntingService) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No active haunting session found' }),
      };
    }

    // Update settings in the active service
    hauntingService.updateSettings(newSettings);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Settings updated successfully',
        settings: hauntingService.getSettings(),
      }),
    };
  } catch (error) {
    console.error('Error updating live settings:', error);
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
 * Lambda handler for getting the next command (GET /haunting/command)
 */
export async function getNextCommand(
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

    // Get active session
    const session = await getActiveSession(userId);
    if (!session) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No active haunting session found' }),
      };
    }

    // Get orchestrator from memory
    const orchestrator = activeOrchestrators.get(userId);
    
    if (!orchestrator) {
      // If orchestrator is not in memory (Lambda cold start), return from session
      const commandQueue = session.commandQueue || [];
      const nextCommand = commandQueue.find(cmd => !cmd.spoken);
      
      if (!nextCommand) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ 
            command: null,
            message: 'No commands available. Please restart the haunting.',
          }),
        };
      }
      
      // Mark as spoken in DynamoDB
      await markCommandSpoken(userId, session.sessionId, nextCommand.commandId);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          command: nextCommand,
          queueSize: commandQueue.filter(cmd => !cmd.spoken).length - 1,
        }),
      };
    }

    // Get next unspoken command (randomized)
    const nextCommand = orchestrator.getNextUnspokenCommand();
    
    if (!nextCommand) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          command: null,
          message: 'No commands available',
        }),
      };
    }

    // Mark command as spoken in orchestrator
    orchestrator.markCommandSpoken(nextCommand.commandId);
    
    // Mark command as spoken in DynamoDB
    await markCommandSpoken(userId, session.sessionId, nextCommand.commandId);
    
    // Sync the updated queue back to DynamoDB
    await updateCommandQueue(userId, session.sessionId, orchestrator.getCommandQueue());
    
    // Check if we need regeneration (orchestrator will handle it automatically)
    const unspokenCount = orchestrator.getUnspokenCount();
    if (orchestrator.needsRegeneration()) {
      console.log(`Queue running low (${unspokenCount} commands), orchestrator will generate more`);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        command: nextCommand,
        queueSize: unspokenCount - 1, // -1 because we just marked one as spoken
      }),
    };
  } catch (error) {
    console.error('Error getting next command:', error);
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
