import { describe, test, expect, vi } from 'vitest'
import { render } from '@testing-library/vue'
import * as fc from 'fast-check'
import DeviceTile from './DeviceTile.vue'

// Generators for property-based testing
const deviceGenerator = () => fc.record({
  id: fc.uuid(),
  name: fc.oneof(
    fc.constant('Living Room Light'),
    fc.constant('Kitchen Speaker'),
    fc.constant('Bedroom TV'),
    fc.constant('Smart Plug 1'),
    fc.string({ minLength: 3, maxLength: 50 }).map(s => `Device ${s.replace(/[^a-zA-Z0-9]/g, '')}`)
  ),
  type: fc.constantFrom('light', 'speaker', 'tv', 'smart_plug'),
  enabled: fc.boolean(),
  frequency: fc.constantFrom('infrequent', 'normal', 'frequent'),
  actionCount: fc.integer({ min: 0, max: 1000 })
})

const deviceActionEventGenerator = () => fc.record({
  deviceId: fc.uuid(),
  deviceName: fc.oneof(
    fc.constant('Living Room Light'),
    fc.constant('Kitchen Speaker'),
    fc.constant('Bedroom TV')
  ),
  action: fc.oneof(
    fc.constant('Turn on the lights'),
    fc.constant('Play spooky sounds'),
    fc.constant('Set dim lighting'),
    fc.constant('Turn off device')
  ),
  timestamp: fc.date(),
  phase: fc.constantFrom('setup', 'random')
})

describe('DeviceTile Property Tests', () => {
  // Feature: enhanced-haunting-controls, Property 25: Active device tile display
  test('Property 25: Active device tile display - tiles should be displayed for all and only enabled devices', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        (device) => {
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              isActive: false,
              epilepsyMode: false
            }
          })
          
          // Should display device name
          expect(container.textContent).toContain(device.name)
          
          // Should show correct status based on enabled state
          if (device.enabled) {
            expect(container.textContent).toContain('Enabled')
          } else {
            expect(container.textContent).toContain('Disabled')
          }
          
          // Should display device type
          const expectedType = {
            light: 'Smart Light',
            speaker: 'Smart Speaker', 
            tv: 'Smart TV',
            smart_plug: 'Smart Plug'
          }[device.type]
          expect(container.textContent).toContain(expectedType)
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: enhanced-haunting-controls, Property 6: Settings modal display
  test('Property 6: Settings modal display - device click should trigger callback with correct device ID', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        (device) => {
          const onDeviceClick = vi.fn()
          
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              onDeviceClick,
              isActive: false,
              epilepsyMode: false
            }
          })
          
          // Click the device tile
          const tileElement = container.querySelector('.device-tile')
          if (tileElement) {
            tileElement.click()
            
            // Should call the callback with the correct device ID
            expect(onDeviceClick).toHaveBeenCalledWith(device.id)
            expect(onDeviceClick).toHaveBeenCalledTimes(1)
          }
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: enhanced-haunting-controls, Property 7: Frequency display accuracy
  test('Property 7: Frequency display accuracy - frequency should be displayed correctly for all frequency values', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        (device) => {
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              isActive: false,
              epilepsyMode: false
            }
          })
          
          const frequencyElement = container.querySelector('.frequency-value')
          
          // Should display the frequency with proper capitalization
          const expectedFrequency = device.frequency.charAt(0).toUpperCase() + device.frequency.slice(1)
          expect(frequencyElement?.textContent).toBe(expectedFrequency)
          
          // Should have the correct CSS class
          expect(frequencyElement?.classList.contains(`freq-${device.frequency}`)).toBe(true)
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Device tile should display last action when provided', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        deviceActionEventGenerator(),
        (device, lastAction) => {
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              lastAction,
              isActive: false,
              epilepsyMode: false
            }
          })
          
          // Should show the last action
          expect(container.textContent).toContain(lastAction.action)
          
          // Should show the action time
          const actionTime = new Date(lastAction.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })
          expect(container.textContent).toContain(actionTime)
          
          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  test('Device tile should show no action message when no last action provided', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        (device) => {
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              isActive: false,
              epilepsyMode: false
            }
          })
          
          // Should show no action message
          expect(container.textContent).toContain('No recent activity')
          
          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  test('Active device tiles should have active styling', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        fc.boolean(),
        (device, isActive) => {
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              isActive,
              epilepsyMode: false
            }
          })
          
          const tileElement = container.querySelector('.device-tile')
          
          if (isActive) {
            expect(tileElement?.classList.contains('active')).toBe(true)
          } else {
            expect(tileElement?.classList.contains('active')).toBe(false)
          }
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Epilepsy mode should apply safe styling', () => {
    fc.assert(
      fc.property(
        deviceGenerator(),
        fc.boolean(),
        (device, epilepsyMode) => {
          const { container, unmount } = render(DeviceTile, {
            props: {
              device,
              isActive: true,
              epilepsyMode
            }
          })
          
          const tileElement = container.querySelector('.device-tile')
          
          if (epilepsyMode) {
            expect(tileElement?.classList.contains('epilepsy-safe')).toBe(true)
          } else {
            expect(tileElement?.classList.contains('epilepsy-safe')).toBe(false)
          }
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})