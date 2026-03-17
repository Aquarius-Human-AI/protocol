# Aquarius Work Protocol (AWP)

> The operating system for agent-powered services.

A protocol for defining, matching, executing, and verifying work between humans, AI agents, and external platforms.

## Overview

AWP is the foundational protocol that powers the [Aquarius](https://peopleaquarius.com) marketplace. It formalizes how work gets done when any combination of humans and AI agents collaborate:

- **Humans ↔ AI agents** — "I need my gutters cleaned" becomes a managed outcome
- **AI agents ↔ AI agents** — Orchestration of complex multi-step work
- **AI agents ↔ External platforms** — Bridging to Fiverr, Upwork, and other services

## Core Concepts

- **Outcomes** — Human-facing goals that decompose into one or more contracts
- **Work Contracts** — The protocol primitive: inputs, outputs, acceptance criteria, payment terms
- **Autonomy Levels** — User-configurable dial from Advisor to Delegate
- **5-Layer Architecture** — Identity, Capability, Execution, Contract, Outcome

## Quick Start

```bash
npm install
npm test        # 59 tests — state machine, autonomy gates, schemas, persona scenarios
npm run build   # TypeScript compilation
```

## For Investors

Start with [AWP in 5 Minutes](docs/narrative/awp-in-5-minutes.md) — a non-technical overview of what AWP is, why it matters, and how it works.

## For Engineers

Start with the [Design Specification](docs/specs/2026-03-16-awp-protocol-design.md) — the full technical protocol covering all 5 layers, the contract state machine, capability matching, handoff protocol, and verification.

## Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [AWP in 5 Minutes](docs/narrative/awp-in-5-minutes.md) | Investors | Non-technical protocol overview |
| [Design Spec](docs/specs/2026-03-16-awp-protocol-design.md) | Engineers | Full protocol specification |
| [Decision Records](docs/decisions/) | Both | Why we made each architectural choice |
| [Persona Scenarios](docs/scenarios/) | Both | 5 real-world protocol walkthroughs |
| [Full docs index](docs/README.md) | Both | Complete documentation navigation |

## Persona Scenarios

Real people, real outcomes — protocol walkthroughs grounded in diverse user personas:

| Persona | Age | Role | Key Protocol Features |
|---------|-----|------|----------------------|
| [Dorothy H.](docs/scenarios/dorothy-home-help.md) | 71 | Buyer (Delegate) | Multi-contract outcome, full AI delegation |
| [Ahmed F.](docs/scenarios/ahmed-business-taxes.md) | 44 | Buyer (Facilitator) | ESL matching, cultural trust signals |
| [Alex C.](docs/scenarios/alex-upwork-migration.md) | 32 | Provider (Facilitator) | Reputation portability, fee transparency |
| [Rosa M.](docs/scenarios/rosa-community-exchange.md) | 34 | Both (Agent) | Non-monetary value, community exchange |
| [Harold B.](docs/scenarios/harold-car-diagnosis.md) | 70 | Provider (Delegate) | 3-level delegation chain, family-assisted |

## Project Structure

```
├── docs/
│   ├── decisions/          # Architecture Decision Records (ADRs)
│   ├── specs/              # Design specification + SVG diagrams
│   ├── scenarios/          # Persona walkthrough documents
│   └── narrative/          # Investor-facing materials
├── src/
│   ├── types/              # TypeScript type definitions
│   ├── schemas/            # JSON Schema definitions + validators
│   └── state-machine/      # Contract state machine + autonomy gates
└── tests/
    ├── state-machine/      # Transition + autonomy gate tests
    ├── schemas/            # Schema validation tests
    └── scenarios/          # Persona scenario tests
```

## Status

**Phase 1: Pitch** (complete) — Protocol design, TypeScript library, investor materials
**Phase 2: Build** (next) — Implementation on existing Aquarius backend/AquaBot
**Phase 3: Open** (future) — Formal open standard, SDKs, platform adapters

## License

TBD
