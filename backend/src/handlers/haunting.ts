import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserConfig } from '../services/configService';
import { getUserDevices } from '../services/deviceService';
import { 
  createSession, 
  getActiveSession, 
  stopSession,
  markCommandSpoken,
  updateCommandQueue
} from '../services/hauntingService';
import { Orchestrator } from '../services/orchestratorService';
import { orchestratorConfig } from '../config/orchestrator';

// Store active orchestrators in memory (Lambda container reuse)
const activeOrchestrators = new Map<string, Orchestrator>();

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

    // Get user config and devices
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

    // Create orchestrator and start it
    const orchestrator = new Orchestrator(userId, config, enabledDevices);
    const initialCommands = await orchestrator.start();
    
    // Store orchestrator in memory
    activeOrchestrators.set(userId, orchestrator);
    
    // Create session in DynamoDB
    const session = await createSession(userId, config.mode, initialCommands);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Haunting started successfully',
        sessionId: session.sessionId,
        commandsGenerated: initialCommands.length,
        deviceCount: enabledDevices.length,
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
