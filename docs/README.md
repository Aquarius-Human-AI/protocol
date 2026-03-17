# Aquarius Work Protocol (AWP)

> The operating system for agent-powered services.

## What Is This?

AWP is a protocol for defining, matching, executing, and verifying work between humans, AI agents, and external platforms. It's the foundational layer that makes Aquarius a platform, not just an app.

## Current Status

**Phase 1 (Pitch):** Complete — design spec, TypeScript library, investor materials, persona scenarios.

The protocol serves three audiences:

1. **Investors** — Protocol narrative that positions Aquarius as infrastructure
2. **Engineers** — Technical spec that maps to our existing backend/AquaBot architecture
3. **Ecosystem** — Open standard that external platforms can adopt

## Documentation

### Decision Records

| ADR | Title | Status |
|-----|-------|--------|
| [001](decisions/001-why-a-work-protocol.md) | Why a Work Protocol? | Accepted |
| [002](decisions/002-contract-centric-with-outcome-layer.md) | Contract-Centric with Outcome Layer | Accepted |
| [003](decisions/003-autonomy-levels-as-risk-profiles.md) | Autonomy Levels as Risk Profiles | Accepted |
| [004](decisions/004-hybrid-architecture-layered-model-state-machine.md) | Hybrid Architecture: Layered Model + State Machine | Accepted |
| [005](decisions/005-payment-and-value-exchange.md) | Payment and Value Exchange | Accepted |

### Specs

| Spec | Description | Status |
|------|-------------|--------|
| [AWP Protocol Design](specs/2026-03-16-awp-protocol-design.md) | Full protocol design — layers, state machine, capabilities, handoffs, verification | Draft v0.1.0 |

### Diagrams

Visual references for the protocol (SVG, embedded in spec):

| Diagram | Shows |
|---------|-------|
| [Layer Model](specs/diagrams/layer-model.svg) | Five-layer architecture with autonomy cross-cut |
| [Contract State Machine](specs/diagrams/contract-state-machine.svg) | Contract lifecycle and autonomy gates |
| [Handoff Protocol](specs/diagrams/handoff-protocol.svg) | Handoff triggers, records, and delegation chains |
| [Dorothy Scenario](specs/diagrams/dorothy-scenario.svg) | Real-world scenario showing outcome → contracts |

### Investor Materials

| Document | Description |
|----------|-------------|
| [AWP in 5 Minutes](narrative/awp-in-5-minutes.md) | Non-technical overview for investor conversations |

### Persona Scenarios

Real-world protocol walkthroughs grounded in diverse user personas:

| Scenario | Persona | Key Features |
|----------|---------|-------------|
| [Dorothy's Home Help](scenarios/dorothy-home-help.md) | 71, rural WI, Delegate | Multi-contract, full AI delegation |
| [Ahmed's Business Taxes](scenarios/ahmed-business-taxes.md) | 44, Minneapolis, Facilitator | ESL, cultural trust signals |
| [Alex's Upwork Migration](scenarios/alex-upwork-migration.md) | 32, Austin, Facilitator | Provider-side, reputation bootstrap |
| [Rosa's Community Exchange](scenarios/rosa-community-exchange.md) | 34, South Bronx, Agent | Both sides, non-monetary |
| [Harold's Car Diagnosis](scenarios/harold-car-diagnosis.md) | 70, rural AR, Delegate | 3-level delegation chain |

### TypeScript Library

```bash
npm install && npm test  # 59 tests
```

- `src/types/` — Type definitions for all protocol entities
- `src/schemas/` — JSON Schema definitions with validators (ajv)
- `src/state-machine/` — Contract state machine with autonomy gates
- `tests/` — Transition, autonomy, schema, and persona scenario tests

### Archive

Historical docs (completed investigations, superseded plans) go to `archive/` with date prefixes.
