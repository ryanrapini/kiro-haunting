import { describe, test, expect } from 'bun:test';
import * as fc from 'fast-check';
import { validateSettings } from './settingsService';
import { SETTINGS_CONSTRAINTS } from '../models/types';

describe('Settings Service Property Tests', () => {

  describe('Property 35: Settings validation', () => {
    // Feature: enhanced-haunting-controls, Property 35: Settings validation
    test('minimum time should be validated to be less than or equal to maximum time', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: SETTINGS_CONSTRAINTS.minTriggerInterval.min, max: SETTINGS_CONSTRAINTS.minTriggerInterval.max }),
          fc.integer({ min: SETTINGS_CONSTRAINTS.maxTriggerInterval.min, max: SETTINGS_CONSTRAINTS.maxTriggerInterval.max }),
          fc.boolean(),
          (minInterval, maxInterval, epilepsyMode) => {
            const settings = {
              minTriggerInterval: minInterval,
              maxTriggerInterval: maxInterval,
              epilepsyMode
            };

            const validation = validateSettings(settings);

            if (minInterval <= maxInterval) {
              // Should be valid when min <= max
              expect(validation.isValid).toBe(true);
              expect(validation.errors).toHaveLength(0);
            } else {
              // Should be invalid when min > max
              expect(validation.isValid).toBe(false);
              expect(validation.errors).toContain('minTriggerInterval must be less than or equal to maxTriggerInterval');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('individual settings fields are validated correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.integer({ min: SETTINGS_CONSTRAINTS.minTriggerInterval.min, max: SETTINGS_CONSTRAINTS.minTriggerInterval.max }),
            fc.integer({ min: -1000, max: 0 }), // Invalid low values
            fc.integer({ min: SETTINGS_CONSTRAINTS.minTriggerInterval.max + 1, max: 1000000 }) // Invalid high values
          ),
          (minInterval) => {
            const settings = { minTriggerInterval: minInterval };
            const validation = validateSettings(settings);

            if (minInterval >= SETTINGS_CONSTRAINTS.minTriggerInterval.min && 
                minInterval <= SETTINGS_CONSTRAINTS.minTriggerInterval.max) {
              // Should be valid for values in range
              expect(validation.isValid).toBe(true);
            } else {
              // Should be invalid for values out of range
              expect(validation.isValid).toBe(false);
              expect(validation.errors.some(error => error.includes('minTriggerInterval'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('epilepsy mode validation', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.boolean(), fc.string(), fc.integer(), fc.constant(null), fc.constant(undefined)),
          (epilepsyMode) => {
            const settings = { epilepsyMode };
            const validation = validateSettings(settings);

            if (typeof epilepsyMode === 'boolean' || epilepsyMode === undefined) {
              // Should be valid for boolean values or undefined
              expect(validation.isValid).toBe(true);
            } else {
              // Should be invalid for non-boolean values
              expect(validation.isValid).toBe(false);
              expect(validation.errors.some(error => error.includes('epilepsyMode'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 37: Invalid settings prevention', () => {
    // Feature: enhanced-haunting-controls, Property 37: Invalid settings prevention
    test('validation errors should be displayed and saving should be prevented for invalid settings', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Invalid minTriggerInterval (too low)
            fc.record({
              minTriggerInterval: fc.integer({ min: -1000, max: SETTINGS_CONSTRAINTS.minTriggerInterval.min - 1 })
            }),
            // Invalid minTriggerInterval (too high)
            fc.record({
              minTriggerInterval: fc.integer({ min: SETTINGS_CONSTRAINTS.minTriggerInterval.max + 1, max: 1000000 })
            }),
            // Invalid maxTriggerInterval (too low)
            fc.record({
              maxTriggerInterval: fc.integer({ min: -1000, max: SETTINGS_CONSTRAINTS.maxTriggerInterval.min - 1 })
            }),
            // Invalid maxTriggerInterval (too high)
            fc.record({
              maxTriggerInterval: fc.integer({ min: SETTINGS_CONSTRAINTS.maxTriggerInterval.max + 1, max: 1000000 })
            }),
            // Invalid epilepsyMode (non-boolean)
            fc.record({
              epilepsyMode: fc.oneof(fc.string(), fc.integer(), fc.constant(null))
            }),
            // Invalid min > max
            fc.record({
              minTriggerInterval: fc.integer({ min: 10000, max: 50000 }),
              maxTriggerInterval: fc.integer({ min: 1000, max: 9999 })
            })
          ),
          (invalidSettings) => {
            const validation = validateSettings(invalidSettings);
            
            // All invalid settings should fail validation
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            
            // Errors should be descriptive strings
            validation.errors.forEach(error => {
              expect(typeof error).toBe('string');
              expect(error.length).toBeGreaterThan(0);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('valid settings should pass validation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: SETTINGS_CONSTRAINTS.minTriggerInterval.min, max: SETTINGS_CONSTRAINTS.minTriggerInterval.max }),
          fc.integer({ min: SETTINGS_CONSTRAINTS.maxTriggerInterval.min, max: SETTINGS_CONSTRAINTS.maxTriggerInterval.max }),
          fc.boolean(),
          (minInterval, maxInterval, epilepsyMode) => {
            // Ensure min <= max for valid settings
            const actualMin = Math.min(minInterval, maxInterval);
            const actualMax = Math.max(minInterval, maxInterval);
            
            const validSettings = {
              minTriggerInterval: actualMin,
              maxTriggerInterval: actualMax,
              epilepsyMode
            };

            const validation = validateSettings(validSettings);
            
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('partial settings updates should validate correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Only minTriggerInterval
            fc.record({
              minTriggerInterval: fc.integer({ min: SETTINGS_CONSTRAINTS.minTriggerInterval.min, max: SETTINGS_CONSTRAINTS.minTriggerInterval.max })
            }),
            // Only maxTriggerInterval
            fc.record({
              maxTriggerInterval: fc.integer({ min: SETTINGS_CONSTRAINTS.maxTriggerInterval.min, max: SETTINGS_CONSTRAINTS.maxTriggerInterval.max })
            }),
            // Only epilepsyMode
            fc.record({
              epilepsyMode: fc.boolean()
            }),
            // Empty object
            fc.constant({})
          ),
          (partialSettings) => {
            const validation = validateSettings(partialSettings);
            
            // Partial valid settings should pass validation
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});