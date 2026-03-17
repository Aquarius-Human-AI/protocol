import type { ContractState } from '../types/contract.js';
import type { AutonomyLevel, RiskProfile } from '../types/identity.js';

interface TransactionContext {
  amount: number;
  currency: string;
}

type GateResult = 'auto' | 'blocked';

/**
 * Transitions that are always auto-approved regardless of autonomy level.
 * These are informational or low-risk transitions.
 */
const ALWAYS_AUTO: ReadonlySet<string> = new Set([
  'MATCHING->PROPOSAL',
  'PROPOSAL->NEGOTIATION',
  'ACTIVE->VERIFICATION',
]);

/**
 * Transitions that require human approval at specific autonomy levels.
 * Key: transition string, Value: set of autonomy levels that require approval.
 */
const REQUIRES_APPROVAL: Record<string, ReadonlySet<AutonomyLevel>> = {
  'INTENT->REQUIREMENTS': new Set(['advisor']),
  'REQUIREMENTS->MATCHING': new Set(['advisor']),
  'NEGOTIATION->ACTIVE': new Set(['advisor', 'facilitator']),
  'VERIFICATION->COMPLETE': new Set(['advisor', 'facilitator']),
};

/**
 * High-value threshold: if amount exceeds the user's max_auto_commit_value,
 * even Agent and Delegate modes require approval for commitment transitions.
 */
const COMMITMENT_TRANSITIONS: ReadonlySet<string> = new Set([
  'NEGOTIATION->ACTIVE',
  'VERIFICATION->COMPLETE',
]);

export function evaluateAutonomyGate(
  from: ContractState,
  to: ContractState,
  autonomyLevel: AutonomyLevel,
  transaction: TransactionContext,
  riskProfile: RiskProfile,
): GateResult {
  const key = `${from}->${to}`;

  // Always-auto transitions bypass all gates
  if (ALWAYS_AUTO.has(key)) {
    return 'auto';
  }

  // High-value override: commitment transitions above risk threshold always block
  if (COMMITMENT_TRANSITIONS.has(key) && transaction.amount > riskProfile.max_auto_commit_value) {
    return 'blocked';
  }

  // Check if this autonomy level requires approval for this transition
  const requiredLevels = REQUIRES_APPROVAL[key];
  if (requiredLevels?.has(autonomyLevel)) {
    return 'blocked';
  }

  return 'auto';
}
