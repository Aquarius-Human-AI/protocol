import { describe, it, expect } from 'vitest';
import { ContractStateMachine } from '../../src/state-machine/index.js';
import type { WorkContract } from '../../src/types/index.js';

function makeContract(state: WorkContract['state'] = 'INTENT'): WorkContract {
  return {
    id: 'test-contract-1',
    outcome_id: 'test-outcome-1',
    participants: { buyer: 'buyer-1', provider: '', intermediaries: [] },
    requirements: {
      description: 'Test contract',
      acceptance_criteria: ['criteria-1'],
      category: 'test',
      tags: [],
      constraints: {},
    },
    terms: {
      pricing: { model: 'fixed', amount: 50, currency: 'USD' },
      timeline: {},
      payment_trigger: 'on_completion',
      escrow: false,
      dispute_resolution: 'ai_mediated',
    },
    state,
    state_history: [{ state, timestamp: new Date().toISOString(), triggered_by: 'test' }],
    execution_plan_id: undefined,
    verification: { method: 'self_report', evidence: [], result: 'pending' },
    revision_count: 0,
    max_revisions: 3,
  };
}

describe('Contract State Machine — Valid Transitions', () => {
  it('allows INTENT → REQUIREMENTS', () => {
    const contract = makeContract('INTENT');
    const result = ContractStateMachine.transition(contract, 'REQUIREMENTS', 'ai-agent');
    expect(result.state).toBe('REQUIREMENTS');
    expect(result.state_history).toHaveLength(2);
  });

  it('allows REQUIREMENTS → MATCHING', () => {
    const contract = makeContract('REQUIREMENTS');
    const result = ContractStateMachine.transition(contract, 'MATCHING', 'ai-agent');
    expect(result.state).toBe('MATCHING');
  });

  it('allows full happy path: INTENT → COMPLETE', () => {
    let contract = makeContract('INTENT');
    const happyPath = [
      'REQUIREMENTS', 'MATCHING', 'PROPOSAL',
      'NEGOTIATION', 'ACTIVE', 'VERIFICATION', 'COMPLETE',
    ] as const;

    for (const nextState of happyPath) {
      contract = ContractStateMachine.transition(contract, nextState, 'ai-agent');
      expect(contract.state).toBe(nextState);
    }
  });

  it('allows VERIFICATION → ACTIVE (revision loop)', () => {
    const contract = makeContract('VERIFICATION');
    const result = ContractStateMachine.transition(contract, 'ACTIVE', 'buyer');
    expect(result.state).toBe('ACTIVE');
    expect(result.revision_count).toBe(1);
  });

  it('blocks revision loop after max revisions', () => {
    const contract = { ...makeContract('VERIFICATION'), revision_count: 3, max_revisions: 3 };
    expect(() => ContractStateMachine.transition(contract, 'ACTIVE', 'buyer'))
      .toThrow(/max revisions/i);
  });

  it('allows VERIFICATION → DISPUTED', () => {
    const contract = makeContract('VERIFICATION');
    const result = ContractStateMachine.transition(contract, 'DISPUTED', 'buyer');
    expect(result.state).toBe('DISPUTED');
  });

  it('allows DISPUTED → COMPLETE (resolved)', () => {
    const contract = makeContract('DISPUTED');
    const result = ContractStateMachine.transition(contract, 'COMPLETE', 'mediator');
    expect(result.state).toBe('COMPLETE');
  });

  it('allows DISPUTED → FAILED (unresolvable)', () => {
    const contract = makeContract('DISPUTED');
    const result = ContractStateMachine.transition(contract, 'FAILED', 'mediator');
    expect(result.state).toBe('FAILED');
  });
});

describe('Contract State Machine — Invalid Transitions', () => {
  it('rejects INTENT → ACTIVE (skipping states)', () => {
    const contract = makeContract('INTENT');
    expect(() => ContractStateMachine.transition(contract, 'ACTIVE', 'ai-agent'))
      .toThrow(/invalid transition/i);
  });

  it('rejects transitions from terminal states', () => {
    for (const terminal of ['COMPLETE', 'CANCELLED', 'EXPIRED', 'FAILED'] as const) {
      const contract = makeContract(terminal);
      expect(() => ContractStateMachine.transition(contract, 'INTENT', 'ai-agent'))
        .toThrow(/terminal/i);
    }
  });

  it('rejects ACTIVE → INTENT (backwards)', () => {
    const contract = makeContract('ACTIVE');
    expect(() => ContractStateMachine.transition(contract, 'INTENT', 'ai-agent'))
      .toThrow(/invalid transition/i);
  });
});

describe('Contract State Machine — Cancellation', () => {
  it('allows cancellation from pre-ACTIVE states', () => {
    for (const state of ['INTENT', 'REQUIREMENTS', 'MATCHING', 'PROPOSAL', 'NEGOTIATION'] as const) {
      const contract = makeContract(state);
      const result = ContractStateMachine.transition(contract, 'CANCELLED', 'buyer');
      expect(result.state).toBe('CANCELLED');
    }
  });

  it('rejects cancellation from ACTIVE', () => {
    const contract = makeContract('ACTIVE');
    expect(() => ContractStateMachine.transition(contract, 'CANCELLED', 'buyer'))
      .toThrow(/invalid transition/i);
  });
});
