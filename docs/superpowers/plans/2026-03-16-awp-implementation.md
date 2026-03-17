# AWP Protocol Repo Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the AWP protocol repo into an investor-ready, engineering-grounded artifact — machine-readable protocol definitions, a working state machine, persona walkthrough scenarios, and a polished narrative document.

**Architecture:** TypeScript protocol library with JSON Schema definitions for all protocol entities, a contract state machine with autonomy gates, and narrative documents for investor conversations. Tests validate protocol rules. No external dependencies beyond dev tooling.

**Tech Stack:** TypeScript, Vitest, JSON Schema (draft 2020-12), Node.js

---

## Scope

This plan covers what goes in the `protocol` repo itself. Backend/frontend/AquaBot integration (Phase 2) will be separate plans in those repos.

**Deliverables:**
1. Repo infrastructure (TS, tests, linting)
2. JSON Schema definitions for all 6 protocol entities
3. TypeScript types aligned with schemas
4. Contract state machine with autonomy gate logic
5. Worked persona scenarios (5 personas, full protocol walkthrough)
6. Investor narrative document ("AWP in 5 minutes")

**Already complete (from design phase):**
- 4 SVG diagrams in `docs/specs/diagrams/` (layer model, state machine, handoff protocol, Dorothy scenario)
- 5 ADRs in `docs/decisions/`
- Full design spec in `docs/specs/`

## File Structure

```
protocol-work-protocol/
├── README.md                          (exists)
├── package.json                       (create)
├── tsconfig.json                      (create)
├── vitest.config.ts                   (create)
├── CLAUDE.md                          (create)
├── docs/
│   ├── README.md                      (exists)
│   ├── decisions/                     (exists, 5 ADRs)
│   ├── specs/                         (exists, design spec + diagrams)
│   ├── narrative/
│   │   └── awp-in-5-minutes.md        (create — investor-facing document)
│   └── scenarios/
│       ├── README.md                  (create — scenario index)
│       ├── dorothy-home-help.md       (create — full protocol walkthrough)
│       ├── ahmed-business-taxes.md    (create — ESL buyer journey)
│       ├── alex-upwork-migration.md   (create — provider migration)
│       ├── rosa-community-exchange.md (create — both-sides + non-monetary)
│       └── harold-car-diagnosis.md    (create — delegation chain)
└── src/
    ├── schemas/
    │   ├── identity-record.schema.json    (create)
    │   ├── capability-card.schema.json    (create)
    │   ├── work-contract.schema.json      (create)
    │   ├── execution-plan.schema.json     (create)
    │   ├── handoff-record.schema.json     (create)
    │   ├── outcome.schema.json            (create)
    │   └── index.ts                       (create — schema loader/validator)
    ├── types/
    │   ├── identity.ts                    (create)
    │   ├── capability.ts                  (create)
    │   ├── contract.ts                    (create)
    │   ├── execution.ts                   (create)
    │   ├── handoff.ts                     (create)
    │   ├── outcome.ts                     (create)
    │   └── index.ts                       (create — barrel export)
    ├── state-machine/
    │   ├── states.ts                      (create — state enum + transitions)
    │   ├── autonomy.ts                    (create — autonomy gate logic)
    │   ├── contract-machine.ts            (create — state machine engine)
    │   └── index.ts                       (create — barrel export)
    └── index.ts                           (create — public API)
tests/
    ├── schemas/
    │   └── schema-validation.test.ts      (create)
    ├── state-machine/
    │   ├── transitions.test.ts            (create)
    │   └── autonomy-gates.test.ts         (create)
    └── scenarios/
        └── persona-scenarios.test.ts      (create — run personas through state machine)
```

---

## Task 1: Repo Infrastructure

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `CLAUDE.md`
- Create: `.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@aquarius/protocol",
  "version": "0.1.0",
  "description": "Aquarius Work Protocol — the operating system for agent-powered services",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "ajv": "^8.17.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.claude/
```

- [ ] **Step 5: Create CLAUDE.md**

```markdown
# Aquarius Work Protocol — Claude Guidelines

## Overview

Protocol definition repo for AWP — the operating system for agent-powered services.
This is a TypeScript library, not a deployed service.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | Run tests (Vitest) |
| `npm run build` | Build TypeScript |
| `npm run lint` | Type-check |

## Structure

- `docs/` — Specs, ADRs, scenarios, investor narrative
- `src/schemas/` — JSON Schema definitions for protocol entities
- `src/types/` — TypeScript type definitions
- `src/state-machine/` — Contract state machine with autonomy gates
- `tests/` — Protocol validation tests

## Key Docs

- Design spec: `docs/specs/2026-03-16-awp-protocol-design.md`
- Decision records: `docs/decisions/`
- Persona scenarios: `docs/scenarios/`
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: `node_modules` created, lockfile generated

- [ ] **Step 7: Verify setup**

Run: `npm run lint`
Expected: No errors (no source files yet, just verifies TS config)

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts CLAUDE.md .gitignore package-lock.json
git commit -m "chore: initialize TypeScript project with Vitest"
```

---

## Task 2: TypeScript Type Definitions

Define all protocol entity types. These are the canonical TypeScript representation of the protocol — the schemas (Task 3) are generated to match these.

> **Note on TDD:** Types are compile-time-only definitions with no runtime logic. No unit tests needed — schema validation (Task 4) tests that data conforms to these structures, and the compile check verifies structural correctness.

**Files:**
- Create: `src/types/identity.ts`
- Create: `src/types/capability.ts`
- Create: `src/types/contract.ts`
- Create: `src/types/execution.ts`
- Create: `src/types/handoff.ts`
- Create: `src/types/outcome.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/identity.ts`**

```typescript
export type ParticipantType = 'human' | 'agent' | 'platform';

export type TrustLevel =
  | 'unverified'
  | 'community-verified'
  | 'platform-verified'
  | 'government-verified';

export type AutonomyLevel = 'advisor' | 'facilitator' | 'agent' | 'delegate';

export interface RiskProfile {
  max_auto_commit_value: number;
  max_auto_commit_currency: string;
  restricted_categories: string[];
  approval_rules: Record<string, unknown>;
}

export interface Preferences {
  communication_style?: string;
  language?: string;
  timezone?: string;
  accessibility_needs?: string[];
}

export interface IdentityRecord {
  id: string;
  type: ParticipantType;
  auth: { method: string; verified: boolean };
  trust_level: TrustLevel;
  autonomy_setting: AutonomyLevel;
  delegation_chain: string[];
  preferences: Preferences;
  risk_profile: RiskProfile;
}
```

- [ ] **Step 2: Create `src/types/capability.ts`**

```typescript
export type Modality = 'phone' | 'video' | 'text' | 'in-person' | 'web-automation';

export type PricingModel = 'hourly' | 'fixed' | 'milestone' | 'pay-what-you-want';

export interface Skill {
  name: string;
  category: string;
  proficiency_level: 'novice' | 'intermediate' | 'expert' | 'master';
}

export interface Constraint {
  type: string;
  description: string;
}

export interface PricingRange {
  model: PricingModel;
  min: number;
  max: number;
  currency: string;
}

export interface Performance {
  contracts_completed: number;
  completion_rate: number;
  avg_satisfaction: number;
  dispute_rate: number;
}

export interface CapabilityCard {
  participant_id: string;
  skills: Skill[];
  modalities: Modality[];
  confidence: number;
  constraints: Constraint[];
  availability: {
    schedule?: string;
    timezone: string;
    response_time_estimate?: string;
  };
  pricing: PricingRange;
  performance: Performance;
  version: {
    last_updated: string;
    change_log: string[];
  };
}

export interface MatchCandidate {
  participant_id: string;
  confidence_score: number;
  match_reasoning: string;
  uncertainty_flags: string[];
  estimated_price: number;
  estimated_timeline: string;
}

export interface MatchingRequest {
  requirements: Record<string, unknown>;
  buyer_preferences: Record<string, unknown>;
  constraints: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface MatchingResponse {
  candidates: MatchCandidate[];
  search_exhausted: boolean;
  fallback_suggestions: string[];
}
```

- [ ] **Step 3: Create `src/types/contract.ts`**

```typescript
export type ContractState =
  | 'INTENT'
  | 'REQUIREMENTS'
  | 'MATCHING'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'ACTIVE'
  | 'VERIFICATION'
  | 'COMPLETE'
  | 'DISPUTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export type PaymentTrigger =
  | 'on_acceptance'
  | 'on_milestone'
  | 'on_completion'
  | 'on_verification';

export type DisputeResolution = 'ai_mediated' | 'human_mediated' | 'platform_deferred';

export type VerificationMethod =
  | 'self_report'
  | 'evidence_based'
  | 'outcome_verified'
  | 'platform_verified';

export type VerificationResult = 'pending' | 'accepted' | 'disputed';

export interface ContractParticipants {
  buyer: string;
  provider: string;
  intermediaries: string[];
}

export interface ContractRequirements {
  description: string;
  acceptance_criteria: string[];
  category: string;
  tags: string[];
  constraints: Record<string, unknown>;
}

export interface ContractTerms {
  pricing: { model: string; amount: number; currency: string };
  timeline: { start?: string; deadline?: string; milestones?: string[] };
  payment_trigger: PaymentTrigger;
  escrow: boolean;
  dispute_resolution: DisputeResolution;
}

export interface StateHistoryEntry {
  state: ContractState;
  timestamp: string;
  triggered_by: string;
  autonomy_gate_result?: 'approved' | 'blocked' | 'auto';
}

export interface ContractVerification {
  method: VerificationMethod;
  evidence: string[];
  result: VerificationResult;
}

export interface WorkContract {
  id: string;
  outcome_id: string;
  participants: ContractParticipants;
  requirements: ContractRequirements;
  terms: ContractTerms;
  state: ContractState;
  state_history: StateHistoryEntry[];
  execution_plan_id?: string;
  verification: ContractVerification;
  revision_count: number;
  max_revisions: number;
}
```

- [ ] **Step 4: Create `src/types/execution.ts`**

```typescript
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'complete' | 'failed';

export interface HandoffPolicy {
  trigger: string;
  escalation_path: string[];
}

export interface ExecutionTask {
  id: string;
  description: string;
  assigned_to: string;
  status: TaskStatus;
  blocked_by: string[];
  handoff_policy: HandoffPolicy;
  evidence: string[];
}

export interface ExecutionPlan {
  id: string;
  contract_id: string;
  tasks: ExecutionTask[];
  handoff_log: string[];
}
```

- [ ] **Step 5: Create `src/types/handoff.ts`**

```typescript
export type HandoffReason =
  | 'capability_boundary'
  | 'confidence_drop'
  | 'autonomy_gate'
  | 'delegation'
  | 'platform_boundary';

export interface HandoffRecord {
  id: string;
  from: string;
  to: string;
  reason: HandoffReason;
  context_transferred: {
    summary: string;
    full_history_ref?: string;
    key_decisions: string[];
  };
  context_lost: string[];
  delegation_chain: string[];
  timestamp: string;
}
```

- [ ] **Step 6: Create `src/types/outcome.ts`**

```typescript
export type OutcomeStatus = 'active' | 'paused' | 'complete' | 'abandoned';

export interface OutcomeProgress {
  total_contracts: number;
  completed: number;
  in_progress: number;
  blocked: number;
}

export interface Outcome {
  id: string;
  owner: string;
  description: string;
  contracts: string[];
  status: OutcomeStatus;
  progress: OutcomeProgress;
  satisfaction?: number;
}
```

- [ ] **Step 7: Create `src/types/index.ts`**

```typescript
export * from './identity.js';
export * from './capability.js';
export * from './contract.js';
export * from './execution.js';
export * from './handoff.js';
export * from './outcome.js';
```

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/types/
git commit -m "feat: add TypeScript type definitions for all protocol entities"
```

---

## Task 3: Contract State Machine

The core protocol logic — which states can transition to which, and what autonomy gates apply.

**Files:**
- Create: `src/state-machine/states.ts`
- Create: `src/state-machine/autonomy.ts`
- Create: `src/state-machine/contract-machine.ts`
- Create: `src/state-machine/index.ts`
- Create: `src/index.ts`
- Test: `tests/state-machine/transitions.test.ts`
- Test: `tests/state-machine/autonomy-gates.test.ts`

- [ ] **Step 1: Write failing transition tests**

Create `tests/state-machine/transitions.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/state-machine/transitions.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create `src/state-machine/states.ts`**

```typescript
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
```

- [ ] **Step 4: Create `src/state-machine/contract-machine.ts`**

```typescript
import type { WorkContract, ContractState, StateHistoryEntry } from '../types/contract.js';
import { isTerminalState, isValidTransition } from './states.js';

export class ContractStateMachine {
  static transition(
    contract: WorkContract,
    to: ContractState,
    triggered_by: string,
  ): WorkContract {
    const from = contract.state;

    if (isTerminalState(from)) {
      throw new Error(`Cannot transition from terminal state: ${from}`);
    }

    if (!isValidTransition(from, to)) {
      throw new Error(`Invalid transition: ${from} → ${to}`);
    }

    // Revision loop guard
    if (from === 'VERIFICATION' && to === 'ACTIVE') {
      if (contract.revision_count >= contract.max_revisions) {
        throw new Error(
          `Max revisions reached (${contract.max_revisions}). Cannot revise further.`,
        );
      }
    }

    const historyEntry: StateHistoryEntry = {
      state: to,
      timestamp: new Date().toISOString(),
      triggered_by,
      autonomy_gate_result: 'auto',
    };

    return {
      ...contract,
      state: to,
      state_history: [...contract.state_history, historyEntry],
      revision_count:
        from === 'VERIFICATION' && to === 'ACTIVE'
          ? contract.revision_count + 1
          : contract.revision_count,
    };
  }
}
```

- [ ] **Step 5: Create `src/state-machine/index.ts`**

```typescript
export { ContractStateMachine } from './contract-machine.js';
export { isTerminalState, isValidTransition, getValidTransitions } from './states.js';
```

- [ ] **Step 6: Create `src/index.ts`**

```typescript
export * from './types/index.js';
export * from './state-machine/index.js';
```

- [ ] **Step 7: Run transition tests**

Run: `npx vitest run tests/state-machine/transitions.test.ts`
Expected: All PASS

- [ ] **Step 8: Write failing autonomy gate tests**

Create `tests/state-machine/autonomy-gates.test.ts`:

```typescript
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
```

- [ ] **Step 9: Run autonomy tests to verify they fail**

Run: `npx vitest run tests/state-machine/autonomy-gates.test.ts`
Expected: FAIL — module not found

- [ ] **Step 10: Create `src/state-machine/autonomy.ts`**

```typescript
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
```

- [ ] **Step 11: Update `src/state-machine/index.ts`**

```typescript
export { ContractStateMachine } from './contract-machine.js';
export { isTerminalState, isValidTransition, getValidTransitions } from './states.js';
export { evaluateAutonomyGate } from './autonomy.js';
```

- [ ] **Step 12: Run all state machine tests**

Run: `npx vitest run tests/state-machine/`
Expected: All PASS

- [ ] **Step 13: Commit**

```bash
git add src/state-machine/ src/index.ts tests/state-machine/
git commit -m "feat: implement contract state machine with autonomy gates"
```

---

## Task 4: JSON Schema Definitions

Machine-readable protocol definitions. These validate that protocol entities conform to the spec — useful for external implementors and for our own tests.

**Files:**
- Create: `src/schemas/identity-record.schema.json`
- Create: `src/schemas/capability-card.schema.json`
- Create: `src/schemas/work-contract.schema.json`
- Create: `src/schemas/execution-plan.schema.json`
- Create: `src/schemas/handoff-record.schema.json`
- Create: `src/schemas/outcome.schema.json`
- Create: `src/schemas/index.ts`
- Test: `tests/schemas/schema-validation.test.ts`

- [ ] **Step 1: Write failing schema validation tests**

Create `tests/schemas/schema-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateIdentityRecord, validateWorkContract, validateOutcome } from '../../src/schemas/index.js';

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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/schemas/`
Expected: FAIL — module not found

- [ ] **Step 3: Create all 6 JSON Schema files**

Create `src/schemas/identity-record.schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://protocol.peopleaquarius.com/schemas/identity-record",
  "title": "AWP Identity Record",
  "type": "object",
  "required": ["id", "type", "auth", "trust_level", "autonomy_setting", "delegation_chain", "preferences", "risk_profile"],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "string" },
    "type": { "type": "string", "enum": ["human", "agent", "platform"] },
    "auth": {
      "type": "object",
      "required": ["method", "verified"],
      "properties": {
        "method": { "type": "string" },
        "verified": { "type": "boolean" }
      }
    },
    "trust_level": { "type": "string", "enum": ["unverified", "community-verified", "platform-verified", "government-verified"] },
    "autonomy_setting": { "type": "string", "enum": ["advisor", "facilitator", "agent", "delegate"] },
    "delegation_chain": { "type": "array", "items": { "type": "string" } },
    "preferences": { "type": "object" },
    "risk_profile": {
      "type": "object",
      "required": ["max_auto_commit_value", "max_auto_commit_currency", "restricted_categories", "approval_rules"],
      "properties": {
        "max_auto_commit_value": { "type": "number" },
        "max_auto_commit_currency": { "type": "string" },
        "restricted_categories": { "type": "array", "items": { "type": "string" } },
        "approval_rules": { "type": "object" }
      }
    }
  }
}
```

Create `src/schemas/work-contract.schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://protocol.peopleaquarius.com/schemas/work-contract",
  "title": "AWP Work Contract",
  "type": "object",
  "required": ["id", "outcome_id", "participants", "requirements", "terms", "state", "state_history", "verification", "revision_count", "max_revisions"],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "string" },
    "outcome_id": { "type": "string" },
    "participants": {
      "type": "object",
      "required": ["buyer", "provider", "intermediaries"],
      "properties": {
        "buyer": { "type": "string" },
        "provider": { "type": "string" },
        "intermediaries": { "type": "array", "items": { "type": "string" } }
      }
    },
    "requirements": {
      "type": "object",
      "required": ["description", "acceptance_criteria", "category", "tags", "constraints"],
      "properties": {
        "description": { "type": "string" },
        "acceptance_criteria": { "type": "array", "items": { "type": "string" } },
        "category": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "constraints": { "type": "object" }
      }
    },
    "terms": {
      "type": "object",
      "required": ["pricing", "timeline", "payment_trigger", "escrow", "dispute_resolution"],
      "properties": {
        "pricing": {
          "type": "object",
          "required": ["model", "amount", "currency"],
          "properties": {
            "model": { "type": "string" },
            "amount": { "type": "number" },
            "currency": { "type": "string" }
          }
        },
        "timeline": { "type": "object" },
        "payment_trigger": { "type": "string", "enum": ["on_acceptance", "on_milestone", "on_completion", "on_verification"] },
        "escrow": { "type": "boolean" },
        "dispute_resolution": { "type": "string", "enum": ["ai_mediated", "human_mediated", "platform_deferred"] }
      }
    },
    "state": { "type": "string", "enum": ["INTENT", "REQUIREMENTS", "MATCHING", "PROPOSAL", "NEGOTIATION", "ACTIVE", "VERIFICATION", "COMPLETE", "DISPUTED", "CANCELLED", "EXPIRED", "FAILED"] },
    "state_history": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["state", "timestamp", "triggered_by"],
        "properties": {
          "state": { "type": "string" },
          "timestamp": { "type": "string" },
          "triggered_by": { "type": "string" },
          "autonomy_gate_result": { "type": "string", "enum": ["approved", "blocked", "auto"] }
        }
      }
    },
    "execution_plan_id": { "type": "string" },
    "verification": {
      "type": "object",
      "required": ["method", "evidence", "result"],
      "properties": {
        "method": { "type": "string", "enum": ["self_report", "evidence_based", "outcome_verified", "platform_verified"] },
        "evidence": { "type": "array", "items": { "type": "string" } },
        "result": { "type": "string", "enum": ["pending", "accepted", "disputed"] }
      }
    },
    "revision_count": { "type": "integer", "minimum": 0 },
    "max_revisions": { "type": "integer", "minimum": 1 }
  }
}
```

Create `src/schemas/outcome.schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://protocol.peopleaquarius.com/schemas/outcome",
  "title": "AWP Outcome",
  "type": "object",
  "required": ["id", "owner", "description", "contracts", "status", "progress"],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "string" },
    "owner": { "type": "string" },
    "description": { "type": "string" },
    "contracts": { "type": "array", "items": { "type": "string" } },
    "status": { "type": "string", "enum": ["active", "paused", "complete", "abandoned"] },
    "progress": {
      "type": "object",
      "required": ["total_contracts", "completed", "in_progress", "blocked"],
      "properties": {
        "total_contracts": { "type": "integer" },
        "completed": { "type": "integer" },
        "in_progress": { "type": "integer" },
        "blocked": { "type": "integer" }
      }
    },
    "satisfaction": { "type": "number" }
  }
}
```

Create `src/schemas/capability-card.schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://protocol.peopleaquarius.com/schemas/capability-card",
  "title": "AWP Capability Card",
  "type": "object",
  "required": ["participant_id", "skills", "modalities", "confidence", "constraints", "availability", "pricing", "performance", "version"],
  "additionalProperties": false,
  "properties": {
    "participant_id": { "type": "string" },
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "category", "proficiency_level"],
        "properties": {
          "name": { "type": "string" },
          "category": { "type": "string" },
          "proficiency_level": { "type": "string", "enum": ["novice", "intermediate", "expert", "master"] }
        }
      }
    },
    "modalities": { "type": "array", "items": { "type": "string", "enum": ["phone", "video", "text", "in-person", "web-automation"] } },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "constraints": { "type": "array", "items": { "type": "object", "required": ["type", "description"], "properties": { "type": { "type": "string" }, "description": { "type": "string" } } } },
    "availability": { "type": "object", "required": ["timezone"], "properties": { "schedule": { "type": "string" }, "timezone": { "type": "string" }, "response_time_estimate": { "type": "string" } } },
    "pricing": { "type": "object", "required": ["model", "min", "max", "currency"], "properties": { "model": { "type": "string", "enum": ["hourly", "fixed", "milestone", "pay-what-you-want"] }, "min": { "type": "number" }, "max": { "type": "number" }, "currency": { "type": "string" } } },
    "performance": { "type": "object", "required": ["contracts_completed", "completion_rate", "avg_satisfaction", "dispute_rate"], "properties": { "contracts_completed": { "type": "integer" }, "completion_rate": { "type": "number" }, "avg_satisfaction": { "type": "number" }, "dispute_rate": { "type": "number" } } },
    "version": { "type": "object", "required": ["last_updated", "change_log"], "properties": { "last_updated": { "type": "string" }, "change_log": { "type": "array", "items": { "type": "string" } } } }
  }
}
```

Create `src/schemas/execution-plan.schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://protocol.peopleaquarius.com/schemas/execution-plan",
  "title": "AWP Execution Plan",
  "type": "object",
  "required": ["id", "contract_id", "tasks", "handoff_log"],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "string" },
    "contract_id": { "type": "string" },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "description", "assigned_to", "status", "blocked_by", "handoff_policy", "evidence"],
        "properties": {
          "id": { "type": "string" },
          "description": { "type": "string" },
          "assigned_to": { "type": "string" },
          "status": { "type": "string", "enum": ["pending", "in_progress", "blocked", "complete", "failed"] },
          "blocked_by": { "type": "array", "items": { "type": "string" } },
          "handoff_policy": { "type": "object", "required": ["trigger", "escalation_path"], "properties": { "trigger": { "type": "string" }, "escalation_path": { "type": "array", "items": { "type": "string" } } } },
          "evidence": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "handoff_log": { "type": "array", "items": { "type": "string" } }
  }
}
```

Create `src/schemas/handoff-record.schema.json`:
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://protocol.peopleaquarius.com/schemas/handoff-record",
  "title": "AWP Handoff Record",
  "type": "object",
  "required": ["id", "from", "to", "reason", "context_transferred", "context_lost", "delegation_chain", "timestamp"],
  "additionalProperties": false,
  "properties": {
    "id": { "type": "string" },
    "from": { "type": "string" },
    "to": { "type": "string" },
    "reason": { "type": "string", "enum": ["capability_boundary", "confidence_drop", "autonomy_gate", "delegation", "platform_boundary"] },
    "context_transferred": {
      "type": "object",
      "required": ["summary", "key_decisions"],
      "properties": {
        "summary": { "type": "string" },
        "full_history_ref": { "type": "string" },
        "key_decisions": { "type": "array", "items": { "type": "string" } }
      }
    },
    "context_lost": { "type": "array", "items": { "type": "string" } },
    "delegation_chain": { "type": "array", "items": { "type": "string" } },
    "timestamp": { "type": "string" }
  }
}
```

- [ ] **Step 4: Create `src/schemas/index.ts`**

```typescript
import Ajv from 'ajv';

import identitySchema from './identity-record.schema.json' with { type: 'json' };
import contractSchema from './work-contract.schema.json' with { type: 'json' };
import outcomeSchema from './outcome.schema.json' with { type: 'json' };
import capabilitySchema from './capability-card.schema.json' with { type: 'json' };
import executionSchema from './execution-plan.schema.json' with { type: 'json' };
import handoffSchema from './handoff-record.schema.json' with { type: 'json' };

const ajv = new Ajv();

export const validateIdentityRecord = ajv.compile(identitySchema);
export const validateWorkContract = ajv.compile(contractSchema);
export const validateOutcome = ajv.compile(outcomeSchema);
export const validateCapabilityCard = ajv.compile(capabilitySchema);
export const validateExecutionPlan = ajv.compile(executionSchema);
export const validateHandoffRecord = ajv.compile(handoffSchema);
```

- [ ] **Step 5: Run schema tests**

Run: `npx vitest run tests/schemas/`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/schemas/ tests/schemas/
git commit -m "feat: add JSON Schema definitions with validation for all protocol entities"
```

---

## Task 5: Persona Scenario Walkthroughs

Five detailed scenarios showing the protocol in action with real personas. These are both investor-pitch materials and protocol validation — if a scenario breaks the protocol, we have a design bug.

**Files:**
- Create: `docs/scenarios/README.md`
- Create: `docs/scenarios/dorothy-home-help.md`
- Create: `docs/scenarios/ahmed-business-taxes.md`
- Create: `docs/scenarios/alex-upwork-migration.md`
- Create: `docs/scenarios/rosa-community-exchange.md`
- Create: `docs/scenarios/harold-car-diagnosis.md`

- [ ] **Step 1: Create `docs/scenarios/README.md`**

```markdown
# AWP Persona Scenarios

Real-world protocol walkthroughs using personas from the Aquarius simulation system.
Each scenario shows a complete journey through the protocol layers and contract states.

These scenarios serve two purposes:
1. **Investor pitch** — concrete examples of how AWP works for real people
2. **Protocol validation** — if a scenario breaks the protocol, it's a design bug

| Scenario | Persona | Mode | Key Protocol Features |
|----------|---------|------|----------------------|
| [Dorothy's Home Help](dorothy-home-help.md) | Dorothy H. (71, rural WI) | Buyer, Delegate | Multi-contract outcome, full AI delegation |
| [Ahmed's Business Taxes](ahmed-business-taxes.md) | Ahmed F. (44, Minneapolis) | Buyer, Facilitator | ESL matching, cultural trust signals |
| [Alex's Upwork Migration](alex-upwork-migration.md) | Alex C. (32, Austin) | Provider, Facilitator | Reputation portability, fee comparison |
| [Rosa's Community Exchange](rosa-community-exchange.md) | Rosa M. (34, South Bronx) | Both, Agent | Non-monetary value, both-sides protocol |
| [Harold's Car Diagnosis](harold-car-diagnosis.md) | Harold B. (70, rural AR) | Provider, Delegate | Delegation chain, family-assisted |
```

- [ ] **Step 2: Write Dorothy's scenario**

Create `docs/scenarios/dorothy-home-help.md` — a detailed walkthrough of Dorothy's journey through every protocol layer and contract state. Include:
- Her Identity Record (type: human, autonomy: delegate, trust: community-verified)
- Outcome: "Get reliable home help"
- 3 contracts at different stages (gutter cleaning, thermostat, iPad tutoring)
- Every state transition with who triggered it and why
- Handoff records (AI→handyman, AI→Dorothy for verification)
- Autonomy gates encountered (and why most were auto-approved)
- What Dorothy actually *sees* vs. what the protocol tracks

This should be ~200-300 lines, readable by a non-technical investor.

- [ ] **Step 3: Write Ahmed's scenario**

Create `docs/scenarios/ahmed-business-taxes.md` — Ahmed's journey highlighting:
- ESL matching constraints (uncertainty flags)
- Community trust signals (Somali community verification)
- Facilitator autonomy (Ahmed wants to understand each step)
- Cultural fit in matching (bilingual accountant preference)

- [ ] **Step 4: Write Alex's scenario**

Create `docs/scenarios/alex-upwork-migration.md` — Alex's provider-side journey:
- Capability Card import from Upwork portfolio
- How confidence is bootstrapped for new platform participants
- Fee transparency (5% vs. 20%)
- First contract as provider on Aquarius

- [ ] **Step 5: Write Rosa's scenario**

Create `docs/scenarios/rosa-community-exchange.md` — Rosa as both buyer and provider:
- Pay-what-you-want pricing for her navigation services
- Buying MSW application help (standard contract)
- Non-monetary value exchange
- Community credit model

- [ ] **Step 6: Write Harold's scenario**

Create `docs/scenarios/harold-car-diagnosis.md` — Harold's delegation chain:
- Harold → grandson → AI (3-level delegation)
- Capability Card: master-level car diagnosis, phone/video only
- Full delegation chain tracked in handoff records
- What the buyer sees ("Harold's Auto Diagnosis, managed by AI")

- [ ] **Step 7: Commit**

```bash
git add docs/scenarios/
git commit -m "docs: add 5 persona scenario walkthroughs"
```

---

## Task 6: Persona Scenario Tests

Run the persona scenarios through the actual state machine to validate the protocol handles them correctly.

**Files:**
- Create: `tests/scenarios/persona-scenarios.test.ts`

- [ ] **Step 1: Write scenario tests**

Create `tests/scenarios/persona-scenarios.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ContractStateMachine } from '../../src/state-machine/index.js';
import { evaluateAutonomyGate } from '../../src/state-machine/autonomy.js';
import type { WorkContract } from '../../src/types/index.js';
import type { AutonomyLevel, RiskProfile } from '../../src/types/identity.js';

function makeContract(overrides: Partial<WorkContract> = {}): WorkContract {
  return {
    id: 'test-1', outcome_id: 'outcome-1',
    participants: { buyer: 'buyer', provider: '', intermediaries: [] },
    requirements: { description: '', acceptance_criteria: [], category: '', tags: [], constraints: {} },
    terms: { pricing: { model: 'fixed', amount: 85, currency: 'USD' }, timeline: {}, payment_trigger: 'on_completion', escrow: false, dispute_resolution: 'ai_mediated' },
    state: 'INTENT',
    state_history: [{ state: 'INTENT', timestamp: new Date().toISOString(), triggered_by: 'test' }],
    verification: { method: 'self_report', evidence: [], result: 'pending' },
    revision_count: 0, max_revisions: 3,
    ...overrides,
  };
}

const riskProfile: RiskProfile = { max_auto_commit_value: 200, max_auto_commit_currency: 'USD', restricted_categories: [], approval_rules: {} };

describe('Dorothy — Delegate, $85 gutter cleaning', () => {
  const autonomy: AutonomyLevel = 'delegate';
  const amount = 85;

  it('completes full happy path with all gates auto-approved', () => {
    const states = ['REQUIREMENTS', 'MATCHING', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'VERIFICATION', 'COMPLETE'] as const;
    let contract = makeContract({ terms: { pricing: { model: 'fixed', amount, currency: 'USD' }, timeline: {}, payment_trigger: 'on_completion', escrow: false, dispute_resolution: 'ai_mediated' } });

    for (const next of states) {
      const gate = evaluateAutonomyGate(contract.state, next, autonomy, { amount, currency: 'USD' }, riskProfile);
      expect(gate).toBe('auto');
      contract = ContractStateMachine.transition(contract, next, 'ai-agent');
    }
    expect(contract.state).toBe('COMPLETE');
  });
});

describe('Ahmed — Facilitator, $300 tax help', () => {
  const autonomy: AutonomyLevel = 'facilitator';
  const amount = 300;
  const ahmedRisk: RiskProfile = { ...riskProfile, max_auto_commit_value: 500 };

  it('auto-advances through discovery, blocks at commitment', () => {
    // Discovery phase: auto
    expect(evaluateAutonomyGate('INTENT', 'REQUIREMENTS', autonomy, { amount, currency: 'USD' }, ahmedRisk)).toBe('auto');
    expect(evaluateAutonomyGate('REQUIREMENTS', 'MATCHING', autonomy, { amount, currency: 'USD' }, ahmedRisk)).toBe('auto');

    // Commitment: blocked (facilitator must approve)
    expect(evaluateAutonomyGate('NEGOTIATION', 'ACTIVE', autonomy, { amount, currency: 'USD' }, ahmedRisk)).toBe('blocked');
    expect(evaluateAutonomyGate('VERIFICATION', 'COMPLETE', autonomy, { amount, currency: 'USD' }, ahmedRisk)).toBe('blocked');
  });
});

describe('Alex — Facilitator, provider-side $75/hr copywriting', () => {
  const autonomy: AutonomyLevel = 'facilitator';

  it('blocks at commitment as facilitator even at moderate value', () => {
    const amount = 75;
    expect(evaluateAutonomyGate('NEGOTIATION', 'ACTIVE', autonomy, { amount, currency: 'USD' }, riskProfile)).toBe('blocked');
  });

  it('auto-advances through discovery phases', () => {
    expect(evaluateAutonomyGate('INTENT', 'REQUIREMENTS', autonomy, { amount: 75, currency: 'USD' }, riskProfile)).toBe('auto');
    expect(evaluateAutonomyGate('MATCHING', 'PROPOSAL', autonomy, { amount: 75, currency: 'USD' }, riskProfile)).toBe('auto');
  });
});

describe('Rosa — Agent mode, pay-what-you-want $0 community service', () => {
  const autonomy: AutonomyLevel = 'agent';

  it('auto-advances entire flow for zero-cost contracts', () => {
    const amount = 0;
    const states = ['REQUIREMENTS', 'MATCHING', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'VERIFICATION', 'COMPLETE'] as const;
    let contract = makeContract({ terms: { pricing: { model: 'fixed', amount, currency: 'USD' }, timeline: {}, payment_trigger: 'on_completion', escrow: false, dispute_resolution: 'ai_mediated' } });

    for (const next of states) {
      const gate = evaluateAutonomyGate(contract.state, next, autonomy, { amount, currency: 'USD' }, riskProfile);
      expect(gate).toBe('auto');
      contract = ContractStateMachine.transition(contract, next, 'ai-agent');
    }
    expect(contract.state).toBe('COMPLETE');
  });
});

describe('Harold — Delegate with 3-level delegation chain', () => {
  it('tracks delegation chain through contract transitions', () => {
    const contract = makeContract({
      participants: {
        buyer: 'buyer-walter',
        provider: 'harold',
        intermediaries: ['grandson-jake', 'ai-agent-1'],
      },
    });

    // Delegation chain is preserved through state transitions
    const result = ContractStateMachine.transition(contract, 'REQUIREMENTS', 'ai-agent-1');
    expect(result.participants.intermediaries).toEqual(['grandson-jake', 'ai-agent-1']);
    expect(result.state_history[1].triggered_by).toBe('ai-agent-1');
  });
});
```

- [ ] **Step 2: Run scenario tests**

Run: `npx vitest run tests/scenarios/`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add tests/scenarios/
git commit -m "test: add persona scenario tests validating protocol against real-world cases"
```

---

## Task 7: Investor Narrative Document

A polished, non-technical document for investor conversations. Not the spec — the "why this matters" story.

**Files:**
- Create: `docs/narrative/awp-in-5-minutes.md`

- [ ] **Step 1: Write the narrative**

Create `docs/narrative/awp-in-5-minutes.md`. Structure:

1. **The Problem** (1 paragraph) — Today's marketplaces break when AI enters the picture
2. **The Insight** (1 paragraph) — Work needs a protocol, like payments needed Stripe
3. **How It Works** (5 short sections, one per layer, in plain English with diagrams)
4. **Real People, Real Outcomes** (3 persona mini-stories: Dorothy, Alex, Ahmed)
5. **The Autonomy Model** (the investment risk profile analogy — this is the "aha" moment)
6. **Why Now** (AI agents are here, marketplaces haven't adapted)
7. **The Business** (5% transaction fee, Stripe-for-work positioning)
8. **Phasing** (Pitch → Build → Open standard)

Tone: confident, concrete, no jargon. Every technical concept explained through a persona example. Use the SVG diagrams where they help.

This should be ~300-400 lines, readable in 5 minutes.

- [ ] **Step 2: Commit**

```bash
git add docs/narrative/
git commit -m "docs: add investor narrative — AWP in 5 minutes"
```

---

## Task 8: Final Wiring and Docs Update

**Files:**
- Modify: `docs/README.md`
- Modify: `README.md`

- [ ] **Step 1: Update docs/README.md with all new sections**

Add links to scenarios, narrative, and note the TypeScript implementation.

- [ ] **Step 2: Update root README.md**

Add quickstart (install, test, build), link to narrative for non-technical readers, link to spec for technical readers.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All tests pass (transitions, autonomy gates, schemas, persona scenarios)

- [ ] **Step 4: Commit**

```bash
git add docs/README.md README.md
git commit -m "docs: update README with links to all protocol materials"
```
