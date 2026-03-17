import type { ContractState } from '../types/contract.js';

/** Forward transitions in the happy path */
const FORWARD_TRANSITIONS: Record<ContractState, ContractState[]> = {
  INTENT: ['REQUIREMENTS', 'CANCELLED', 'EXPIRED'],
  REQUIREMENTS: ['MATCHING', 'CANCELLED', 'EXPIRED'],
  MATCHING: ['PROPOSAL', 'EXPIRED', 'CANCELLED'],
  PROPOSAL: ['NEGOTIATION', 'EXPIRED', 'CANCELLED'],
  NEGOTIATION: ['ACTIVE', 'EXPIRED', 'CANCELLED'],
  ACTIVE: ['VERIFICATION', 'FAILED'],
  VERIFICATION: ['COMPLETE', 'DISPUTED', 'ACTIVE'],
  DISPUTED: ['COMPLETE', 'FAILED'],
  // Terminal states — no transitions out
  COMPLETE: [],
  CANCELLED: [],
  EXPIRED: [],
  FAILED: [],
};

const TERMINAL_STATES: ReadonlySet<ContractState> = new Set([
  'COMPLETE', 'CANCELLED', 'EXPIRED', 'FAILED',
]);

export function isTerminalState(state: ContractState): boolean {
  return TERMINAL_STATES.has(state);
}

export function getValidTransitions(state: ContractState): ContractState[] {
  return FORWARD_TRANSITIONS[state] ?? [];
}

export function isValidTransition(from: ContractState, to: ContractState): boolean {
  return getValidTransitions(from).includes(to);
}
