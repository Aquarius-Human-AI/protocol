# Aquarius — Programmable Labor Network (PLN)

> The scoping, decomposition, coordination, trust, and routing layer for the human + AI services economy.

## What Is This?

PLN is a protocol for defining, matching, executing, and verifying work between humans, AI agents, and external platforms. It formalizes how messy intent becomes accountable execution — the foundational layer that makes Aquarius infrastructure, not just an app.

## Current Status

**Phase 1 (Pitch):** Complete — protocol design, TypeScript library, layer specs, investor materials, persona scenarios.

The protocol serves three audiences:

1. **Investors** — Protocol narrative positioning Aquarius as the coordination layer for service commerce
2. **Engineers** — Layer implementation specs mapping to our backend architecture
3. **Ecosystem** — Open standard that external platforms can adopt

## Documentation

### Investor Materials

| Document | Description |
|----------|-------------|
| [PLN Investor Memo](pln-memo.md) | Full narrative — market thesis, product, evidence, competitive positioning, risks |
| [PLN in 5 Minutes](narrative/pln-in-5-minutes.md) | Concise non-technical overview for investor conversations |

### Layer Specs (Implementation)

| Spec | Layer | Status |
|------|-------|--------|
| [Layer A](specs/SPEC-LAYER-A.md) | Outcome Schema & Work Contract | Approved |
| [Layer B](specs/SPEC-LAYER-B.md) | Task Decomposition Engine | Approved |
| [Layer C](specs/SPEC-LAYER-C.md) | Capability & Routing Index | Approved |
| [Layer D](specs/SPEC-LAYER-D.md) | Execution, Evaluation & Handoff | Approved |
| [Layer E](specs/SPEC-LAYER-E.md) | Trust & Reputation | Approved |
| [Layer F](specs/SPEC-LAYER-F.md) | Buyer & Worker Control Surface | Approved |
| [Governance](specs/SPEC-LAYER-Governance.md) | Cross-Cutting Policy & Transition Control | Approved |
| [Deferred](specs/DEFERRED.md) | Items deferred to v2+ | Reference |
| [PLN Technical Overview](specs/ple_technical_spec.md) | Minimum viable architecture overview | Reference |

### Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [001](decisions/001-why-a-work-protocol.md) | Why a Programmable Labor Network? | Accepted |
| [002](decisions/002-contract-centric-with-outcome-layer.md) | Contract-Centric with Outcome Layer | Accepted |
| [003](decisions/003-autonomy-levels-as-risk-profiles.md) | Autonomy Levels as Risk Profiles | Accepted |
| [004](decisions/004-hybrid-architecture-layered-model-state-machine.md) | Six-Layer Architecture + Governance | Accepted |
| [005](decisions/005-payment-and-value-exchange.md) | Payment and Value Exchange | Accepted |
| [006](decisions/006-worker-discovery-and-labor-graph-construction.md) | Worker Discovery and Labor Graph Construction | Accepted |
| [007](decisions/007-reputation-architecture.md) | Reputation Architecture | Accepted |

### Diagrams

Visual references for the protocol (SVG, embedded in specs):

| Diagram | Shows |
|---------|-------|
| [Layer Model](specs/diagrams/layer-model.svg) | Six-layer architecture with autonomy cross-cut |
| [Contract State Machine](specs/diagrams/contract-state-machine.svg) | Contract lifecycle and autonomy gates |
| [Handoff Protocol](specs/diagrams/handoff-protocol.svg) | Handoff triggers, records, and delegation chains |
| [Dorothy Scenario](specs/diagrams/dorothy-scenario.svg) | Real-world scenario showing outcome → contracts |

### Persona Scenarios

Real-world protocol walkthroughs grounded in diverse user personas:

| Scenario | Persona | Taxonomy | Key Features |
|----------|---------|----------|-------------|
| [Dorothy's Home Help](scenarios/dorothy-home-help.md) | 71, rural WI, Delegate | Outcome Owner | Multi-contract, full AI delegation |
| [Ahmed's Business Taxes](scenarios/ahmed-business-taxes.md) | 44, Minneapolis, Facilitator | Outcome Owner | ESL, cultural trust signals |
| [Alex's Upwork Migration](scenarios/alex-upwork-migration.md) | 32, Austin, Facilitator | Capacity Operator | Provider-side, reputation bootstrap |
| [Rosa's Community Exchange](scenarios/rosa-community-exchange.md) | 34, South Bronx, Agent | Both | Both sides, non-monetary |
| [Harold's Car Diagnosis](scenarios/harold-car-diagnosis.md) | 70, rural AR, Delegate | Capacity Operator | 3-level delegation chain |

### TypeScript Library

```bash
npm install && npm test
```

- `src/types/` — Type definitions for all protocol entities
- `src/schemas/` — JSON Schema definitions with validators (ajv)
- `src/state-machine/` — Contract state machine with autonomy gates
- `tests/` — Transition, autonomy, schema, and persona scenario tests

### Roadmap

| Document | Description |
|----------|-------------|
| [ROADMAP.md](ROADMAP.md) | Phase 2 breakdown, sequencing, milestones, open questions |

### Archive

Historical docs (completed investigations, superseded plans) go to `archive/` with date prefixes.
