// Core type definitions for Haunted Home Orchestrator

export enum DeviceType {
  LIGHT = 'light',
  SPEAKER = 'speaker',
  TV = 'tv',
  SMART_PLUG = 'smart_plug',
  UNKNOWN = 'unknown',
}

export enum FrequencyLevel {
  INFREQUENT = 'infrequent',
  NORMAL = 'normal',
  FREQUENT = 'frequent',
}

export interface Device {
  id: string;
  userId: string;
  name: string;
  formalName: string;
  type: DeviceType;
  platform: 'alexa' | 'google';
  mode: 'simple' | 'connected';
  capabilities?: DeviceCapability[];
  currentState?: DeviceState;
  commandExamples?: string[];
  enabled: boolean;
  frequency: FrequencyLevel;
  customPrompt?: string;
  defaultPrompt: string;
  selectionWeight: number;
  actionCount: number;
  createdAt: string;
}

export interface DeviceCapability {
  type: string;
  min?: number;
  max?: number;
  values?: string[];
}

export interface DeviceState {
  power: boolean;
  brightness?: number;
  color?: RGB;
  volume?: number;
  input?: string;
  [key: string]: any;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface VoiceCommand {
  commandId: string;
  agentType: DeviceType;
  deviceName: string;
  commandText: string;
  timestamp: string;
  spoken: boolean;
  reasoning?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  agentPrompts: Record<DeviceType, string>;
  intensity: 'subtle' | 'moderate' | 'intense';
}

export interface UserConfig {
  userId: string;
  platform: 'alexa' | 'google';
  mode: 'simple' | 'connected';
  selectedDevices: string[];
  activeTheme: string;
  epilepsySafeMode: boolean;
  customPrompts: Record<DeviceType, string>;
  platformConfig?: PlatformConfig;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConfig {
  platform: 'alexa' | 'google';
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface HauntingSession {
  userId: string;
  sessionId: string;
  isActive: boolean;
  mode: 'simple' | 'connected';
  startedAt: string;
  stoppedAt?: string;
  commandQueue?: VoiceCommand[];
}

export interface AgentAction {
  agentType: DeviceType;
  deviceId: string;
  action: string;
  parameters: Record<string, any>;
  timestamp: Date;
  reasoning?: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  agentType: DeviceType;
  deviceName: string;
  action: string;
  success: boolean;
  details?: string;
}

// Frequency weights for device selection
export const FREQUENCY_WEIGHTS: Record<FrequencyLevel, number> = {
  [FrequencyLevel.INFREQUENT]: 0.5,
  [FrequencyLevel.NORMAL]: 1.0,
  [FrequencyLevel.FREQUENT]: 2.0,
};

// Default prompts by device type
export const DEFAULT_PROMPTS: Record<DeviceType, string> = {
  [DeviceType.LIGHT]: "Set the lights to a dim, eerie setting with Halloween colors like deep purple, burnt orange, or flickering candlelight whites. Create an ominous atmosphere.",
  [DeviceType.SPEAKER]: "Play spooky atmospheric sounds such as crow caws, distant screams, ghostly whispers, howling wind, or the song 'Spooky Scary Skeletons'.",
  [DeviceType.TV]: "Find and play 'haunted house atmosphere' videos from YouTube, focusing on creepy ambiance, flickering candles, or ghostly scenes.",
  [DeviceType.SMART_PLUG]: "Randomly turn the connected device on or off to create unexpected and unsettling moments.",
  [DeviceType.UNKNOWN]: "Perform a spooky action appropriate for this device type.",
};

export interface OrchestratorSettings {
  userId: string;
  minTriggerInterval: number; // milliseconds
  maxTriggerInterval: number; // milliseconds
  epilepsyMode: boolean;
  createdAt: string;
  updatedAt: string;
}

// Validation constraints for orchestrator settings
export const SETTINGS_CONSTRAINTS = {
  minTriggerInterval: { min: 1000, max: 300000 }, // 1s to 5min
  maxTriggerInterval: { min: 1000, max: 600000 }, // 1s to 10min
} as const;
