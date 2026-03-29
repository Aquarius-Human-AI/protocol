# PLN Roadmap

> From protocol spec to the coordination layer for the human + AI services economy.

---

## Where We Are

**Phase 1 (Pitch) is complete.** The protocol repo contains:

- Six-layer architecture + governance, with implementation specs per layer
- Seven ADRs capturing every design choice
- TypeScript library with types, JSON schemas, and state machine
- Seven building blocks defined: Work Contract, Autonomy Gates, Hybrid Reputation Unit, Per-Task Matching, Demand-Driven Supply Discovery, Provenance Graph, Handoff Protocol
- Persona scenario walkthroughs grounded in the user taxonomy
- Investor memo and narrative overview
- Deferred items log for v2+

**What we can do today:** Walk an investor through the protocol with concrete, persona-grounded examples and show them working code that validates the design.

**What we can't do yet:** Run a real contract through the system. The protocol exists as a spec and library — it's not integrated into the Aquarius backend or frontend.

---

## The Three Phases

```
PHASE 1: PITCH          PHASE 2: BUILD              PHASE 3: OPEN
(complete)               (next)                      (future)

Protocol spec            Layer A-F implementation     RFC-style specs
Layer specs              Governance integration       Contract Layer SDK
TypeScript library       Bayesian reputation engine   Platform adapter framework
Persona scenarios        Demand-driven discovery      Reference implementation
Investor memo            Buyer/worker control surface Community governance
ADRs                     Payment integration
Deferred items log       Agent subscription tiers
```

---

## Wedge Product

We start in **design, consulting, coaching, and event planning** — categories where buyers have intent but not specs, outcomes are verifiable, and the scoping gap is widest. These are categories where orchestration matters more than search and where the coordination burden is a large part of the pain.

---

## Phase 2: Build

**Goal:** Make the protocol real. Implement PLN layers on the existing Aquarius stack so contracts actually flow through the system.

### 2.1 Foundation — Layer A: Outcome Schema & Work Contract

**What:** Implement the outcome schema, work contract state machine, and intake agent for scoping intent into structured specs.

| Deliverable | Description |
|------------|-------------|
| Work Contract data model | Contract with acceptance criteria, SLA, pricing, state machine |
| Intake agent | Conversational scoping that turns messy intent into structured work orders |
| Contract API | CRUD + state transitions (`POST /v1/contracts`, `PATCH /v1/contracts/:id/transition`) |
| Outcome API | Create outcomes, list contracts within outcome, track progress |
| Identity extension | Add autonomy_setting, risk_profile, delegation_chain to user model |

**Depends on:** Nothing — this is the foundation.

### 2.2 Governance — Cross-Cutting Policy Engine

**What:** Implement the governance layer as a synchronous gate for all contract state transitions.

| Deliverable | Description |
|------------|-------------|
| Transition validation | Legal state transitions, state consistency checks |
| Autonomy gate engine | Risk scoring considering value, irreversibility, category, trust |
| Policy engine | Rate limits, budget ceilings, restricted categories, delegation validation |
| Expiration/confidence monitors | Async monitors for stale contracts and confidence drops |
| Approval flow | Notification + approval UI when gates block |

**Depends on:** 2.1 (contract API exists to gate).

### 2.3 Layer B & C — Decomposition + Matching

**What:** Task decomposition engine and capability/routing index for per-task matching.

| Deliverable | Description |
|------------|-------------|
| Planner agent | DAG generation from outcomes with dependency tracking |
| Capability Card indexing | Vector embeddings for semantic skill matching |
| Per-task matching | Independent routing of each task node to optimal worker |
| Demand-driven discovery | Web crawling triggered by buyer demand for worker profiles |
| Confidence scoring | Compute confidence from performance history |
| Cultural/preference matching | Language, communication style, community trust signals |

**Depends on:** 2.1 (outcomes and contracts exist), 2.2 (governance gates transitions).

### 2.4 Layer D — Execution, Evaluation & Handoff

**What:** Runtime that performs work, manages handoffs, and evaluates outputs.

| Deliverable | Description |
|------------|-------------|
| DAG orchestrator | Walk execution plan, start tasks when dependencies resolve |
| Handoff protocol | Context preservation across worker transitions |
| Evaluator agent | Separate model for quality scoring against acceptance criteria |
| Retry cascade | Same worker → next-best → replan |
| Progress tracking | SSE endpoint per contract with weighted progress |
| Human task management | Dispatch via notification, collect completion + evidence |

**Depends on:** 2.1, 2.3 (contracts, plans, and matches exist).

### 2.5 Layer E — Trust & Reputation

**What:** Bayesian reputation scoring, provenance graph, and audit trail.

| Deliverable | Description |
|------------|-------------|
| Bayesian scoring engine | Beta distributions for rates, Normal for continuous, 6 dimensions per skill |
| Hybrid Reputation Unit | Per-worker, per-skill, per-task-type scoring with confidence bands |
| External review ingestion | Cross-source identity resolution from Layer C crawler |
| Provenance graph | Cryptographically chained audit trail per contract |
| Anti-gaming detection | LLM-based anomaly detection on score trajectories |
| Feedback loop | Async write-back to Layer C with full scores |

**Depends on:** 2.4 (completed work produces reputation data).

### 2.6 Layer F — Buyer & Worker Control Surface

**What:** Unified web app for visibility, approval gates, and intervention.

| Deliverable | Description |
|------------|-------------|
| Conversational intake | Chat UI for Layer A scoping |
| Three-tier execution view | Roadmap → DAG → Detail drill-down |
| Approval checkpoints | After decomposition, milestones, before delivery |
| Override/redirect | Reject, reassign, modify plan, abort |
| Worker dashboard | Incoming tasks, performance stats, reputation scores |
| Event-driven notifications | Milestones, quality issues, SLA risk, approval gates, completion |

**Depends on:** 2.1-2.5 (all backend layers).

### 2.7 Payment — Value Exchange

**What:** Integrate payment processing with contract lifecycle and subscription tiers.

| Deliverable | Description |
|------------|-------------|
| Payment trigger hooks | Fire payment events on contract state transitions |
| Escrow model | Hold funds during ACTIVE, release on VERIFICATION → COMPLETE |
| Stripe integration | Marketplace model, 5-20% platform take rate |
| Subscription tiers | $20/mo (40 agents), $200/mo (400 agents), $1,000/mo (4,000 agents) |
| Pay-as-you-go | $0.80 per agent for non-subscribers |
| Pay-what-you-want | Support $0 and flexible pricing (community exchange model) |

**Depends on:** 2.1 (contracts with payment terms), 2.6 (frontend exists).

### Phase 2 Sequencing

```
Month 1-2:  [2.1 Layer A Foundation]──────────────────────────►
Month 1-2:  [2.2 Governance]──────────────────────────────────►
Month 2-3:  ·················[2.3 Layers B+C]─────────────────►
Month 3-4:  ·····························[2.4 Layer D]────────►
Month 3-5:  ·····························[2.5 Layer E]────────►
Month 4-6:  ·········································[2.6 F]──►
Month 5-6:  ·············································[2.7]►
```

2.1 and 2.2 are the critical path and can start in parallel. 2.3 follows once the foundation is stable. 2.4 and 2.5 can overlap. 2.6 and 2.7 are last because they require all backend layers.

---

## Phase 3: Open

**Goal:** Make PLN an adoptable standard. Other agent frameworks and platforms can implement the protocol.

### 3.1 Formal Specification

| Deliverable | Description |
|------------|-------------|
| RFC-style layer specs | One document per layer with formal interface definitions |
| Contract schema registry | Versioned JSON Schemas published to a public endpoint |
| Protocol versioning | Semantic versioning for the protocol itself |
| Conformance test suite | Tests that any implementation can run to verify PLN compliance |

### 3.2 SDKs & Adapters

| Deliverable | Description |
|------------|-------------|
| TypeScript SDK | `@aquarius/pln-sdk` — create contracts, advance states, validate schemas |
| Python SDK | For backend/ML integrations |
| Platform adapter framework | Base adapter class + reference implementations for Fiverr, Upwork |
| Webhook integration | Event-driven notifications for external systems |

### 3.3 Ecosystem

| Deliverable | Description |
|------------|-------------|
| Developer documentation | Getting started, tutorials, API reference |
| Community governance | RFC process for protocol changes, working groups |
| Reference implementation | Open-source implementation of the full stack |
| Partner program | Onboard external platforms as PLN-compatible providers |

---

## Key Milestones

| Milestone | Phase | Signal |
|-----------|-------|--------|
| Investor conversations using PLN materials | 1 | **Done** — materials ready |
| First real contract flows through the system | 2.1 | Protocol is integrated, not just specified |
| First AI-managed outcome completes end-to-end | 2.4 | Orchestrator executes contract tasks autonomously |
| First payment processed through PLN | 2.7 | Revenue model validated |
| First external platform adapter | 3.2 | Protocol works beyond Aquarius |
| First third-party PLN implementation | 3.3 | Network effects begin |

---

## Open Questions

These need answers before or during Phase 2:

| Question | Phase | Impact |
|----------|-------|--------|
| How do we bootstrap confidence for new participants? | 2.3 | Cold start. Options: verified credentials, trial period, community vouching. |
| How do we handle partial matches? (only 60% of requirements met) | 2.3 | Common in practice. Surface or filter? |
| What's the minimum viable payment integration? | 2.7 | Start with Stripe invoicing and add escrow later? |
| How do we handle multi-currency contracts? | 2.7 | USD only in v1 (deferred). |
| How does the protocol handle ongoing/recurring contracts? | 2.1 | Repeat work needs subscription/retainer model? |
| What's the privacy model for delegation chains? | 2.4 | How much of the chain does each participant see? |
| How do we measure protocol health? | 2.1 | Metrics: avg time in each state, completion rates, dispute rates, handoff success. |

---

## What's Not on This Roadmap

- **Native mobile apps** — Mobile-responsive web in v1; native apps deferred (F5)
- **SMS/email notifications** — In-app only in v1; external channels deferred (F1)
- **Admin/operator tooling** — Deferred (F2)
- **Worker marketplace/task browsing** — Deferred (F4)
- **Global DAG optimization** — Per-task matching in v1; simultaneous assignment deferred (C1)
- **Multi-currency** — USD only in v1 (A4)
- **Automated QA checks** — Buyer QA in v1; plagiarism/factual checks deferred (E1)

See [DEFERRED.md](specs/DEFERRED.md) for the complete deferral log.

---

## How to Use This Roadmap

**If you're pitching investors:** Phase 1 is done. Point them to the [PLN Investor Memo](pln-memo.md), [PLN in 5 Minutes](narrative/pln-in-5-minutes.md), the [persona scenarios](scenarios/), and this roadmap.

**If you're planning a sprint:** Phase 2.1 is the starting point. Start with [Layer A spec](specs/SPEC-LAYER-A.md) and [Governance spec](specs/SPEC-LAYER-Governance.md).

**If you're joining the team:** Start with the [layer specs](specs/) and [decision records](decisions/). Then read Dorothy's scenario to see the protocol in action.
