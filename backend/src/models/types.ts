// Core type definitions for Haunted Home Orchestrator

export enum DeviceType {
  LIGHT = 'light',
  SPEAKER = 'speaker',
  TV = 'tv',
  SMART_PLUG = 'smart_plug',
  UNKNOWN = 'unknown',
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
