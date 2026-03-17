# AWP Roadmap

> From protocol spec to operating system for agent-powered services.

---

## Where We Are

**Phase 1 (Pitch) is complete.** The protocol repo contains:

- Design specification covering all 5 layers, contract state machine, autonomy gates
- TypeScript library with types, JSON schemas, and state machine (59 tests)
- 5 persona scenario walkthroughs grounded in real user archetypes
- Investor narrative ("AWP in 5 Minutes")
- 5 Architecture Decision Records capturing every design choice

**What we can do today:** Walk an investor through the protocol with concrete, persona-grounded examples and show them working code that validates the design.

**What we can't do yet:** Run a real contract through the system. The protocol exists as a spec and library — it's not integrated into the Aquarius backend or frontend.

---

## The Three Phases

```
PHASE 1: PITCH          PHASE 2: BUILD              PHASE 3: OPEN
(complete)               (next)                      (future)

Protocol spec            Firestore integration       RFC-style specs
TypeScript library       Backend API endpoints       Contract Layer SDK
Persona scenarios        Frontend contract UI        Platform adapter framework
Investor narrative       AquaBot execution bridge    Reference implementation
ADRs                     Autonomy settings UX        Community governance
                         Matching engine upgrade
                         Payment integration
```

---

## Phase 2: Build

**Goal:** Make the protocol real. Integrate AWP into the existing Aquarius stack so contracts actually flow through the system.

### 2.1 Foundation — Protocol Infrastructure in Backend

**What:** Add AWP data models to Firestore, create API endpoints for contract lifecycle.

| Deliverable | Repo | Description |
|------------|------|-------------|
| Firestore collections | Backend | `outcomes`, `contracts`, `capability_cards`, `execution_plans`, `handoff_records` |
| Contract API | Backend | CRUD + state transitions for Work Contracts (`POST /v1/contracts`, `PATCH /v1/contracts/:id/transition`) |
| Outcome API | Backend | Create outcomes, list contracts within outcome, track progress |
| Identity extension | Backend | Add `autonomy_setting` and `risk_profile` to existing user model |
| Capability Card API | Backend | Create/update cards, query by skill/location/availability |

**Depends on:** Nothing — this is the foundation.

**Maps to existing infra:**
- `contracts` collection extends the existing `listings` + `orchestrator_requests` pattern
- `capability_cards` extends `experts` collection
- Identity fields add to existing Firebase Auth user records

### 2.2 Autonomy & Risk — The Decision Engine

**What:** Implement the risk scoring and autonomy gate logic as a backend service that the contract API consults before advancing state.

| Deliverable | Repo | Description |
|------------|------|-------------|
| Risk scoring service | Backend | `risk_score(action)` considering value, irreversibility, category, trust, history |
| Autonomy gate middleware | Backend | Intercepts contract transitions, evaluates against user's autonomy level + risk profile |
| Approval flow | Backend + Frontend | When a gate blocks: notification, approval UI, timeout/expiry logic |
| Risk profile settings | Frontend | UI for users to configure their autonomy level (advisor/facilitator/agent/delegate) |

**Depends on:** 2.1 (contract API exists to gate).

**Key ADR needed:** ADR-006 — Risk Scoring Algorithm (weights, combination function, threshold calibration).

### 2.3 Matching — Capability-Aware Search

**What:** Upgrade the existing connection matching to use Capability Cards with confidence scores and uncertainty flags.

| Deliverable | Repo | Description |
|------------|------|-------------|
| Matching interface | Backend | Implement the MatchingRequest/MatchingResponse contract from the spec |
| Capability Card indexing | Backend | Vertex AI embeddings for semantic skill matching (extends existing expert embeddings) |
| Confidence scoring | Backend | Compute confidence from performance history, adjust on contract completion |
| Uncertainty surfacing | Backend + Frontend | Show uncertainty flags to users ("limited availability", "new to platform") |
| Cultural/preference matching | Backend | Factor in communication style, language, trust signals (Ahmed's Somali community match) |

**Depends on:** 2.1 (capability cards exist) + existing connection_match agent.

### 2.4 Execution — AquaBot Bridge

**What:** Connect the contract execution layer to AquaBot's task runner so AI agents can execute contract tasks.

| Deliverable | Repo | Description |
|------------|------|-------------|
| Contract → Task mapping | AquaBot | When a contract enters ACTIVE, create an Execution Plan and map tasks to AquaBot task runner |
| Handoff protocol | AquaBot + Backend | Implement HandoffRecord creation when AquaBot hits capability/confidence/platform boundaries |
| KAT → Capability Card | AquaBot | Map existing KAT pass rates to Capability Card confidence scores |
| Delegation chain tracking | AquaBot | Track and surface the full delegation chain (human → agent → platform) |

**Depends on:** 2.1 (contracts exist) + existing AquaBot task infrastructure.

### 2.5 Frontend — User Experience

**What:** Build the user-facing contract experience. Users should never see "contracts" — they see outcomes and progress.

| Deliverable | Repo | Description |
|------------|------|-------------|
| Outcome view | Frontend | Dashboard showing user's active outcomes with contract progress |
| Contract flow UI | Frontend | Guided flow from intent → requirements → matching → proposal → active |
| Autonomy settings | Frontend | Risk profile configuration (the "investment fund" UI) |
| Verification UI | Frontend | Confirm completion, submit evidence, dispute flow |
| Provider dashboard | Frontend | For providers: incoming proposals, active contracts, performance stats |
| Handoff transparency | Frontend | Show users when/why work moved between participants |

**Depends on:** 2.1 (API exists), 2.2 (autonomy gates), 2.3 (matching).

### 2.6 Payment — Value Exchange

**What:** Integrate payment processing with contract lifecycle.

| Deliverable | Repo | Description |
|------------|------|-------------|
| Payment trigger hooks | Backend | Fire payment events on contract state transitions (on_completion, on_milestone, etc.) |
| Escrow model | Backend | Hold funds during ACTIVE, release on VERIFICATION → COMPLETE |
| Stripe integration | Backend | Process payments via Stripe Connect (marketplace model, 5% platform fee) |
| Pay-what-you-want | Backend + Frontend | Support $0 and flexible pricing (Rosa's community model) |
| Payment UI | Frontend | Payment method setup, transaction history, earnings dashboard |

**Depends on:** 2.1 (contracts with payment terms), 2.5 (frontend exists).

### Phase 2 Sequencing

```
Month 1-2:  [2.1 Foundation]──────────────────────────────►
Month 2-3:  ·················[2.2 Autonomy]────────────────►
Month 2-3:  ·················[2.3 Matching]────────────────►
Month 3-4:  ·····························[2.4 AquaBot]─────►
Month 3-5:  ·····························[2.5 Frontend]────►
Month 4-5:  ·········································[2.6]─►
```

2.1 is the critical path. 2.2 and 2.3 can run in parallel after 2.1. 2.4 and 2.5 can start once 2.1 is stable. 2.6 is last because it requires the most cross-cutting integration.

---

## Phase 3: Open

**Goal:** Make AWP an adoptable standard. Other agent frameworks and platforms can implement the protocol.

### 3.1 Formal Specification

| Deliverable | Description |
|------------|-------------|
| RFC-style layer specs | One document per layer with formal interface definitions |
| Contract schema registry | Versioned JSON Schemas published to a public endpoint |
| Protocol versioning | Semantic versioning for the protocol itself (breaking vs. non-breaking changes) |
| Conformance test suite | Tests that any implementation can run to verify AWP compliance |

### 3.2 SDKs & Adapters

| Deliverable | Description |
|------------|-------------|
| TypeScript SDK | `@aquarius/awp-sdk` — create contracts, advance states, validate schemas |
| Python SDK | For backend/ML integrations |
| Platform adapter framework | Base adapter class + reference implementations for Fiverr, Upwork |
| Webhook integration | Event-driven notifications for external systems |

### 3.3 Ecosystem

| Deliverable | Description |
|------------|-------------|
| Developer documentation | Getting started, tutorials, API reference |
| Community governance | RFC process for protocol changes, working groups |
| Reference implementation | Open-source implementation of the full stack |
| Partner program | Onboard external platforms as AWP-compatible providers |

---

## Key Milestones

| Milestone | Phase | Signal |
|-----------|-------|--------|
| First investor conversation using AWP materials | 1 | **Done** — materials ready |
| First real contract flows through the system | 2.1 | Protocol is integrated, not just specified |
| First AI-managed outcome completes end-to-end | 2.4 | AquaBot executes contract tasks autonomously |
| First payment processed through AWP | 2.6 | Revenue model validated |
| First external platform adapter (Fiverr/Upwork) | 3.2 | Protocol works beyond Aquarius |
| First third-party AWP implementation | 3.3 | Network effects begin |

---

## Open Questions

These need answers before or during Phase 2:

| Question | Phase | Impact |
|----------|-------|--------|
| How does the risk scoring algorithm weight its dimensions? | 2.2 | ADR-006 needed. Determines how aggressive/conservative autonomy feels. |
| How do we bootstrap confidence for new participants? | 2.3 | Cold start problem. Options: verified credentials, trial period, community vouching. |
| How do we handle partial matches? (only 60% of requirements met) | 2.3 | Common in practice. Does the protocol surface this or filter it out? |
| What's the minimum viable payment integration? | 2.6 | Can we start with Stripe invoicing and add escrow later? |
| How do we handle multi-currency contracts? | 2.6 | Ahmed in USD, Alex's UK client in GBP — same protocol, different currencies. |
| How does the protocol handle ongoing/recurring contracts? | 2.1 | Dorothy's "reliable home help" implies repeat work, not one-off. Need a subscription/retainer model? |
| What's the privacy model for delegation chains? | 2.4 | How much of the chain does each participant see? Harold's buyer sees "managed by AI" but not grandson's name? |
| How do we measure protocol health? | 2.1 | Metrics: avg time in each state, completion rates, dispute rates, handoff success rates. |

---

## What's Not on This Roadmap

- **Mobile app** — Frontend is mobile-first web; native apps are a future consideration
- **Offline/async contracts** — V1 assumes participants are online; async (email-based) contracts are Phase 3
- **Multi-party contracts** — V1 is buyer↔provider; group/marketplace contracts (multiple providers bidding) are Phase 3
- **AI-to-AI negotiation** — V1 supports it but doesn't optimize for it; agent negotiation strategies are Phase 3
- **Legal compliance** — GDPR, accessibility (WCAG), and jurisdiction-specific requirements are Phase 3 concerns scoped in the spec's Privacy section

---

## How to Use This Roadmap

**If you're pitching investors:** Phase 1 is done. Point them to [AWP in 5 Minutes](narrative/awp-in-5-minutes.md), the [persona scenarios](scenarios/), and this roadmap for the full vision.

**If you're planning a sprint:** Phase 2.1 is the starting point. The [implementation plan](superpowers/plans/2026-03-16-awp-implementation.md) covers the protocol repo; separate plans will be needed for backend/frontend/AquaBot integration.

**If you're joining the team:** Start with the [design spec](specs/2026-03-16-awp-protocol-design.md) and [decision records](decisions/). Then read Dorothy's scenario to see the protocol in action.
