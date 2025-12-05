/**
 * Orchestrator configuration
 * Controls timing and behavior of the haunting orchestrator
 */

export const orchestratorConfig = {
  /**
   * Minimum time in milliseconds between firing off a sub-agent
   * Default: 3000ms (3 seconds)
   */
  minAgentFireIntervalMs: 3000,

  /**
   * Maximum time in milliseconds between firing off a sub-agent
   * Default: 8000ms (8 seconds)
   */
  maxAgentFireIntervalMs: 8000,

  /**
   * Minimum number of commands to keep in the queue
   * When queue drops below this, trigger regeneration
   * Default: 5 commands
   */
  minQueueSize: 5,

  /**
   * Number of commands each sub-agent should generate per call
   * Default: 3 commands
   */
  commandsPerAgentCall: 3,

  /**
   * Maximum time in milliseconds to wait for a sub-agent response
   * Default: 30000ms (30 seconds)
   */
  agentTimeoutMs: 30000,
};

/**
 * Get a random interval between min and max
 */
export function getRandomInterval(): number {
  const { minAgentFireIntervalMs, maxAgentFireIntervalMs } = orchestratorConfig;
  return Math.floor(
    Math.random() * (maxAgentFireIntervalMs - minAgentFireIntervalMs) + minAgentFireIntervalMs
  );
}
