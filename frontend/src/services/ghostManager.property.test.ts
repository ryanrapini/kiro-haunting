import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { GhostManager } from './ghostManager'

// Mock DOM elements for testing
const createMockElement = (bounds: DOMRect): HTMLElement => {
  const element = document.createElement('div')
  element.getBoundingClientRect = vi.fn(() => bounds)
  return element
}

const boundsGenerator = () => fc.record({
  left: fc.integer({ min: 0, max: 1000 }),
  top: fc.integer({ min: 0, max: 1000 }),
  width: fc.integer({ min: 50, max: 500 }),
  height: fc.integer({ min: 50, max: 300 }),
  right: fc.integer({ min: 100, max: 1500 }),
  bottom: fc.integer({ min: 100, max: 1300 }),
  x: fc.integer({ min: 0, max: 1000 }),
  y: fc.integer({ min: 0, max: 1000 })
})

const deviceIdGenerator = () => fc.oneof(
  fc.uuid(),
  fc.string({ minLength: 3, maxLength: 20 }).map(s => `device-${s.replace(/[^a-zA-Z0-9]/g, '')}`)
)
const actionGenerator = () => fc.oneof(
  fc.constant('Turn on the lights'),
  fc.constant('Play spooky sounds'),
  fc.constant('Set dim lighting'),
  fc.constant('Turn off device')
)

describe('GhostManager Property Tests', () => {
  let ghostManager: GhostManager

  beforeEach(() => {
    ghostManager = new GhostManager()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    ghostManager.clearAllGhosts()
    vi.useRealTimers()
  })

  test('Ghost positioning should be calculated relative to device tiles', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        boundsGenerator(),
        actionGenerator(),
        (deviceId, bounds, action) => {
          // Register a device tile
          const element = createMockElement(bounds as DOMRect)
          ghostManager.registerDeviceTile(deviceId, element)
          
          // Show a ghost
          const ghostId = ghostManager.showGhost(deviceId, action)
          
          // Ghost should be created
          expect(ghostId).toBeTruthy()
          
          const ghost = ghostManager.getGhost(ghostId)
          expect(ghost).toBeDefined()
          expect(ghost!.deviceId).toBe(deviceId)
          expect(ghost!.action).toBe(action)
          
          // Position should be relative to the tile bounds
          const expectedCenterX = bounds.left + bounds.width / 2
          const expectedCenterY = bounds.top + bounds.height / 2
          
          // Ghost position should be offset from the center
          const distance = Math.sqrt(
            Math.pow(ghost!.position.x - expectedCenterX, 2) + 
            Math.pow(ghost!.position.y - expectedCenterY, 2)
          )
          
          // Should be positioned at a reasonable offset (around 80px)
          expect(distance).toBeGreaterThan(50)
          expect(distance).toBeLessThan(150)
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Multiple ghosts should not overlap', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        (numDevices) => {
          // Create unique device IDs
          const testDeviceIds = Array.from({ length: numDevices }, (_, i) => `device-${i}`)
          const testActions = Array.from({ length: numDevices }, () => 'Test action')
          
          // Register device tiles with different positions
          testDeviceIds.forEach((deviceId, index) => {
            const bounds = {
              left: index * 200,
              top: index * 200,
              width: 100,
              height: 100,
              right: index * 200 + 100,
              bottom: index * 200 + 100,
              x: index * 200,
              y: index * 200
            }
            const element = createMockElement(bounds as DOMRect)
            ghostManager.registerDeviceTile(deviceId, element)
          })
          
          // Show ghosts for all devices
          const ghostIds = testDeviceIds.map((deviceId, index) => 
            ghostManager.showGhost(deviceId, testActions[index])
          )
          
          // Get all active ghosts
          const activeGhosts = ghostManager.getActiveGhosts()
          expect(activeGhosts.length).toBe(testDeviceIds.length)
          
          // All ghosts should have valid positions
          activeGhosts.forEach(ghost => {
            expect(ghost.position.x).toBeGreaterThanOrEqual(0)
            expect(ghost.position.y).toBeGreaterThanOrEqual(0)
          })
        }
      ),
      { numRuns: 20 }
    )
  })

  test('Ghost cleanup should work correctly', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        boundsGenerator(),
        actionGenerator(),
        (deviceId, bounds, action) => {
          // Register device tile
          const element = createMockElement(bounds as DOMRect)
          ghostManager.registerDeviceTile(deviceId, element)
          
          // Show ghost
          const ghostId = ghostManager.showGhost(deviceId, action)
          expect(ghostManager.getActiveGhosts().length).toBe(1)
          
          // Remove ghost
          ghostManager.removeGhost(ghostId)
          expect(ghostManager.getActiveGhosts().length).toBe(0)
          
          // Ghost should no longer exist
          expect(ghostManager.getGhost(ghostId)).toBeUndefined()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Clear all ghosts should remove all active ghosts', () => {
    fc.assert(
      fc.property(
        fc.array(deviceIdGenerator(), { minLength: 1, maxLength: 10 }),
        fc.array(boundsGenerator(), { minLength: 1, maxLength: 10 }),
        fc.array(actionGenerator(), { minLength: 1, maxLength: 10 }),
        (deviceIds, boundsList, actions) => {
          const minLength = Math.min(deviceIds.length, boundsList.length, actions.length)
          
          // Register devices and show ghosts
          for (let i = 0; i < minLength; i++) {
            const element = createMockElement(boundsList[i] as DOMRect)
            ghostManager.registerDeviceTile(deviceIds[i], element)
            ghostManager.showGhost(deviceIds[i], actions[i])
          }
          
          expect(ghostManager.getActiveGhosts().length).toBe(minLength)
          
          // Clear all ghosts
          ghostManager.clearAllGhosts()
          
          // Should have no active ghosts
          expect(ghostManager.getActiveGhosts().length).toBe(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  test('Device tile registration and unregistration should work correctly', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        boundsGenerator(),
        actionGenerator(),
        (deviceId, bounds, action) => {
          // Initially should not be able to show ghost (no tile registered)
          const ghostId1 = ghostManager.showGhost(deviceId, action)
          expect(ghostId1).toBe('')
          
          // Register device tile
          const element = createMockElement(bounds as DOMRect)
          ghostManager.registerDeviceTile(deviceId, element)
          
          // Now should be able to show ghost
          const ghostId2 = ghostManager.showGhost(deviceId, action)
          expect(ghostId2).toBeTruthy()
          expect(ghostManager.getGhost(ghostId2)).toBeDefined()
          
          // Unregister device tile
          ghostManager.unregisterDeviceTile(deviceId)
          
          // Should not be able to show new ghost
          const ghostId3 = ghostManager.showGhost(deviceId, action)
          expect(ghostId3).toBe('')
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Ghost statistics should be accurate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        (numDevices) => {
          // Create unique device IDs
          const testDeviceIds = Array.from({ length: numDevices }, (_, i) => `device-${i}`)
          
          // Register devices and show ghosts
          const deviceCounts: Record<string, number> = {}
          for (let i = 0; i < numDevices; i++) {
            const bounds = {
              left: i * 100,
              top: i * 100,
              width: 50,
              height: 50,
              right: i * 100 + 50,
              bottom: i * 100 + 50,
              x: i * 100,
              y: i * 100
            }
            const element = createMockElement(bounds as DOMRect)
            ghostManager.registerDeviceTile(testDeviceIds[i], element)
            ghostManager.showGhost(testDeviceIds[i], 'Test action')
            
            deviceCounts[testDeviceIds[i]] = 1
          }
          
          const stats = ghostManager.getStats()
          
          // Active count should match
          expect(stats.activeCount).toBe(numDevices)
          
          // Device counts should match
          for (const [deviceId, count] of Object.entries(deviceCounts)) {
            expect(stats.deviceCounts[deviceId]).toBe(count)
          }
          
          // Should have oldest ghost if any ghosts exist
          if (numDevices > 0) {
            expect(stats.oldestGhost).toBeDefined()
            expect(stats.oldestGhost).toBeInstanceOf(Date)
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  test('hasActiveGhost should correctly identify devices with active ghosts', () => {
    fc.assert(
      fc.property(
        fc.constant('device-1'),
        fc.constant('device-2'),
        boundsGenerator(),
        actionGenerator(),
        (deviceId1, deviceId2, bounds, action) => {
          // Register both devices
          const element1 = createMockElement(bounds as DOMRect)
          const element2 = createMockElement(bounds as DOMRect)
          ghostManager.registerDeviceTile(deviceId1, element1)
          ghostManager.registerDeviceTile(deviceId2, element2)
          
          // Initially no active ghosts
          expect(ghostManager.hasActiveGhost(deviceId1)).toBe(false)
          expect(ghostManager.hasActiveGhost(deviceId2)).toBe(false)
          
          // Show ghost for device1
          ghostManager.showGhost(deviceId1, action)
          
          // Only device1 should have active ghost
          expect(ghostManager.hasActiveGhost(deviceId1)).toBe(true)
          expect(ghostManager.hasActiveGhost(deviceId2)).toBe(false)
        }
      ),
      { numRuns: 50 }
    )
  })
})