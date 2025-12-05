import { Device, DeviceType, VoiceCommand } from '../models/types';
import { callOpenRouter, OpenRouterMessage } from './openRouterService';
import { getSubAgentPrompt } from '../prompts/subAgents';
import { randomUUID } from 'crypto';

export interface SceneSetupResult {
  commands: VoiceCommand[];
  setupDuration: number;
  devicesConfigured: number;
}

export interface SetupProgress {
  totalDevices: number;
  completedDevices: number;
  currentDevice?: string;
  isComplete: boolean;
}

/**
 * Service for managing scene setup orchestration
 */
export class SceneSetupService {
  private userId: string;
  private config: any; // UserConfig type
  private setupProgress: SetupProgress;

  constructor(userId: string, config: any) {
    this.userId = userId;
    this.config = config;
    this.setupProgress = {
      totalDevices: 0,
      completedDevices: 0,
      isComplete: false,
    };
  }

  /**
   * Execute scene setup for all enabled devices sequentially
   */
  async executeSceneSetup(devices: Device[]): Promise<SceneSetupResult> {
    const startTime = Date.now();
    const enabledDevices = devices.filter(d => d.enabled);
    
    this.setupProgress = {
      totalDevices: enabledDevices.length,
      completedDevices: 0,
      isComplete: false,
    };

    const commands: VoiceCommand[] = [];

    // Configure each device sequentially
    for (const device of enabledDevices) {
      this.setupProgress.currentDevice = device.name;
      
      try {
        const setupCommand = await this.generateSetupCommand(device);
        if (setupCommand) {
          commands.push(setupCommand);
        }
        
        this.setupProgress.completedDevices++;
      } catch (error) {
        console.error(`Failed to setup device ${device.name}:`, error);
        // Continue with other devices even if one fails
        this.setupProgress.completedDevices++;
      }
    }

    this.setupProgress.isComplete = true;
    this.setupProgress.currentDevice = undefined;

    const setupDuration = Date.now() - startTime;

    return {
      commands,
      setupDuration,
      devicesConfigured: commands.length,
    };
  }

  /**
   * Generate a setup command for a specific device
   */
  async generateSetupCommand(device: Device): Promise<VoiceCommand | null> {
    try {
      // Use custom prompt if available, otherwise use default
      const devicePrompt = device.customPrompt || device.defaultPrompt;
      
      // Map DeviceType enum to string literal type
      const deviceTypeStr = device.type as 'light' | 'speaker' | 'tv' | 'smart_plug';
      
      // Get the appropriate system prompt for scene setup
      const systemPrompt = getSubAgentPrompt(deviceTypeStr, {
        devices: [device],
        platform: this.config.platform,
        theme: this.config.activeTheme || 'Classic Ghost',
        epilepsySafeMode: this.config.epilepsySafeMode,
      });

      // Create scene setup specific prompt
      const sceneSetupPrompt = `${systemPrompt}

SCENE SETUP MODE: You are configuring this device for the initial haunted atmosphere. Generate a command that will set up the device to create the perfect spooky ambiance. This is the opening scene setup, not a random trigger.

Device-specific behavior: ${devicePrompt}

Generate a JSON response with the setup command for device "${device.name}".`;

      const messages: OpenRouterMessage[] = [
        { role: 'system', content: sceneSetupPrompt },
        { role: 'user', content: `Set up ${device.name} for the haunted scene.` },
      ];

      const response = await callOpenRouter(messages, 0.7); // Lower temperature for more consistent setup
      const command = this.parseCommandResponse(response, device);

      return command;
    } catch (error) {
      console.error(`Error generating setup command for device ${device.name}:`, error);
      return null;
    }
  }

  /**
   * Parse AI response to extract voice command
   */
  private parseCommandResponse(response: string, device: Device): VoiceCommand | null {
    try {
      // Look for JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', response);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.commandText) {
        console.error('Missing commandText in parsed response:', parsed);
        return null;
      }

      return {
        commandId: randomUUID(),
        agentType: device.type,
        deviceName: device.name,
        commandText: parsed.commandText,
        timestamp: new Date().toISOString(),
        spoken: false,
        reasoning: parsed.reasoning || 'Scene setup command',
      };
    } catch (error) {
      console.error('Failed to parse command response:', error);
      return null;
    }
  }

  /**
   * Get current setup progress
   */
  getSetupProgress(): SetupProgress {
    return { ...this.setupProgress };
  }

  /**
   * Track setup progress for a specific session
   */
  async trackSetupProgress(sessionId: string): Promise<SetupProgress> {
    // In a real implementation, this might fetch progress from a database
    // For now, return the current in-memory progress
    return this.getSetupProgress();
  }
}