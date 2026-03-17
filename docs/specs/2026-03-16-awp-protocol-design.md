# Aquarius Work Protocol (AWP) — Design Specification

**Version:** 0.1.0 (Draft)
**Date:** 2026-03-16
**Authors:** Andrew Beveridge (founder), Claude (AI collaborator)
**Status:** Design phase

> *The operating system for agent-powered services.*

---

## 1. Executive Summary

The Aquarius Work Protocol (AWP) is a protocol for defining, matching, executing, and verifying work between any combination of humans, AI agents, and external platforms.

Today's service marketplaces (Fiverr, Upwork, TaskRabbit) are designed for humans negotiating with humans. They break down when AI agents enter the picture — as workers, as buyers, or as intermediaries. AWP is the protocol layer that makes human-agent-platform collaboration native, not bolted on.

**Core thesis:** Just as Stripe abstracted payment complexity ("accept payments with 7 lines of code"), AWP abstracts work complexity — defining outcomes, matching capabilities, managing execution, and triggering payment through a unified protocol that works regardless of whether the participants are human, AI, or a mix of both.

**What AWP enables:**
- A 71-year-old widow in rural Wisconsin says "I need help around the house" and an AI agent manages three parallel service contracts on her behalf
- A freelance copywriter migrates her Upwork clients to better economics without rebuilding her reputation from scratch
- An AI agent on Aquarius subcontracts research tasks to another AI agent, with the same contract guarantees as human-to-human work
- A Somali refugee in Minneapolis finds a bilingual accountant through community trust signals, not keyword search

---

## 2. The Five-Layer Architecture

AWP is organized into five layers, each handling one concern. Layers communicate only with their immediate neighbors, similar to the TCP/IP networking model.

![Five-Layer Architecture](diagrams/layer-model.svg)

### Layer 1: Identity

**Purpose:** Establish who or what is participating, and under what terms.

Every participant in the protocol has an **Identity Record**:

```
Identity Record
├── id: unique identifier
├── type: human | agent | platform
├── auth: authentication credentials / method
├── trust_level: unverified | community-verified | platform-verified | government-verified
├── autonomy_setting: advisor | facilitator | agent | delegate
├── delegation_chain: [delegator_ids]  (who authorized this participant to act?)
├── preferences: { communication_style, language, timezone, accessibility_needs }
└── risk_profile: { max_auto_commit_value, restricted_categories, approval_rules }
```

**Key design decisions:**
- **Autonomy is configured here, enforced everywhere.** The Identity layer stores the user's autonomy preference; layers 3–5 consult it before advancing contract states.
- **Delegation is first-class.** Harold's grandson acts on his behalf; the AI acts on behalf of the grandson. The full chain is tracked so any participant can understand who they're ultimately dealing with.
- **Type-agnostic.** The protocol doesn't privilege humans over agents. An AI agent has an identity record just like a human does. Trust is earned the same way — through performance history.

### Layer 2: Capability

**Purpose:** What can this participant do, how confident are we, and what are the constraints?

Every participant (human, agent, or platform adapter) registers capabilities as **Capability Cards**:

```
Capability Card
├── participant_id: reference to Identity Record
├── skills: [{ name, category, proficiency_level }]
├── modalities: [phone, video, text, in-person, web-automation]
├── confidence: 0.0–1.0 (earned from performance history)
├── constraints: [{ type, description }]
│   e.g., { type: "family-assisted", description: "scheduling handled by proxy" }
│   e.g., { type: "language", description: "ESL — simple English preferred" }
│   e.g., { type: "platform", description: "cannot bypass login walls" }
├── availability: { schedule, timezone, response_time_estimate }
├── pricing: { model: hourly|fixed|milestone|pay-what-you-want, range, currency }
└── performance: { contracts_completed, completion_rate, avg_satisfaction, dispute_rate }
```

**Confidence is earned, not claimed.** A new participant starts with a base confidence derived from their verified credentials. Confidence adjusts with every completed (or failed) contract. AquaBot's KAT trial system (Known Achievable Tasks) is the reference implementation — each task type has a measured pass rate that becomes the agent's confidence for that capability.

**External platforms plug in here.** A Fiverr adapter registers as a participant with capabilities derived from Fiverr's service catalog. The adapter translates between AWP's capability model and Fiverr's categories, ratings, and pricing structures.

### Layer 3: Execution

**Purpose:** Decompose contracts into tasks, assign them, track progress, and manage handoffs between participants.

When a contract enters ACTIVE state, the Execution layer creates an **Execution Plan** — a tree of tasks:

```
Execution Plan
├── contract_id: reference to Contract
├── tasks: [
│   {
│     id, description, assigned_to,
│     status: pending | in_progress | blocked | complete | failed,
│     blocked_by: [task_ids],
│     handoff_policy: { trigger, escalation_path },
│     evidence: [deliverables, screenshots, confirmations]
│   }
│ ]
└── handoff_log: [HandoffRecord]
```

**The Handoff Protocol** is the most critical piece of this layer. Handoffs occur when work must move between participants — and handoff failures are the #1 cause of bad service experiences.

![Handoff Protocol](diagrams/handoff-protocol.svg)

Every handoff is triggered by one of five conditions:

| Trigger | Description | Example |
|---------|-------------|---------|
| **Capability boundary** | Current assignee can't do the next step | AI can't physically clean gutters |
| **Confidence drop** | Assignee's confidence falls below threshold (<60%) | AI unsure about next action, escalates to human |
| **Autonomy gate** | Next action exceeds the user's risk tolerance | $500 commitment needs approval in Facilitator mode |
| **Delegation request** | Participant explicitly delegates to another | Harold's grandson delegates scheduling to AI |
| **Platform boundary** | Work must happen on an external platform | Need to submit a request on Fiverr |

Every handoff produces a **Handoff Record**:

```
Handoff Record
├── from: participant_id
├── to: participant_id
├── reason: capability_boundary | confidence_drop | autonomy_gate | delegation | platform_boundary
├── context_transferred: { summary, full_history_ref, key_decisions }
├── context_lost: [what couldn't be transferred and why]
├── delegation_chain: [full chain from original requestor to current handler]
└── timestamp
```

**Why `context_lost` matters:** When Dorothy's gutter cleaning contract hands off from AI to the handyman, the handyman doesn't get access to Dorothy's full chat history — but the AI can provide a summary. The protocol explicitly tracks what was lost so that if Dorothy says "I already told the other person about the loose railing," the system knows what happened.

### Layer 4: Contract

**Purpose:** The protocol primitive. Formal terms between two parties with acceptance criteria, payment triggers, and a state machine lifecycle.

This is the **interop boundary** — the layer that gets standardized for the open protocol. External platforms, other agent frameworks, and third-party tools integrate at this layer.

A **Work Contract** contains:

```
Work Contract
├── id: unique identifier
├── outcome_id: reference to parent Outcome (Layer 5)
├── participants: {
│     buyer: identity_id,
│     provider: identity_id,
│     intermediaries: [identity_ids]  (AI agents acting on behalf of parties)
│   }
├── requirements: {
│     description: structured requirements (parsed from natural language),
│     acceptance_criteria: [measurable, verifiable conditions],
│     category, tags, constraints
│   }
├── terms: {
│     pricing: { model, amount, currency },
│     timeline: { start, deadline, milestones },
│     payment_trigger: on_acceptance | on_milestone | on_completion | on_verification,
│     escrow: boolean,
│     dispute_resolution: ai_mediated | human_mediated | platform_deferred
│   }
├── state: current state in the state machine
├── state_history: [{ state, timestamp, triggered_by, autonomy_gate_result }]
├── execution_plan_id: reference to Execution Plan (Layer 3)
└── verification: {
│     method: self_report | evidence_based | outcome_verified | platform_verified,
│     evidence: [deliverables],
│     result: pending | accepted | disputed
│   }
```

#### Contract State Machine

![Contract State Machine](diagrams/contract-state-machine.svg)

**States:**

| State | Description |
|-------|-------------|
| **INTENT** | Natural language expression of need. AI is parsing and clarifying. |
| **REQUIREMENTS** | Structured requirements extracted. Acceptance criteria defined. |
| **MATCHING** | Capability layer searching for candidates. |
| **PROPOSAL** | Candidates ranked, proposals presented. |
| **NEGOTIATION** | Terms being discussed/adjusted between parties. |
| **ACTIVE** | Terms accepted, work in progress. Execution plan created. |
| **VERIFICATION** | Work delivered, checking against acceptance criteria. |
| **COMPLETE** | Acceptance criteria met, payment triggered. |
| **DISPUTED** | Verification failed, dispute resolution in progress. |
| **CANCELLED** | Terminated before ACTIVE (by either party). |
| **EXPIRED** | Timed out (no match found, no response, deadline passed). |
| **FAILED** | Unrecoverable failure or unresolvable dispute. |

**Transition rules and autonomy gates:**

| Transition | Advisor | Facilitator | Agent | Delegate |
|-----------|---------|-------------|-------|----------|
| INTENT → REQUIREMENTS | Human reviews | Auto | Auto | Auto |
| REQUIREMENTS → MATCHING | Human confirms | Auto | Auto | Auto |
| MATCHING → PROPOSAL | Auto | Auto | Auto | Auto |
| PROPOSAL → NEGOTIATION | Auto | Auto | Auto | Auto |
| NEGOTIATION → ACTIVE | Human approves | Human approves | Auto (within bounds) | Auto (within risk limit) |
| ACTIVE → VERIFICATION | Auto | Auto | Auto | Auto |
| VERIFICATION → COMPLETE | Human confirms | Human confirms | Auto (low-value) | Auto |

**The key insight:** The state machine is identical regardless of participant types. Dorothy↔handyman, AquaBot↔Fiverr, agent↔agent — same states, same transitions, different autonomy gates. The gates are the only thing that changes based on who's involved and what their risk tolerance is.

### Layer 5: Outcome

**Purpose:** The human-facing abstraction. Goals that decompose into one or more contracts.

An **Outcome** is what users see and care about:

```
Outcome
├── id: unique identifier
├── owner: identity_id (the human whose goal this is)
├── description: natural language goal
├── contracts: [contract_ids]
├── status: active | paused | complete | abandoned
├── progress: { total_contracts, completed, in_progress, blocked }
└── satisfaction: user rating / feedback (post-completion)
```

**Outcomes are not contracts.** Dorothy's outcome is "get reliable home help." That's a goal, not a deliverable. The AI decomposes it into contracts (gutter cleaning, thermostat help, iPad tutoring) each of which has precise acceptance criteria and payment terms. Dorothy never sees the word "contract" — she sees progress toward her goal.

![Dorothy's Scenario](diagrams/dorothy-scenario.svg)

**Outcome orchestration** is where the AI agent earns its keep. It:
- Identifies implicit needs from conversation ("my husband always handled it" → home maintenance gap)
- Prioritizes contracts based on urgency and feasibility
- Manages dependencies between contracts (e.g., "fix the leak before repainting")
- Surfaces progress in language the user understands
- Adapts to the user's communication style and pace

---

## 3. Cross-Cutting Concerns

### 3.1 Autonomy Levels

Autonomy is the protocol's most distinctive feature. It's configured at the Identity layer (Layer 1) and enforced at every state transition in the Contract layer (Layer 4).

| Level | User Mental Model | Protocol Behavior |
|-------|-------------------|-------------------|
| **Advisor** | "Show me options, I'll decide everything" | AI suggests, human executes every action |
| **Facilitator** | "Help me do this, but ask before committing" | AI handles discovery and structuring, human approves commitments |
| **Agent** | "Do it for me, within these bounds" | AI commits within pre-authorized limits (budget, category, risk) |
| **Delegate** | "Handle it, just keep me posted" | AI manages end-to-end, human notified but not blocked |

**Risk-modified autonomy:** A high autonomy setting doesn't mean blanket approval. The effective approval threshold is:

```
approval_required = risk_score(action) > risk_tolerance(autonomy_level)
```

Where `risk_score` considers: monetary value, irreversibility, category sensitivity, participant trust levels, and historical dispute rates for similar contracts.

A $20 gutter cleaning at Delegate level auto-executes. A $5,000 kitchen renovation at the same level still requires confirmation. The investment fund analogy holds: even an aggressive fund doesn't put everything in one stock.

### 3.2 Performance Measurement & Verification

Three tiers of verification, selected per contract based on value and risk:

| Tier | Method | When Used | Example |
|------|--------|-----------|---------|
| **Self-report** | Provider claims completion | Low-risk, high-trust | Harold: "walked them through the diagnosis" |
| **Evidence-based** | Deliverables vs. acceptance criteria | Standard contracts | Copywriter submits draft, AI checks against brief |
| **Outcome-verified** | Measurable result confirmed | High-value, results-based | "3 quotes received" — AI literally checks inbox |

**Who verifies depends on context:**
- **AI verification** — Objective, measurable criteria
- **Human verification** — Subjective quality judgments
- **Community verification** — Reputation and vouching (Rosa's community trust model)
- **Platform verification** — External platform confirms completion

**Performance accumulates on Capability Cards** (Layer 2), feeding back into matching confidence scores. This creates a virtuous cycle: good work → higher confidence → better matches → more work.

### 3.3 Dispute Resolution

When VERIFICATION → COMPLETE fails:

1. Contract enters **DISPUTED** state
2. Evidence compiled: deliverables, acceptance criteria, communication history, handoff records
3. Resolution path scales with value:
   - **Low value (<$100):** AI mediates, proposes resolution (partial refund, redo, etc.)
   - **Medium value ($100–$1000):** Human mediator reviews evidence
   - **High value (>$1000):** Formal arbitration process
   - **External platform:** Defer to platform's dispute process (Fiverr, Upwork, etc.)
4. Outcome: COMPLETE (resolved) or FAILED (unresolvable)
5. Performance impact recorded on both parties' Capability Cards

### 3.4 Payment & Value Exchange

The protocol supports multiple payment models to accommodate different cultures, platforms, and user preferences:

**Payment triggers** (configured per contract):
- **On acceptance:** Upfront payment when terms are agreed
- **On milestone:** Escrow released at defined checkpoints
- **On completion:** Payment when all acceptance criteria verified
- **On verification:** Results-based — payment when measurable outcome confirmed

**Value exchange models:**
- **Fixed price:** Standard marketplace transaction
- **Hourly:** Time-tracked with agreed caps
- **Pay-what-you-want:** Bandcamp model for community-oriented providers like Rosa
- **Reciprocal:** Service exchange (future protocol extension)
- **Community credits:** Non-monetary reputation (future protocol extension)

**Platform fee:** ~5% transaction fee. The long-term vision: AWP becomes the work equivalent of Stripe's payment rails — an abstraction layer higher than payment, at the level of outcome delivery.

---

## 4. Participant Interaction Patterns

The protocol is participant-type-agnostic, but real-world usage falls into three primary patterns:

### 4.1 Human ↔ AI Agent (Dorothy's pattern)

The most common near-term pattern. A human expresses a goal, an AI agent manages contracts on their behalf.

- **Identity:** Human (buyer) + AI agent (intermediary) + Human (provider)
- **Autonomy:** Varies — Dorothy at Delegate, Alex at Facilitator
- **Handoffs:** AI↔human at capability boundaries (physical work, subjective judgment)
- **Key challenge:** Context transfer quality. The AI must represent the human's needs accurately to providers, including nuance ("Dorothy needs patience, not speed").

### 4.2 AI Agent ↔ AI Agent (Orchestration pattern)

An AI agent subcontracts work to another AI agent. Example: the orchestrator agent delegates web research to a specialized research agent.

- **Identity:** Agent (buyer) + Agent (provider), both with platform-verified trust
- **Autonomy:** Typically Agent or Delegate (agents don't need hand-holding)
- **Handoffs:** Rare — agents hand off at capability boundaries (one agent can't do what the other can)
- **Key challenge:** Cost and quality control. The protocol must prevent infinite agent-to-agent delegation chains and ensure the human's budget isn't consumed by inter-agent overhead.

### 4.3 AI Agent ↔ External Platform (Bridge pattern)

An AI agent acts on an external platform (Fiverr, Upwork) on behalf of a user. This is what AquaBot does today.

- **Identity:** AI agent (buyer, acting via delegation chain from human) + Platform (provider)
- **Autonomy:** Constrained by both the user's settings AND the platform's rules
- **Handoffs:** At platform boundaries — the adapter translates between AWP contracts and platform-native formats
- **Key challenge:** Platform adapter fidelity. Fiverr's "order" maps to an AWP contract, but not perfectly. The adapter must preserve intent while respecting platform constraints.

---

## 5. Phasing

### Phase 1: Pitch (Current)
- Protocol narrative and layer model
- Decision records (ADRs) capturing design rationale
- Persona-grounded scenarios showing the protocol in action
- Diagrams and visual materials for investor presentation

### Phase 2: Build
- Contract state machine implementation on existing Firestore/backend
- Integration with AquaBot's task execution model
- Capability Card system built on existing expert/listing infrastructure
- Autonomy level configuration in user profiles
- Handoff protocol implementation in the execution layer

### Phase 3: Open
- Formal specification of each layer (RFC-style)
- Contract Layer SDK for third-party integration
- Platform adapter framework (Fiverr, Upwork, etc.)
- Reference implementation and test suite
- Community governance model for protocol evolution

---

## 6. Relationship to Existing Aquarius Infrastructure

AWP doesn't replace what exists — it formalizes and unifies it.

| AWP Concept | Existing Infrastructure | Evolution Path |
|-------------|------------------------|----------------|
| Outcome | Feed items + buyer requests | Outcomes orchestrate multiple contracts from a single user goal |
| Contract | Listings + orchestrator requests | Contracts add lifecycle, acceptance criteria, payment triggers |
| Execution | AquaBot task runner | Execution plans formalize task decomposition and handoffs |
| Capability | Expert profiles + KAT pass rates | Capability Cards unify human skills and agent capabilities |
| Identity | Firebase Auth + AquaBot assignments | Identity Records add autonomy settings and delegation chains |
| Matching | Connection match agent | Matching consults Capability Cards with confidence scores |
| Verification | KAT judge system | Verification tiers formalize how completion is confirmed |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **AWP** | Aquarius Work Protocol |
| **Outcome** | A human-facing goal that decomposes into one or more contracts |
| **Work Contract** | The protocol primitive — formal terms between two participants |
| **Capability Card** | A participant's registered skills, confidence, and constraints |
| **Identity Record** | Who/what a participant is, including trust and autonomy settings |
| **Execution Plan** | A tree of tasks implementing an active contract |
| **Handoff Record** | Documentation of work transfer between participants |
| **Autonomy Level** | User-configured setting controlling how much the AI can do independently |
| **Confidence Score** | 0–1 measure of how likely a participant is to successfully complete a capability |
| **Delegation Chain** | The sequence of authorizations from the original human to the current actor |

## Appendix B: Decision Records

All architectural decisions are documented as ADRs in [`docs/decisions/`](../decisions/):

1. [Why a Work Protocol?](../decisions/001-why-a-work-protocol.md)
2. [Contract-Centric with Outcome Layer](../decisions/002-contract-centric-with-outcome-layer.md)
3. [Autonomy Levels as Risk Profiles](../decisions/003-autonomy-levels-as-risk-profiles.md)
4. [Hybrid Architecture: Layered Model + State Machine](../decisions/004-hybrid-architecture-layered-model-state-machine.md)
5. [Payment and Value Exchange](../decisions/005-payment-and-value-exchange.md)
