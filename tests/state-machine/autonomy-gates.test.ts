import { describe, it, expect } from 'vitest';
import { evaluateAutonomyGate } from '../../src/state-machine/autonomy.js';
import type { AutonomyLevel } from '../../src/types/index.js';
import type { ContractState } from '../../src/types/contract.js';

describe('Autonomy Gates', () => {
  const transitions: Array<{
    from: ContractState;
    to: ContractState;
    amount: number;
    expected: Record<AutonomyLevel, 'auto' | 'blocked'>;
  }> = [
    {
      from: 'INTENT', to: 'REQUIREMENTS', amount: 50,
      expected: { advisor: 'blocked', facilitator: 'auto', agent: 'auto', delegate: 'auto' },
    },
    {
      from: 'REQUIREMENTS', to: 'MATCHING', amount: 50,
      expected: { advisor: 'blocked', facilitator: 'auto', agent: 'auto', delegate: 'auto' },
    },
    {
      from: 'NEGOTIATION', to: 'ACTIVE', amount: 50,
      expected: { advisor: 'blocked', facilitator: 'blocked', agent: 'auto', delegate: 'auto' },
    },
    {
      from: 'NEGOTIATION', to: 'ACTIVE', amount: 5000,
      expected: { advisor: 'blocked', facilitator: 'blocked', agent: 'blocked', delegate: 'blocked' },
    },
    {
      from: 'VERIFICATION', to: 'COMPLETE', amount: 50,
      expected: { advisor: 'blocked', facilitator: 'blocked', agent: 'auto', delegate: 'auto' },
    },
    {
      from: 'MATCHING', to: 'PROPOSAL', amount: 50,
      expected: { advisor: 'auto', facilitator: 'auto', agent: 'auto', delegate: 'auto' },
    },
  ];

  for (const { from, to, amount, expected } of transitions) {
    for (const [level, result] of Object.entries(expected)) {
      it(`${from}→${to} at $${amount}: ${level} = ${result}`, () => {
        const gate = evaluateAutonomyGate(
          from, to,
          level as AutonomyLevel,
          { amount, currency: 'USD' },
          { max_auto_commit_value: 500, max_auto_commit_currency: 'USD', restricted_categories: [], approval_rules: {} },
        );
        expect(gate).toBe(result);
      });
    }
  }
});
