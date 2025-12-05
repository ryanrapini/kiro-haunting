/**
 * Centralized API client for Haunted Home Orchestrator
 * Handles all backend API communication with authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || import.meta.env.VITE_API_URL || 'https://79zip4uoha.execute-api.us-east-1.amazonaws.com/prod';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Base fetch wrapper with auth and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// Type Definitions
// ============================================

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

export interface Device {
  id: string;
  userId: string;
  name: string;
  formalName: string;
  type: 'light' | 'speaker' | 'tv' | 'smart_plug';
  platform: 'alexa' | 'google';
  mode: 'simple' | 'connected';
  commandExamples?: string[];
  enabled: boolean;
  frequency: 'infrequent' | 'normal' | 'frequent';
  customPrompt?: string;
  defaultPrompt: string;
  selectionWeight: number;
  actionCount: number;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
  deviceSaved: boolean;
  device?: Device;
}

export interface VoiceCommand {
  commandId: string;
  agentType: string;
  deviceName: string;
  commandText: string;
  timestamp: string;
  spoken: boolean;
  reasoning?: string;
}

export interface HauntingSession {
  sessionId: string;
  message: string;
  commandsGenerated: number;
  deviceCount: number;
}

export interface NextCommandResponse {
  command: VoiceCommand | null;
  queueSize: number;
  message?: string;
}

export interface DeviceSettings {
  frequency?: 'infrequent' | 'normal' | 'frequent';
  customPrompt?: string;
  name?: string;
  formalName?: string;
}

export interface DeviceUpdates {
  name?: string;
  formalName?: string;
  frequency?: 'infrequent' | 'normal' | 'frequent';
  customPrompt?: string;
}

export interface OrchestratorSettings {
  userId: string;
  minTriggerInterval: number; // in milliseconds on backend, seconds on frontend
  maxTriggerInterval: number; // in milliseconds on backend, seconds on frontend
  epilepsyMode: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsUpdateRequest {
  minTriggerInterval?: number; // in seconds from frontend
  maxTriggerInterval?: number; // in seconds from frontend
  epilepsyMode?: boolean;
}

// ============================================
// Configuration API
// ============================================

export const configApi = {
  /**
   * Save user configuration
   */
  async saveConfig(platform: 'alexa' | 'google', mode: 'simple' | 'connected'): Promise<UserConfig> {
    return apiFetch<UserConfig>('/config', {
      method: 'POST',
      body: JSON.stringify({ platform, mode }),
    });
  },

  /**
   * Get user configuration
   */
  async getConfig(): Promise<UserConfig> {
    return apiFetch<UserConfig>('/config', {
      method: 'GET',
    });
  },
};

// ============================================
// Devices API
// ============================================

export const devicesApi = {
  /**
   * Chat with device setup agent
   */
  async chat(message: string, conversationHistory: ChatMessage[] = []): Promise<ChatResponse> {
    return apiFetch<ChatResponse>('/devices/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory }),
    });
  },

  /**
   * Get all user devices
   */
  async getDevices(): Promise<Device[]> {
    const response = await apiFetch<{ devices: Device[] }>('/devices', {
      method: 'GET',
    });
    return response.devices;
  },

  /**
   * Delete a device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    await apiFetch<{ success: boolean }>(`/devices/${deviceId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle device enabled/disabled state
   */
  async toggleDevice(deviceId: string, enabled: boolean): Promise<Device> {
    return apiFetch<Device>(`/devices/${deviceId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  },

  /**
   * Update device settings (frequency, custom prompt, name, etc.)
   */
  async updateDeviceSettings(deviceId: string, settings: DeviceSettings): Promise<Device> {
    return apiFetch<Device>(`/devices/${deviceId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  /**
   * Generate default prompt for a device type
   */
  async generateDefaultPrompt(deviceType: string): Promise<{ prompt: string }> {
    return apiFetch<{ prompt: string }>('/devices/default-prompt', {
      method: 'POST',
      body: JSON.stringify({ deviceType }),
    });
  },
};

// ============================================
// Haunting API
// ============================================

export const hauntingApi = {
  /**
   * Start a haunting session
   */
  async start(): Promise<HauntingSession> {
    return apiFetch<HauntingSession>('/haunting/start', {
      method: 'POST',
    });
  },

  /**
   * Stop the active haunting session
   */
  async stop(): Promise<{ message: string; sessionId: string }> {
    return apiFetch<{ message: string; sessionId: string }>('/haunting/stop', {
      method: 'POST',
    });
  },

  /**
   * Get the next command to speak
   */
  async getNextCommand(): Promise<NextCommandResponse> {
    return apiFetch<NextCommandResponse>('/haunting/command', {
      method: 'GET',
    });
  },
};

// ============================================
// Settings API
// ============================================

export const settingsApi = {
  /**
   * Get orchestrator settings
   */
  async getSettings(): Promise<OrchestratorSettings> {
    const response = await apiFetch<OrchestratorSettings>('/settings', {
      method: 'GET',
    });
    
    // Convert milliseconds to seconds for frontend display
    return {
      ...response,
      minTriggerInterval: Math.round(response.minTriggerInterval / 1000),
      maxTriggerInterval: Math.round(response.maxTriggerInterval / 1000),
    };
  },

  /**
   * Update orchestrator settings
   */
  async updateSettings(settings: SettingsUpdateRequest): Promise<OrchestratorSettings> {
    // Convert seconds to milliseconds for backend
    const backendSettings = {
      ...settings,
      minTriggerInterval: settings.minTriggerInterval ? settings.minTriggerInterval * 1000 : undefined,
      maxTriggerInterval: settings.maxTriggerInterval ? settings.maxTriggerInterval * 1000 : undefined,
    };
    
    const response = await apiFetch<OrchestratorSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(backendSettings),
    });
    
    // Convert milliseconds to seconds for frontend display
    return {
      ...response,
      minTriggerInterval: Math.round(response.minTriggerInterval / 1000),
      maxTriggerInterval: Math.round(response.maxTriggerInterval / 1000),
    };
  },
};

// ============================================
// Export combined API client
// ============================================

export const api = {
  config: configApi,
  devices: devicesApi,
  haunting: hauntingApi,
  settings: settingsApi,
};

export default api;
