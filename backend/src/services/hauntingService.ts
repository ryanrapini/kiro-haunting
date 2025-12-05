import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand,
  UpdateCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import { HauntingSession, VoiceCommand } from '../models/types';
import { randomUUID } from 'crypto';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE = process.env.HAUNTING_SESSIONS_TABLE || 'HauntedHome-HauntingSessions';

/**
 * Create a new haunting session
 */
export async function createSession(
  userId: string,
  mode: 'simple' | 'connected',
  commandQueue: VoiceCommand[]
): Promise<HauntingSession> {
  const now = new Date().toISOString();
  
  const session: HauntingSession = {
    userId,
    sessionId: randomUUID(),
    isActive: true,
    mode,
    startedAt: now,
    commandQueue,
  };

  await docClient.send(
    new PutCommand({
      TableName: SESSIONS_TABLE,
      Item: session,
    })
  );

  return session;
}

/**
 * Get the active session for a user
 */
export async function getActiveSession(userId: string): Promise<HauntingSession | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: SESSIONS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isActive': true,
      },
      ScanIndexForward: false, // Get most recent first
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return null;
  }

  return result.Items[0] as HauntingSession;
}

/**
 * Get a specific session by ID
 */
export async function getSession(userId: string, sessionId: string): Promise<HauntingSession | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        userId,
        sessionId,
      },
    })
  );

  if (!result.Item) {
    return null;
  }

  return result.Item as HauntingSession;
}

/**
 * Update session to mark it as stopped
 */
export async function stopSession(userId: string, sessionId: string): Promise<void> {
  const now = new Date().toISOString();
  
  await docClient.send(
    new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        userId,
        sessionId,
      },
      UpdateExpression: 'SET isActive = :isActive, stoppedAt = :stoppedAt',
      ExpressionAttributeValues: {
        ':isActive': false,
        ':stoppedAt': now,
      },
    })
  );
}

/**
 * Update the command queue for a session
 */
export async function updateCommandQueue(
  userId: string,
  sessionId: string,
  commandQueue: VoiceCommand[]
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        userId,
        sessionId,
      },
      UpdateExpression: 'SET commandQueue = :commandQueue',
      ExpressionAttributeValues: {
        ':commandQueue': commandQueue,
      },
    })
  );
}

/**
 * Mark a command as spoken
 */
export async function markCommandSpoken(
  userId: string,
  sessionId: string,
  commandId: string
): Promise<void> {
  const session = await getSession(userId, sessionId);
  
  if (!session || !session.commandQueue) {
    throw new Error('Session or command queue not found');
  }

  // Update the spoken flag for the specific command
  const updatedQueue = session.commandQueue.map(cmd => 
    cmd.commandId === commandId 
      ? { ...cmd, spoken: true }
      : cmd
  );

  await updateCommandQueue(userId, sessionId, updatedQueue);
}
