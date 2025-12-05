/**
 * Tests for sub-agent system prompts
 */

import {
  getLightsSubAgentPrompt,
  getAudioSubAgentPrompt,
  getTVSubAgentPrompt,
  getSmartPlugSubAgentPrompt,
  getSubAgentPrompt,
} from './subAgents';
import { Device, DeviceType } from '../models/types';

describe('Sub-Agent System Prompts', () => {
  const mockDevices: Device[] = [
    {
      id: '1',
      userId: 'user123',
      name: 'bedroom lamp',
      formalName: 'bedroom light',
      type: DeviceType.LIGHT,
      platform: 'alexa',
      mode: 'simple',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      userId: 'user123',
      name: 'living room speaker',
      formalName: 'living room echo',
      type: DeviceType.SPEAKER,
      platform: 'alexa',
      mode: 'simple',
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const context = {
    devices: mockDevices,
    platform: 'alexa' as const,
    theme: 'Classic Ghost',
    epilepsySafeMode: false,
  };

  describe('getLightsSubAgentPrompt', () => {
    it('should generate a prompt with device list', () => {
      const prompt = getLightsSubAgentPrompt(context);
      expect(prompt).toContain('bedroom lamp');
      expect(prompt).toContain('bedroom light');
    });

    it('should include platform-specific assistant name', () => {
      const alexaPrompt = getLightsSubAgentPrompt(context);
      expect(alexaPrompt).toContain('Alexa');

      const googlePrompt = getLightsSubAgentPrompt({
        ...context,
        platform: 'google',
      });
      expect(googlePrompt).toContain('Hey Google');
    });

    it('should include epilepsy warning when safe mode enabled', () => {
      const safePrompt = getLightsSubAgentPrompt({
        ...context,
        epilepsySafeMode: true,
      });
      expect(safePrompt).toContain('EPILEPSY-SAFE MODE');
      expect(safePrompt).toContain('rapid flashing');
    });

    it('should include theme information', () => {
      const prompt = getLightsSubAgentPrompt(context);
      expect(prompt).toContain('Classic Ghost');
    });
  });

  describe('getAudioSubAgentPrompt', () => {
    it('should generate a prompt with speaker devices', () => {
      const prompt = getAudioSubAgentPrompt(context);
      expect(prompt).toContain('living room speaker');
      expect(prompt).toContain('living room echo');
    });

    it('should include audio-specific command examples', () => {
      const prompt = getAudioSubAgentPrompt(context);
      expect(prompt).toContain('play spooky sounds');
      expect(prompt).toContain('volume');
    });
  });

  describe('getTVSubAgentPrompt', () => {
    it('should generate a prompt for TV control', () => {
      const tvContext = {
        ...context,
        devices: [
          {
            ...mockDevices[0],
            type: DeviceType.TV,
            name: 'living room TV',
            formalName: 'living room television',
          },
        ],
      };
      const prompt = getTVSubAgentPrompt(tvContext);
      expect(prompt).toContain('living room TV');
      expect(prompt).toContain('turn on');
      expect(prompt).toContain('turn off');
    });

    it('should include epilepsy warning when safe mode enabled', () => {
      const safePrompt = getTVSubAgentPrompt({
        ...context,
        epilepsySafeMode: true,
      });
      expect(safePrompt).toContain('EPILEPSY-SAFE MODE');
    });
  });

  describe('getSmartPlugSubAgentPrompt', () => {
    it('should generate a prompt for smart plug control', () => {
      const plugContext = {
        ...context,
        devices: [
          {
            ...mockDevices[0],
            type: DeviceType.SMART_PLUG,
            name: 'bedroom fan',
            formalName: 'bedroom fan plug',
          },
        ],
      };
      const prompt = getSmartPlugSubAgentPrompt(plugContext);
      expect(prompt).toContain('bedroom fan');
      expect(prompt).toContain('SAFETY RULES');
    });
  });

  describe('getSubAgentPrompt', () => {
    it('should return correct prompt for each device type', () => {
      const lightPrompt = getSubAgentPrompt('light', context);
      expect(lightPrompt).toContain('Lights Sub-Agent');

      const audioPrompt = getSubAgentPrompt('speaker', context);
      expect(audioPrompt).toContain('Audio Sub-Agent');

      const tvPrompt = getSubAgentPrompt('tv', context);
      expect(tvPrompt).toContain('TV Sub-Agent');

      const plugPrompt = getSubAgentPrompt('smart_plug', context);
      expect(plugPrompt).toContain('Smart Plug Sub-Agent');
    });

    it('should throw error for unknown device type', () => {
      expect(() => {
        getSubAgentPrompt('unknown' as any, context);
      }).toThrow('Unknown device type');
    });
  });
});
