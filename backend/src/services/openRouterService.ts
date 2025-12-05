import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Initialize SSM client for retrieving API key
const ssmClient = new SSMClient({});

let cachedApiKey: string | null = null;

/**
 * Retrieve OpenRouter API key from SSM Parameter Store
 */
async function getOpenRouterApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const parameterName = process.env.OPENROUTER_API_KEY_PARAM || '/haunted-home/openrouter-api-key';
  
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });

  const response = await ssmClient.send(command);
  
  if (!response.Parameter?.Value) {
    throw new Error('OpenRouter API key not found in SSM Parameter Store');
  }

  cachedApiKey = response.Parameter.Value;
  return cachedApiKey;
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter API with Claude Haiku 3.5
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  temperature: number = 0.7
): Promise<string> {
  const apiKey = await getOpenRouterApiKey();
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://kiro-haunting.me',
      'X-Title': 'Haunted Home Orchestrator',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-haiku',
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter API');
  }

  return data.choices[0].message.content;
}
