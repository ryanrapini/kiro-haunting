import { Device, DeviceType, VoiceCommand, UserConfig, FREQUENCY_WEIGHTS } from '../models/types';
import { callOpenRouter, OpenRouterMessage } from './openRouterService';
import { getSubAgentPrompt } from '../prompts/subAgents';
import { orchestratorConfig, getRandomInterval } from '../config/orchestrator';
import { randomUUID } from 'crypto';

/**
 * State tracking for each sub-agent
 */
interface SubAgentState {
  deviceType: DeviceType;
  isRunning: boolean;
  lastFiredAt: number | null;
  devices: Device[];
}

/**
 * Frequency-weighted device selector for enhanced orchestration
 */
export class FrequencyWeightedSelector {
  /**
   * Select a random device based on frequency weights
   */
  selectRandomDevice(devices: Device[]): Device | null {
    const enabledDevices = devices.filter(d => d.enabled);
    
    if (enabledDevices.length === 0) {
      return null;
    }

    const deviceWeights = this.calculateDeviceWeights(enabledDevices);
    const totalWeight = Array.from(deviceWeights.values()).reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      // Fallback to random selection if no weights
      return enabledDevices[Math.floor(Math.random() * enabledDevices.length)];
    }

    let random = Math.random() * totalWeight;
    
    for (const device of enabledDevices) {
      const weight = deviceWeights.get(device.id) || 0;
      random -= weight;
      if (random <= 0) {
        return device;
      }
    }
    
    // Fallback to last device
    return enabledDevices[enabledDevices.length - 1];
  }

  /**
   * Calculate selection weights for all devices
   */
  calculateDeviceWeights(devices: Device[]): Map<string, number> {
    const weights = new Map<string, number>();
    
    for (const device of devices) {
      if (!device.enabled) {
        weights.set(device.id, 0);
        continue;
      }
      
      const frequencyWeight = FREQUENCY_WEIGHTS[device.frequency] || FREQUENCY_WEIGHTS.NORMAL;
      weights.set(device.id, frequencyWeight);
    }
    
    return weights;
  }
}

/**
 * Orchestrator manages sub-agents and command generation
 */
export class Orchestrator {
  private subAgentStates: Map<DeviceType, SubAgentState>;
  private userId: string;
  private config: UserConfig;
  private commandQueue: VoiceCommand[];
  private isActive: boolean;
  private timers: NodeJS.Timeout[];
  private frequencySelector: FrequencyWeightedSelector;
  private allDevices: Device[];

  constructor(userId: string, config: UserConfig, devices: Device[]) {
    this.userId = userId;
    this.config = config;
    this.commandQueue = [];
    this.isActive = false;
    this.timers = [];
    this.subAgentStates = new Map();
    this.frequencySelector = new FrequencyWeightedSelector();
    this.allDevices = devices;

    // Group devices by type and initialize sub-agent states
    this.initializeSubAgents(devices);
  }

  /**
   * Initialize sub-agent states based on available devices
   */
  private initializeSubAgents(devices: Device[]): void {
    // Group devices by type
    const devicesByType = new Map<DeviceType, Device[]>();
    
    for (const device of devices) {
      if (!device.enabled) continue;
      
      if (!devicesByType.has(device.type)) {
        devicesByType.set(device.type, []);
      }
      devicesByType.get(device.type)!.push(device);
    }

    // Create sub-agent state for each device type that has devices
    for (const [deviceType, devicesOfType] of devicesByType) {
      if (deviceType === DeviceType.UNKNOWN) continue;
      
      this.subAgentStates.set(deviceType, {
        deviceType,
        isRunning: false,
        lastFiredAt: null,
        devices: devicesOfType,
      });
    }
  }

  /**
   * Start the orchestrator - begins firing sub-agents at random intervals
   */
  async start(): Promise<VoiceCommand[]> {
    this.isActive = true;
    
    // Generate initial batch of commands from all agents
    const initialCommands = await this.generateInitialCommands();
    this.commandQueue.push(...initialCommands);
    
    // Start the continuous firing loop
    this.scheduleNextAgentFire();
    
    return this.commandQueue;
  }

  /**
   * Stop the orchestrator - clears all timers
   */
  stop(): void {
    this.isActive = false;
    
    // Clear all scheduled timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
  }

  /**
   * Generate initial commands from all available sub-agents
   */
  private async generateInitialCommands(): Promise<VoiceCommand[]> {
    const allCommands: VoiceCommand[] = [];
    
    // Fire all sub-agents in parallel to get initial commands
    const promises = Array.from(this.subAgentStates.values()).map(state =>
      this.fireSubAgent(state.deviceType)
    );
    
    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allCommands.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error('Failed to generate initial commands:', result.reason);
      }
    }
    
    return allCommands;
  }

  /**
   * Schedule the next sub-agent to fire after a random interval
   */
  private scheduleNextAgentFire(): void {
    if (!this.isActive) return;
    
    const interval = getRandomInterval();
    
    const timer = setTimeout(async () => {
      await this.fireRandomAvailableAgent();
      this.scheduleNextAgentFire(); // Schedule the next one
    }, interval);
    
    this.timers.push(timer);
  }

  /**
   * Fire a random sub-agent that is not currently running, using frequency-weighted device selection
   */
  private async fireRandomAvailableAgent(): Promise<void> {
    // Use frequency-weighted selection to pick a device
    const selectedDevice = this.frequencySelector.selectRandomDevice(this.allDevices);
    
    if (!selectedDevice) {
      console.log('No enabled devices available for selection');
      return;
    }
    
    // Get the sub-agent state for this device type
    const agentState = this.subAgentStates.get(selectedDevice.type);
    
    if (!agentState) {
      console.log(`No sub-agent available for device type: ${selectedDevice.type}`);
      return;
    }
    
    if (agentState.isRunning) {
      console.log(`Sub-agent ${selectedDevice.type} is already running, skipping`);
      return;
    }
    
    try {
      const commands = await this.fireSubAgentForDevice(selectedDevice);
      if (commands) {
        this.commandQueue.push(...commands);
      }
    } catch (error) {
      console.error(`Failed to fire sub-agent for device ${selectedDevice.name}:`, error);
    }
  }

  /**
   * Fire a sub-agent for a specific device (frequency-weighted selection)
   */
  private async fireSubAgentForDevice(selectedDevice: Device): Promise<VoiceCommand[] | null> {
    const state = this.subAgentStates.get(selectedDevice.type);
    
    if (!state) {
      console.error(`No state found for device type: ${selectedDevice.type}`);
      return null;
    }
    
    if (state.isRunning) {
      console.log(`Sub-agent ${selectedDevice.type} is already running, skipping`);
      return null;
    }
    
    // Mark as running
    state.isRunning = true;
    state.lastFiredAt = Date.now();
    
    try {
      // Map DeviceType enum to string literal type
      const deviceTypeStr = selectedDevice.type as 'light' | 'speaker' | 'tv' | 'smart_plug';
      
      // Use custom prompt if available, otherwise use default
      const devicePrompt = selectedDevice.customPrompt || selectedDevice.defaultPrompt;
      
      // Get the appropriate system prompt with device-specific behavior
      const systemPrompt = getSubAgentPrompt(deviceTypeStr, {
        devices: [selectedDevice], // Focus on the selected device
        platform: this.config.platform,
        theme: this.config.activeTheme || 'Classic Ghost',
        epilepsySafeMode: this.config.epilepsySafeMode,
      });
      
      // Enhanced prompt with custom device behavior
      const enhancedPrompt = `${systemPrompt}

Device-specific behavior: ${devicePrompt}

Focus on device "${selectedDevice.name}" for this command.`;
      
      const messages: OpenRouterMessage[] = [
        { role: 'system', content: enhancedPrompt },
        { role: 'user', content: `Generate a spooky command for ${selectedDevice.name}.` },
      ];
      
      const response = await callOpenRouter(messages, 0.8);
      const command = this.parseCommandResponse(response, selectedDevice.type);
      
      if (command) {
        // Update device action count
        selectedDevice.actionCount = (selectedDevice.actionCount || 0) + 1;
        return [command];
      }
      
      return null;
    } catch (error) {
      console.error(`Error firing sub-agent for device ${selectedDevice.name}:`, error);
      return null;
    } finally {
      // Mark as no longer running
      state.isRunning = false;
    }
  }

  /**
   * Fire a specific sub-agent to generate commands
   */
  private async fireSubAgent(deviceType: DeviceType): Promise<VoiceCommand[] | null> {
    const state = this.subAgentStates.get(deviceType);
    
    if (!state) {
      console.error(`No state found for device type: ${deviceType}`);
      return null;
    }
    
    if (state.isRunning) {
      console.log(`Sub-agent ${deviceType} is already running, skipping`);
      return null;
    }
    
    // Mark as running
    state.isRunning = true;
    state.lastFiredAt = Date.now();
    
    try {
      // Map DeviceType enum to string literal type
      const deviceTypeStr = deviceType as 'light' | 'speaker' | 'tv' | 'smart_plug';
      
      // Get the appropriate system prompt
      const systemPrompt = getSubAgentPrompt(deviceTypeStr, {
        devices: state.devices,
        platform: this.config.platform,
        theme: this.config.activeTheme || 'Classic Ghost',
        epilepsySafeMode: this.config.epilepsySafeMode,
      });
      
      // Generate multiple commands
      const commands: VoiceCommand[] = [];
      
      for (let i = 0; i < orchestratorConfig.commandsPerAgentCall; i++) {
        const messages: OpenRouterMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate the next spooky command.' },
        ];
        
        const response = await callOpenRouter(messages, 0.8);
        const command = this.parseCommandResponse(response, deviceType);
        
        if (command) {
          commands.push(command);
        }
      }
      
      return commands;
    } catch (error) {
      console.error(`Error firing sub-agent ${deviceType}:`, error);
      return null;
    } finally {
      // Mark as no longer running
      state.isRunning = false;
    }
  }

  /**
   * Parse AI response to extract voice command
   */
  private parseCommandResponse(response: string, agentType: DeviceType): VoiceCommand | null {
    try {
      // Look for JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', response);
        return null;
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.commandText || !parsed.deviceName) {
        console.error('Missing required fields in parsed response:', parsed);
        return null;
      }
      
      return {
        commandId: randomUUID(),
        agentType,
        deviceName: parsed.deviceName,
        commandText: parsed.commandText,
        timestamp: new Date().toISOString(),
        spoken: false,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Failed to parse command response:', error);
      return null;
    }
  }

  /**
   * Get the current command queue
   */
  getCommandQueue(): VoiceCommand[] {
    return this.commandQueue;
  }

  /**
   * Update the command queue (used when syncing with DynamoDB)
   */
  updateCommandQueue(commands: VoiceCommand[]): void {
    this.commandQueue = commands;
  }

  /**
   * Mark a command as spoken in the local queue
   */
  markCommandSpoken(commandId: string): void {
    const command = this.commandQueue.find(cmd => cmd.commandId === commandId);
    if (command) {
      command.spoken = true;
    }
  }

  /**
   * Get the next unspoken command (randomized order)
   */
  getNextUnspokenCommand(): VoiceCommand | null {
    const unspokenCommands = this.commandQueue.filter(cmd => !cmd.spoken);
    
    if (unspokenCommands.length === 0) {
      return null;
    }
    
    // Return a random unspoken command for variety
    const randomIndex = Math.floor(Math.random() * unspokenCommands.length);
    return unspokenCommands[randomIndex];
  }

  /**
   * Check if queue needs regeneration
   */
  needsRegeneration(): boolean {
    const unspokenCommands = this.commandQueue.filter(cmd => !cmd.spoken);
    return unspokenCommands.length < orchestratorConfig.minQueueSize;
  }

  /**
   * Shuffle the command queue for randomization
   */
  private shuffleQueue(): void {
    // Fisher-Yates shuffle algorithm
    for (let i = this.commandQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.commandQueue[i], this.commandQueue[j]] = [this.commandQueue[j], this.commandQueue[i]];
    }
  }

  /**
   * Get count of unspoken commands
   */
  getUnspokenCount(): number {
    return this.commandQueue.filter(cmd => !cmd.spoken).length;
  }

  /**
   * Get sub-agent states for debugging
   */
  getSubAgentStates(): Map<DeviceType, SubAgentState> {
    return this.subAgentStates;
  }
}
