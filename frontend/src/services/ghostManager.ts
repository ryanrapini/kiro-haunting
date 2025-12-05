/**
 * GhostManager - Manages ghost animations and positioning
 * Handles ghost lifecycle, positioning calculations, and overlap prevention
 */

export interface Position {
  x: number
  y: number
}

export interface GhostInstance {
  id: string
  deviceId: string
  action: string
  position: Position
  createdAt: Date
  timeoutId?: number
}

export interface DeviceTileElement {
  deviceId: string
  element: HTMLElement
  bounds: DOMRect
}

export class GhostManager {
  private activeGhosts = new Map<string, GhostInstance>()
  private deviceTiles = new Map<string, DeviceTileElement>()
  private ghostCounter = 0
  private readonly GHOST_OFFSET = 80 // Pixels from device tile
  private readonly MIN_GHOST_DISTANCE = 120 // Minimum distance between ghosts
  private readonly CLEANUP_DELAY = 10500 // Slightly longer than animation duration

  /**
   * Register a device tile element for positioning calculations
   */
  registerDeviceTile(deviceId: string, element: HTMLElement): void {
    const bounds = element.getBoundingClientRect()
    this.deviceTiles.set(deviceId, {
      deviceId,
      element,
      bounds
    })
  }

  /**
   * Unregister a device tile element
   */
  unregisterDeviceTile(deviceId: string): void {
    this.deviceTiles.delete(deviceId)
  }

  /**
   * Update device tile bounds (call when tiles move or resize)
   */
  updateDeviceTileBounds(deviceId: string): void {
    const tileData = this.deviceTiles.get(deviceId)
    if (tileData) {
      tileData.bounds = tileData.element.getBoundingClientRect()
    }
  }

  /**
   * Show a ghost animation for a device action
   */
  showGhost(deviceId: string, action: string): string {
    const position = this.calculateGhostPosition(deviceId)
    if (!position) {
      console.warn(`Cannot show ghost for device ${deviceId}: tile not registered`)
      return ''
    }

    const ghostId = `ghost-${++this.ghostCounter}-${Date.now()}`
    
    const ghost: GhostInstance = {
      id: ghostId,
      deviceId,
      action,
      position,
      createdAt: new Date()
    }

    // Set up automatic cleanup
    ghost.timeoutId = window.setTimeout(() => {
      this.removeGhost(ghostId)
    }, this.CLEANUP_DELAY)

    this.activeGhosts.set(ghostId, ghost)
    
    return ghostId
  }

  /**
   * Remove a specific ghost
   */
  removeGhost(ghostId: string): void {
    const ghost = this.activeGhosts.get(ghostId)
    if (ghost) {
      if (ghost.timeoutId) {
        clearTimeout(ghost.timeoutId)
      }
      this.activeGhosts.delete(ghostId)
    }
  }

  /**
   * Clear all active ghosts
   */
  clearAllGhosts(): void {
    for (const ghost of this.activeGhosts.values()) {
      if (ghost.timeoutId) {
        clearTimeout(ghost.timeoutId)
      }
    }
    this.activeGhosts.clear()
  }

  /**
   * Get all active ghosts
   */
  getActiveGhosts(): GhostInstance[] {
    return Array.from(this.activeGhosts.values())
  }

  /**
   * Get a specific ghost by ID
   */
  getGhost(ghostId: string): GhostInstance | undefined {
    return this.activeGhosts.get(ghostId)
  }

  /**
   * Check if a device has an active ghost
   */
  hasActiveGhost(deviceId: string): boolean {
    for (const ghost of this.activeGhosts.values()) {
      if (ghost.deviceId === deviceId) {
        return true
      }
    }
    return false
  }

  /**
   * Calculate optimal position for a ghost relative to device tile
   */
  private calculateGhostPosition(deviceId: string): Position | null {
    const tileData = this.deviceTiles.get(deviceId)
    if (!tileData) {
      return null
    }

    const tileBounds = tileData.bounds
    const basePosition = {
      x: tileBounds.left + tileBounds.width / 2,
      y: tileBounds.top + tileBounds.height / 2
    }

    // Try different positions around the tile to avoid overlap
    const candidatePositions = this.generateCandidatePositions(basePosition)
    
    // Find the best position that doesn't overlap with existing ghosts
    for (const position of candidatePositions) {
      if (this.isPositionAvailable(position)) {
        return position
      }
    }

    // If no ideal position found, use the first candidate (top-right)
    return candidatePositions[0]
  }

  /**
   * Generate candidate positions around a device tile
   */
  private generateCandidatePositions(basePosition: Position): Position[] {
    const offset = this.GHOST_OFFSET
    
    return [
      // Top-right (preferred)
      { x: basePosition.x + offset, y: basePosition.y - offset },
      // Top-left
      { x: basePosition.x - offset, y: basePosition.y - offset },
      // Bottom-right
      { x: basePosition.x + offset, y: basePosition.y + offset },
      // Bottom-left
      { x: basePosition.x - offset, y: basePosition.y + offset },
      // Right
      { x: basePosition.x + offset * 1.5, y: basePosition.y },
      // Left
      { x: basePosition.x - offset * 1.5, y: basePosition.y },
      // Top
      { x: basePosition.x, y: basePosition.y - offset * 1.5 },
      // Bottom
      { x: basePosition.x, y: basePosition.y + offset * 1.5 }
    ]
  }

  /**
   * Check if a position is available (no overlapping ghosts)
   */
  private isPositionAvailable(position: Position): boolean {
    for (const ghost of this.activeGhosts.values()) {
      const distance = this.calculateDistance(position, ghost.position)
      if (distance < this.MIN_GHOST_DISTANCE) {
        return false
      }
    }
    return true
  }

  /**
   * Calculate distance between two positions
   */
  private calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x
    const dy = pos1.y - pos2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Update all device tile bounds (useful after window resize)
   */
  updateAllTileBounds(): void {
    for (const deviceId of this.deviceTiles.keys()) {
      this.updateDeviceTileBounds(deviceId)
    }
  }

  /**
   * Get statistics about active ghosts
   */
  getStats(): {
    activeCount: number
    deviceCounts: Record<string, number>
    oldestGhost?: Date
  } {
    const deviceCounts: Record<string, number> = {}
    let oldestGhost: Date | undefined

    for (const ghost of this.activeGhosts.values()) {
      deviceCounts[ghost.deviceId] = (deviceCounts[ghost.deviceId] || 0) + 1
      
      if (!oldestGhost || ghost.createdAt < oldestGhost) {
        oldestGhost = ghost.createdAt
      }
    }

    return {
      activeCount: this.activeGhosts.size,
      deviceCounts,
      oldestGhost
    }
  }

  /**
   * Clean up expired ghosts (fallback cleanup)
   */
  cleanupExpiredGhosts(): void {
    const now = new Date()
    const expiredGhosts: string[] = []

    for (const [ghostId, ghost] of this.activeGhosts.entries()) {
      const age = now.getTime() - ghost.createdAt.getTime()
      if (age > this.CLEANUP_DELAY) {
        expiredGhosts.push(ghostId)
      }
    }

    for (const ghostId of expiredGhosts) {
      this.removeGhost(ghostId)
    }
  }
}

// Export singleton instance
export const ghostManager = new GhostManager()

// Auto-cleanup expired ghosts every 30 seconds
setInterval(() => {
  ghostManager.cleanupExpiredGhosts()
}, 30000)

// Update tile bounds on window resize
window.addEventListener('resize', () => {
  ghostManager.updateAllTileBounds()
})