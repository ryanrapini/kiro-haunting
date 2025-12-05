import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { saveConfig } from './config';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return saveConfig(event);
};
