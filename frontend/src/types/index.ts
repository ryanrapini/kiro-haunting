// Shared types for frontend application

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
  enabled: boolean;
  createdAt: string;
}

export interface UserConfig {
  userId: string;
  platform: 'alexa' | 'google';
  mode: 'simple' | 'connected';
  selectedDevices: string[];
  activeTheme: string;
  epilepsySafeMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceCommand {
  commandId: string;
  agentType: DeviceType;
  deviceName: string;
  commandText: string;
  timestamp: string;
  spoken: boolean;
}

export interface HauntingSession {
  userId: string;
  sessionId: string;
  isActive: boolean;
  mode: 'simple' | 'connected';
  startedAt: string;
  stoppedAt?: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  intensity: 'subtle' | 'moderate' | 'intense';
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}
