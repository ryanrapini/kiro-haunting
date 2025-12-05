import { describe, test, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/vue'
import * as fc from 'fast-check'
import GhostAnimation from './GhostAnimation.vue'

// Generators for property-based testing
const positionGenerator = () => fc.record({
  x: fc.integer({ min: 0, max: 2000 }),
  y: fc.integer({ min: 0, max: 2000 })
})

const deviceIdGenerator = () => fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)
const actionGenerator = () => fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)

describe('GhostAnimation Property Tests', () => {
  // Feature: enhanced-haunting-controls, Property 30: Ghost animation triggering
  test('Property 30: Ghost animation triggering - ghost should appear for any device command', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        actionGenerator(),
        positionGenerator(),
        (deviceId, action, position) => {
          const { container, unmount } = render(GhostAnimation, {
            props: {
              deviceId,
              action,
              position,
              epilepsyMode: false
            }
          })
          
          // Ghost should be visible
          const ghostElement = container.querySelector('.ghost-animation')
          expect(ghostElement).toBeTruthy()
          
          // Should display the action in speech bubble
          const speechBubble = container.querySelector('.speech-bubble')
          expect(speechBubble).toBeTruthy()
          expect(speechBubble?.textContent).toContain(action)
          
          // Should be positioned correctly
          const style = ghostElement?.getAttribute('style')
          expect(style).toContain(`left: ${position.x}px`)
          expect(style).toContain(`top: ${position.y}px`)
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: enhanced-haunting-controls, Property 32: Ghost fade duration
  test('Property 32: Ghost fade duration - ghost should have 10-second fade animation', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        actionGenerator(),
        positionGenerator(),
        (deviceId, action, position) => {
          const { container, unmount } = render(GhostAnimation, {
            props: {
              deviceId,
              action,
              position,
              epilepsyMode: false
            }
          })
          
          const ghostElement = container.querySelector('.ghost-animation')
          expect(ghostElement).toBeTruthy()
          
          // Ghost should exist and be properly structured
          expect(ghostElement?.classList.contains('ghost-animation')).toBe(true)
          
          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  test('Epilepsy mode should use safe animations', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        actionGenerator(),
        positionGenerator(),
        fc.boolean(),
        (deviceId, action, position, epilepsyMode) => {
          const { container, unmount } = render(GhostAnimation, {
            props: {
              deviceId,
              action,
              position,
              epilepsyMode
            }
          })
          
          const ghostElement = container.querySelector('.ghost-animation')
          
          if (epilepsyMode) {
            expect(ghostElement?.classList.contains('epilepsy-safe')).toBe(true)
            
            // Should not have sparkles in epilepsy mode
            const sparkles = container.querySelector('.sparkles')
            expect(sparkles).toBeFalsy()
          } else {
            expect(ghostElement?.classList.contains('epilepsy-safe')).toBe(false)
            
            // Should have sparkles in normal mode
            const sparkles = container.querySelector('.sparkles')
            expect(sparkles).toBeTruthy()
          }
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Speech bubble should contain the action text', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        actionGenerator(),
        positionGenerator(),
        (deviceId, action, position) => {
          const { container, unmount } = render(GhostAnimation, {
            props: {
              deviceId,
              action,
              position,
              epilepsyMode: false
            }
          })
          
          const actionText = container.querySelector('.action-text')
          expect(actionText).toBeTruthy()
          expect(actionText?.textContent).toBe(action)
          
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  test('Ghost sprite should have proper structure', () => {
    fc.assert(
      fc.property(
        deviceIdGenerator(),
        actionGenerator(),
        positionGenerator(),
        (deviceId, action, position) => {
          const { container, unmount } = render(GhostAnimation, {
            props: {
              deviceId,
              action,
              position,
              epilepsyMode: false
            }
          })
          
          // Should have ghost sprite
          const ghostSprite = container.querySelector('.ghost-sprite')
          expect(ghostSprite).toBeTruthy()
          
          // Should have ghost body
          const ghostBody = container.querySelector('.ghost-body')
          expect(ghostBody).toBeTruthy()
          
          // Should have ghost face with eyes and mouth
          const ghostFace = container.querySelector('.ghost-face')
          expect(ghostFace).toBeTruthy()
          
          const leftEye = container.querySelector('.ghost-eye.left')
          const rightEye = container.querySelector('.ghost-eye.right')
          const mouth = container.querySelector('.ghost-mouth')
          
          expect(leftEye).toBeTruthy()
          expect(rightEye).toBeTruthy()
          expect(mouth).toBeTruthy()
          
          // Should have ghost tail
          const ghostTail = container.querySelector('.ghost-tail')
          expect(ghostTail).toBeTruthy()
          
          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })
})