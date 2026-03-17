import { describe, it, expect } from 'vitest';
import { ContractStateMachine } from '../../src/state-machine/index.js';
import { evaluateAutonomyGate } from '../../src/state-machine/autonomy.js';
import type { WorkContract } from '../../src/types/index.js';
import type { AutonomyLevel, RiskProfile } from '../../src/types/identity.js';
import type { ContractState } from '../../src/types/contract.js';

function makeContract(overrides: Partial<WorkContract> = {}): WorkContract {
  return {
    id: 'test-1',
    outcome_id: 'outcome-1',
    participants: { buyer: 'buyer', provider: '', intermediaries: [] },
    requirements: {
      description: '',
      acceptance_criteria: [],
      category: '',
      tags: [],
      constraints: {},
    },
    terms: {
      pricing: { model: 'fixed', amount: 85, currency: 'USD' },
      timeline: {},
      payment_trigger: 'on_completion',
      escrow: false,
      dispute_resolution: 'ai_mediated',
    },
    state: 'INTENT',
    state_history: [
      { state: 'INTENT', timestamp: new Date().toISOString(), triggered_by: 'test' },
    ],
    verification: { method: 'self_report', evidence: [], result: 'pending' },
    revision_count: 0,
    max_revisions: 3,
    ...overrides,
  };
}

function runFullHappyPath(
  contract: WorkContract,
  autonomy: AutonomyLevel,
  riskProfile: RiskProfile,
  amount: number,
): { contract: WorkContract; gateResults: Array<{ from: ContractState; to: ContractState; result: string }> } {
  const states: ContractState[] = [
    'REQUIREMENTS', 'MATCHING', 'PROPOSAL',
    'NEGOTIATION', 'ACTIVE', 'VERIFICATION', 'COMPLETE',
  ];
  const gateResults: Array<{ from: ContractState; to: ContractState; result: string }> = [];

  for (const next of states) {
    // If we're stuck (contract didn't advance to the expected previous state),
    // skip remaining transitions — the contract is blocked
    if (contract.state !== getExpectedPreviousState(next)) {
      break;
    }

    const gate = evaluateAutonomyGate(
      contract.state,
      next,
      autonomy,
      { amount, currency: 'USD' },
      riskProfile,
    );
    gateResults.push({ from: contract.state, to: next, result: gate });

    // Only advance if gate is auto (simulate no human in the loop)
    if (gate === 'auto') {
      contract = ContractStateMachine.transition(contract, next, 'ai-agent');
    }
  }

  return { contract, gateResults };
}

/** Maps each state to the state that should precede it in the happy path */
function getExpectedPreviousState(state: ContractState): ContractState {
  const map: Partial<Record<ContractState, ContractState>> = {
    REQUIREMENTS: 'INTENT',
    MATCHING: 'REQUIREMENTS',
    PROPOSAL: 'MATCHING',
    NEGOTIATION: 'PROPOSAL',
    ACTIVE: 'NEGOTIATION',
    VERIFICATION: 'ACTIVE',
    COMPLETE: 'VERIFICATION',
  };
  return map[state] ?? state;
}

const defaultRiskProfile: RiskProfile = {
  max_auto_commit_value: 200,
  max_auto_commit_currency: 'USD',
  restricted_categories: [],
  approval_rules: {},
};

// =============================================================
// Dorothy H. — 71, rural WI, buyer, Delegate, $85 gutter cleaning
// =============================================================
describe('Dorothy — Delegate, $85 gutter cleaning', () => {
  const autonomy: AutonomyLevel = 'delegate';
  const amount = 85;
  const riskProfile: RiskProfile = {
    ...defaultRiskProfile,
    max_auto_commit_value: 200, // Dorothy's daughter set a modest limit
  };

  it('completes full happy path with ALL gates auto-approved', () => {
    const contract = makeContract({
      id: 'dorothy-gutters',
      outcome_id: 'dorothy-home-help',
      participants: { buyer: 'dorothy-h', provider: 'handyman-mike', intermediaries: ['ai-agent'] },
      requirements: {
        description: 'Clean gutters on one-story house',
        acceptance_criteria: ['Gutters clear of debris', 'Downspouts functional'],
        category: 'home-maintenance',
        tags: ['gutters', 'outdoor'],
        constraints: { location: 'Hayward, WI' },
      },
      terms: {
        pricing: { model: 'fixed', amount, currency: 'USD' },
        timeline: { deadline: '2026-03-20' },
        payment_trigger: 'on_completion',
        escrow: false,
        dispute_resolution: 'ai_mediated',
      },
    });

    const { contract: result, gateResults } = runFullHappyPath(contract, autonomy, riskProfile, amount);

    // Every gate should be auto for Delegate at $85
    expect(gateResults.every(g => g.result === 'auto')).toBe(true);
    expect(result.state).toBe('COMPLETE');
    expect(result.state_history).toHaveLength(8); // INTENT + 7 transitions
  });

  it('would block at high-value commitment even in Delegate mode', () => {
    // If Dorothy's outcome included a $5000 kitchen renovation
    const gate = evaluateAutonomyGate(
      'NEGOTIATION', 'ACTIVE',
      autonomy,
      { amount: 5000, currency: 'USD' },
      riskProfile,
    );
    expect(gate).toBe('blocked');
  });
});

// =============================================================
// Ahmed F. — 44, Minneapolis, ESL buyer, Facilitator, $300 taxes
// =============================================================
describe('Ahmed — Facilitator, $300 tax help', () => {
  const autonomy: AutonomyLevel = 'facilitator';
  const amount = 300;
  const riskProfile: RiskProfile = {
    ...defaultRiskProfile,
    max_auto_commit_value: 500, // Ahmed is careful but reasonable
  };

  it('auto-advances through discovery, blocks at commitment', () => {
    const contract = makeContract({
      id: 'ahmed-taxes',
      participants: { buyer: 'ahmed-f', provider: '', intermediaries: ['ai-agent'] },
      requirements: {
        description: 'Small business tax preparation',
        acceptance_criteria: ['Taxes filed correctly', 'Deductions maximized'],
        category: 'financial',
        tags: ['taxes', 'small-business'],
        constraints: { language: 'simple-english', cultural_fit: 'somali-community' },
      },
    });

    const { contract: result, gateResults } = runFullHappyPath(contract, autonomy, riskProfile, amount);

    // Discovery gates should be auto
    const discoveryGates = gateResults.filter(g =>
      ['INTENT', 'REQUIREMENTS'].includes(g.from) ||
      ['MATCHING', 'PROPOSAL'].includes(g.from),
    );
    expect(discoveryGates.every(g => g.result === 'auto')).toBe(true);

    // Commitment gates should be blocked (Facilitator requires approval)
    const commitGate = gateResults.find(g => g.from === 'NEGOTIATION' && g.to === 'ACTIVE');
    expect(commitGate?.result).toBe('blocked');

    // Contract should be stuck at NEGOTIATION (couldn't auto-advance past it)
    expect(result.state).toBe('NEGOTIATION');
  });

  it('can proceed when human approves the commitment transition', () => {
    // Simulate Ahmed manually approving the NEGOTIATION→ACTIVE transition
    const contract = makeContract({ state: 'NEGOTIATION', id: 'ahmed-taxes' });
    const advanced = ContractStateMachine.transition(contract, 'ACTIVE', 'ahmed-f');
    expect(advanced.state).toBe('ACTIVE');
    expect(advanced.state_history[1].triggered_by).toBe('ahmed-f');
  });
});

// =============================================================
// Alex C. — 32, Austin, Upwork pro, Provider, Facilitator, $75/hr
// =============================================================
describe('Alex — Facilitator, provider-side $75/hr copywriting', () => {
  const autonomy: AutonomyLevel = 'facilitator';
  const amount = 750; // 10 hours of work
  const riskProfile: RiskProfile = {
    ...defaultRiskProfile,
    max_auto_commit_value: 1000, // Alex is a pro, higher threshold
  };

  it('blocks at commitment transitions as Facilitator', () => {
    // Alex wants to review every client before committing
    expect(evaluateAutonomyGate(
      'NEGOTIATION', 'ACTIVE', autonomy,
      { amount, currency: 'USD' }, riskProfile,
    )).toBe('blocked');

    expect(evaluateAutonomyGate(
      'VERIFICATION', 'COMPLETE', autonomy,
      { amount, currency: 'USD' }, riskProfile,
    )).toBe('blocked');
  });

  it('auto-advances through discovery phases', () => {
    expect(evaluateAutonomyGate(
      'INTENT', 'REQUIREMENTS', autonomy,
      { amount, currency: 'USD' }, riskProfile,
    )).toBe('auto');

    expect(evaluateAutonomyGate(
      'MATCHING', 'PROPOSAL', autonomy,
      { amount, currency: 'USD' }, riskProfile,
    )).toBe('auto');

    expect(evaluateAutonomyGate(
      'PROPOSAL', 'NEGOTIATION', autonomy,
      { amount, currency: 'USD' }, riskProfile,
    )).toBe('auto');
  });

  it('handles revision loop for copywriting revisions', () => {
    let contract = makeContract({
      state: 'VERIFICATION',
      id: 'alex-copywriting',
      revision_count: 0,
      max_revisions: 3,
    });

    // Client requests revisions
    contract = ContractStateMachine.transition(contract, 'ACTIVE', 'client-buyer');
    expect(contract.state).toBe('ACTIVE');
    expect(contract.revision_count).toBe(1);

    // Complete the revision
    contract = ContractStateMachine.transition(contract, 'VERIFICATION', 'alex-c');
    expect(contract.state).toBe('VERIFICATION');

    // Second revision
    contract = ContractStateMachine.transition(contract, 'ACTIVE', 'client-buyer');
    expect(contract.revision_count).toBe(2);
  });
});

// =============================================================
// Rosa M. — 34, South Bronx, Both sides, Agent, $0 community service
// =============================================================
describe('Rosa — Agent mode, pay-what-you-want community services', () => {
  const autonomy: AutonomyLevel = 'agent';
  const riskProfile: RiskProfile = {
    ...defaultRiskProfile,
    max_auto_commit_value: 100, // Rosa has limited budget
  };

  it('auto-advances entire flow for zero-cost contracts (providing)', () => {
    const amount = 0; // Pay-what-you-want, could be $0
    const contract = makeContract({
      id: 'rosa-navigation-help',
      participants: { buyer: 'community-member', provider: 'rosa-m', intermediaries: ['ai-agent'] },
      requirements: {
        description: 'Help navigating housing benefits application',
        acceptance_criteria: ['Application submitted', 'Follow-up steps documented'],
        category: 'community-services',
        tags: ['benefits', 'housing', 'navigation'],
        constraints: {},
      },
      terms: {
        pricing: { model: 'fixed', amount, currency: 'USD' },
        timeline: {},
        payment_trigger: 'on_completion',
        escrow: false,
        dispute_resolution: 'ai_mediated',
      },
    });

    const { contract: result, gateResults } = runFullHappyPath(contract, autonomy, riskProfile, amount);

    // All gates auto for Agent mode at $0
    expect(gateResults.every(g => g.result === 'auto')).toBe(true);
    expect(result.state).toBe('COMPLETE');
  });

  it('blocks when Rosa is buying MSW help that exceeds her auto-commit', () => {
    // Rosa buying grad school application help — more expensive
    const amount = 200;
    const gate = evaluateAutonomyGate(
      'NEGOTIATION', 'ACTIVE',
      autonomy,
      { amount, currency: 'USD' },
      riskProfile, // max_auto_commit is 100
    );
    // $200 > $100 max_auto_commit → blocked even in Agent mode
    expect(gate).toBe('blocked');
  });

  it('auto-approves when within Rosa\'s budget as buyer', () => {
    const amount = 50;
    const gate = evaluateAutonomyGate(
      'NEGOTIATION', 'ACTIVE',
      autonomy,
      { amount, currency: 'USD' },
      riskProfile,
    );
    expect(gate).toBe('auto');
  });
});

// =============================================================
// Harold B. — 70, rural AR, Provider, Delegate, delegation chain
// =============================================================
describe('Harold — Delegate with 3-level delegation chain', () => {
  const autonomy: AutonomyLevel = 'delegate';
  const amount = 20; // Harold charges $20/hr
  const riskProfile: RiskProfile = {
    ...defaultRiskProfile,
    max_auto_commit_value: 50, // Very modest
  };

  it('tracks delegation chain through contract transitions', () => {
    const contract = makeContract({
      id: 'harold-car-diagnosis',
      participants: {
        buyer: 'walter-p',
        provider: 'harold-b',
        intermediaries: ['grandson-jake', 'ai-agent-1'],
      },
      requirements: {
        description: 'Diagnose car making clicking noise when turning',
        acceptance_criteria: ['Diagnosis provided', 'Repair recommendation given'],
        category: 'automotive',
        tags: ['car-diagnosis', 'phone-consultation'],
        constraints: { modality: 'phone' },
      },
      terms: {
        pricing: { model: 'hourly', amount, currency: 'USD' },
        timeline: {},
        payment_trigger: 'on_completion',
        escrow: false,
        dispute_resolution: 'ai_mediated',
      },
    });

    // AI agent (acting on behalf of Harold via grandson) advances the contract
    const result = ContractStateMachine.transition(contract, 'REQUIREMENTS', 'ai-agent-1');

    // Delegation chain is preserved
    expect(result.participants.intermediaries).toEqual(['grandson-jake', 'ai-agent-1']);
    // The triggering agent is recorded
    expect(result.state_history[1].triggered_by).toBe('ai-agent-1');
  });

  it('completes full path at Delegate with low-value consultation', () => {
    const contract = makeContract({
      id: 'harold-car-diagnosis',
      terms: {
        pricing: { model: 'hourly', amount, currency: 'USD' },
        timeline: {},
        payment_trigger: 'on_completion',
        escrow: false,
        dispute_resolution: 'ai_mediated',
      },
    });

    const { contract: result, gateResults } = runFullHappyPath(contract, autonomy, riskProfile, amount);

    // All auto at Delegate + $20
    expect(gateResults.every(g => g.result === 'auto')).toBe(true);
    expect(result.state).toBe('COMPLETE');
  });

  it('blocks if someone tries to book Harold for expensive multi-day work', () => {
    // Someone wants Harold for a full day ($160) — exceeds his auto-commit
    const gate = evaluateAutonomyGate(
      'NEGOTIATION', 'ACTIVE',
      autonomy,
      { amount: 160, currency: 'USD' },
      riskProfile, // max_auto_commit = 50
    );
    expect(gate).toBe('blocked');
  });
});
