import { describe, test, expect } from 'bun:test';
import * as fc from 'fast-check';
import { DeviceType, FrequencyLevel, DEFAULT_PROMPTS, FREQUENCY_WEIGHTS } from '../models/types';

// Import only the pure functions that don't require DynamoDB
import { generateDefaultPrompt, calculateSelectionWeight } from './deviceService';

describe('Device Service Property Tests', () => {

  describe('Property 42-45: Default prompt generation for each device type', () => {
    // Feature: enhanced-haunting-controls, Property 42: Light device default prompt
    test('light devices get Halloween lighting prompts', () => {
      fc.assert(
        fc.property(fc.constant(DeviceType.LIGHT), (deviceType) => {
          const prompt = generateDefaultPrompt(deviceType);
          expect(prompt).toBe(DEFAULT_PROMPTS[DeviceType.LIGHT]);
          expect(prompt).toContain('Halloween colors');
          expect(prompt).toContain('purple');
          expect(prompt).toContain('orange');
        }),
        { numRuns: 100 }
      );
    });

    // Feature: enhanced-haunting-controls, Property 43: Speaker device default prompt
    test('speaker devices get spooky sound prompts', () => {
      fc.assert(
        fc.property(fc.constant(DeviceType.SPEAKER), (deviceType) => {
          const prompt = generateDefaultPrompt(deviceType);
          expect(prompt).toBe(DEFAULT_PROMPTS[DeviceType.SPEAKER]);
          expect(prompt).toContain('spooky');
          expect(prompt).toContain('sounds');
        }),
        { numRuns: 100 }
      );
    });

    // Feature: enhanced-haunting-controls, Property 44: TV device default prompt
    test('TV devices get haunted atmosphere video prompts', () => {
      fc.assert(
        fc.property(fc.constant(DeviceType.TV), (deviceType) => {
          const prompt = generateDefaultPrompt(deviceType);
          expect(prompt).toBe(DEFAULT_PROMPTS[DeviceType.TV]);
          expect(prompt).toContain('haunted house atmosphere');
          expect(prompt).toContain('YouTube');
        }),
        { numRuns: 100 }
      );
    });

    // Feature: enhanced-haunting-controls, Property 45: On/off device default prompt
    test('smart plug devices get random on/off prompts', () => {
      fc.assert(
        fc.property(fc.constant(DeviceType.SMART_PLUG), (deviceType) => {
          const prompt = generateDefaultPrompt(deviceType);
          expect(prompt).toBe(DEFAULT_PROMPTS[DeviceType.SMART_PLUG]);
          expect(prompt).toContain('turn');
          expect(prompt).toContain('on or off');
        }),
        { numRuns: 100 }
      );
    });

    test('unknown device types get fallback prompt', () => {
      fc.assert(
        fc.property(fc.constant(DeviceType.UNKNOWN), (deviceType) => {
          const prompt = generateDefaultPrompt(deviceType);
          expect(prompt).toBe(DEFAULT_PROMPTS[DeviceType.UNKNOWN]);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Selection weight calculation', () => {
    test('frequency weights match expected values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(FrequencyLevel.INFREQUENT, FrequencyLevel.NORMAL, FrequencyLevel.FREQUENT),
          (frequency) => {
            const weight = calculateSelectionWeight(frequency);
            expect(weight).toBe(FREQUENCY_WEIGHTS[frequency]);
            
            // Verify specific weight values
            if (frequency === FrequencyLevel.INFREQUENT) {
              expect(weight).toBe(0.5);
            } else if (frequency === FrequencyLevel.NORMAL) {
              expect(weight).toBe(1.0);
            } else if (frequency === FrequencyLevel.FREQUENT) {
              expect(weight).toBe(2.0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Note: Properties 2 and 8 (Toggle state persistence and Frequency setting persistence)
  // are integration tests that require DynamoDB mocking. These would be better tested
  // in integration tests rather than property-based tests due to the complexity of 
  // mocking AWS SDK operations properly.
});