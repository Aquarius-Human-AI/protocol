import { describe, it, expect } from 'vitest';
import { validateIdentityRecord, validateWorkContract, validateOutcome, validateCapabilityCard, validateHandoffRecord, validateExecutionPlan } from '../../src/schemas/index.js';

describe('Schema Validation', () => {
  it('validates a valid IdentityRecord', () => {
    const record = {
      id: 'user-dorothy',
      type: 'human',
      auth: { method: 'email', verified: true },
      trust_level: 'community-verified',
      autonomy_setting: 'delegate',
      delegation_chain: [],
      preferences: { language: 'en', timezone: 'America/Chicago' },
      risk_profile: { max_auto_commit_value: 200, max_auto_commit_currency: 'USD', restricted_categories: [], approval_rules: {} },
    };
    expect(validateIdentityRecord(record)).toBe(true);
  });

  it('rejects IdentityRecord with invalid type', () => {
    const record = {
      id: 'bad',
      type: 'robot',
      auth: { method: 'email', verified: true },
      trust_level: 'unverified',
      autonomy_setting: 'advisor',
      delegation_chain: [],
      preferences: {},
      risk_profile: { max_auto_commit_value: 0, max_auto_commit_currency: 'USD', restricted_categories: [], approval_rules: {} },
    };
    expect(validateIdentityRecord(record)).toBe(false);
  });

  it('validates a valid WorkContract', () => {
    const contract = {
      id: 'contract-1',
      outcome_id: 'outcome-1',
      participants: { buyer: 'buyer-1', provider: 'provider-1', intermediaries: [] },
      requirements: { description: 'Clean gutters', acceptance_criteria: ['Gutters clear'], category: 'home', tags: [], constraints: {} },
      terms: { pricing: { model: 'fixed', amount: 85, currency: 'USD' }, timeline: {}, payment_trigger: 'on_completion', escrow: false, dispute_resolution: 'ai_mediated' },
      state: 'INTENT',
      state_history: [{ state: 'INTENT', timestamp: '2026-03-16T00:00:00Z', triggered_by: 'dorothy' }],
      verification: { method: 'self_report', evidence: [], result: 'pending' },
      revision_count: 0,
      max_revisions: 3,
    };
    expect(validateWorkContract(contract)).toBe(true);
  });

  it('rejects WorkContract with invalid state', () => {
    const contract = {
      id: 'contract-1',
      outcome_id: 'outcome-1',
      participants: { buyer: 'buyer-1', provider: '', intermediaries: [] },
      requirements: { description: 'Test', acceptance_criteria: [], category: 'test', tags: [], constraints: {} },
      terms: { pricing: { model: 'fixed', amount: 0, currency: 'USD' }, timeline: {}, payment_trigger: 'on_completion', escrow: false, dispute_resolution: 'ai_mediated' },
      state: 'INVALID_STATE',
      state_history: [],
      verification: { method: 'self_report', evidence: [], result: 'pending' },
      revision_count: 0,
      max_revisions: 3,
    };
    expect(validateWorkContract(contract)).toBe(false);
  });

  it('validates a valid Outcome', () => {
    const outcome = {
      id: 'outcome-1',
      owner: 'dorothy',
      description: 'Get reliable home help',
      contracts: ['contract-1', 'contract-2'],
      status: 'active',
      progress: { total_contracts: 2, completed: 0, in_progress: 1, blocked: 0 },
    };
    expect(validateOutcome(outcome)).toBe(true);
  });

  it('validates a valid CapabilityCard', () => {
    const card = {
      participant_id: 'harold',
      skills: [{ name: 'car-diagnosis', category: 'automotive', proficiency_level: 'master' }],
      modalities: ['phone', 'video'],
      confidence: 0.95,
      constraints: [{ type: 'family-assisted', description: 'scheduling handled by grandson' }],
      availability: { timezone: 'America/Chicago' },
      pricing: { model: 'hourly', min: 15, max: 25, currency: 'USD' },
      performance: { contracts_completed: 47, completion_rate: 0.98, avg_satisfaction: 4.8, dispute_rate: 0 },
      version: { last_updated: '2026-03-16', change_log: [] },
    };
    expect(validateCapabilityCard(card)).toBe(true);
  });

  it('validates a valid HandoffRecord', () => {
    const record = {
      id: 'handoff-1',
      from: 'ai-agent',
      to: 'handyman-mike',
      reason: 'capability_boundary',
      context_transferred: { summary: 'Dorothy needs gutters cleaned', key_decisions: ['Tuesday 2pm'] },
      context_lost: [],
      delegation_chain: ['dorothy', 'ai-agent'],
      timestamp: '2026-03-16T14:30:00Z',
    };
    expect(validateHandoffRecord(record)).toBe(true);
  });

  it('rejects HandoffRecord with invalid reason', () => {
    const record = {
      id: 'handoff-1', from: 'a', to: 'b', reason: 'just_because',
      context_transferred: { summary: '', key_decisions: [] },
      context_lost: [], delegation_chain: [], timestamp: '2026-03-16T00:00:00Z',
    };
    expect(validateHandoffRecord(record)).toBe(false);
  });

  it('validates a valid ExecutionPlan', () => {
    const plan = {
      id: 'plan-1',
      contract_id: 'contract-1',
      tasks: [{
        id: 'task-1', description: 'Find available date', assigned_to: 'ai-agent',
        status: 'complete', blocked_by: [],
        handoff_policy: { trigger: 'capability_boundary', escalation_path: ['handyman'] },
        evidence: [],
      }],
      handoff_log: [],
    };
    expect(validateExecutionPlan(plan)).toBe(true);
  });
});
