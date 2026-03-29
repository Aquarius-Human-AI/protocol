# Aquarius — The Programmable Labor Network (PLN)

> The scoping, decomposition, coordination, trust, and routing layer for the human + AI services economy.

A protocol for defining, matching, executing, and verifying work between humans, AI agents, and external platforms. The system that learns the language of getting work done through others.

## Overview

PLN is the foundational protocol that powers [Aquarius](https://peopleaquarius.com). It formalizes how messy intent becomes accountable execution across human and AI labor:

- **Outcome Owners** describe what they need in plain language
- **The platform** scopes, decomposes, routes, fulfills, and verifies the result
- **Workers** (human, AI, or hybrid) execute tasks routed by capability, not category

## Seven Building Blocks

| Primitive | What It Solves |
|-----------|---------------|
| **Work Contract** | Machine-readable work order with deterministic state machine — the canonical output of scoping and decomposition |
| **Autonomy Gates** | Risk-modified policy letting agents spend real money while keeping humans in control proportional to the stakes |
| **Hybrid Reputation Unit** | Bayesian score tracking human-AI composites per-skill, per-task-type, with confidence bands that tighten over time |
| **Per-Task Matching** | Independent routing of each task node in the decomposed job graph to the optimal worker |
| **Demand-Driven Supply Discovery** | Web crawling triggered by buyer demand that constructs structured worker profiles organized by task-type capability |
| **Provenance Graph** | Cryptographically chained receipt of who did what, with what tools, at what quality, for every completed job |
| **Handoff Protocol** | Explicit record of every transition between participants — context transferred, quality standards, scope boundaries |

## Six-Layer Architecture + Governance

| Layer | Function | Moat Contribution |
|-------|----------|-------------------|
| **A** — Outcome Schema & Work Contract | Scoping intent into structured specs with acceptance criteria | Core moat — compounds |
| **B** — Task Decomposition Engine | Converting outcomes into executable DAGs with dependencies | Execution layer |
| **C** — Capability & Routing Index | Labor graph: registry of all participants with profiles and performance | Core moat — compounds |
| **D** — Execution, Evaluation & Handoff | Runtime that performs work, manages handoffs, evaluates outputs | Execution layer |
| **E** — Trust & Reputation | Bayesian scoring, provenance, anti-gaming, audit trail | Core moat — compounds |
| **F** — Buyer & Worker Control Surface | Unified interface for visibility, approval gates, and intervention | Interface layer |
| **Gov** — Cross-Cutting Governance | Policy enforcement, transition control, context assembly across all layers | Cross-cutting |

## Quick Start

```bash
npm install
npm test        # Protocol validation tests — state machine, autonomy gates, schemas, scenarios
npm run build   # TypeScript compilation
```

## For Investors

Start with the [PLN Investor Memo](docs/pln-memo.md) — the comprehensive narrative covering market thesis, product architecture, evidence, and competitive positioning.

Also see [PLN in 5 Minutes](docs/narrative/pln-in-5-minutes.md) — a concise non-technical overview.

## For Engineers

Start with the [Layer Specs](docs/specs/) — implementation specifications for each layer:

| Spec | Layer |
|------|-------|
| [Layer A](docs/specs/SPEC-LAYER-A.md) | Outcome Schema & Work Contract |
| [Layer B](docs/specs/SPEC-LAYER-B.md) | Task Decomposition Engine |
| [Layer C](docs/specs/SPEC-LAYER-C.md) | Capability & Routing Index |
| [Layer D](docs/specs/SPEC-LAYER-D.md) | Execution, Evaluation & Handoff |
| [Layer E](docs/specs/SPEC-LAYER-E.md) | Trust & Reputation |
| [Layer F](docs/specs/SPEC-LAYER-F.md) | Buyer & Worker Control Surface |
| [Governance](docs/specs/SPEC-LAYER-Governance.md) | Cross-Cutting Policy & Transition Control |
| [Deferred](docs/specs/DEFERRED.md) | Items deferred to v2+ |

## Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [PLN Investor Memo](docs/pln-memo.md) | Investors | Full narrative — market, product, evidence, risks |
| [PLN in 5 Minutes](docs/narrative/pln-in-5-minutes.md) | Investors | Concise non-technical overview |
| [Layer Specs](docs/specs/) | Engineers | Implementation specifications per layer |
| [Decision Records](docs/decisions/) | Both | Why we made each architectural choice |
| [Persona Scenarios](docs/scenarios/) | Both | Real-world protocol walkthroughs |
| [Full docs index](docs/README.md) | Both | Complete documentation navigation |

## User Taxonomy

| Persona | Description |
|---------|-------------|
| **Outcome Owner** | Time-starved person with urgent, underspecified outcomes |
| **Capacity Operator** | Established freelancers/agencies hitting a fulfillment ceiling |
| **Emerging Operator** | Reskilled workers packaging transferable skills into paid work |
| **Specialist-in-Waiting** | Domain experts wanting flexibility without building a full business |
| **Apprentice Builder** | Students, new grads, and career starters |
| **Functional Collaborator** | People pulled into workflows for approvals, edits, or handoffs (growth loop) |
| **Transitioning Portfolio Worker** | Workers turning unstable income into structured, repeatable work |

## Persona Scenarios

Real people, real outcomes — protocol walkthroughs grounded in diverse user personas:

| Persona | Age | Role | Key Protocol Features |
|---------|-----|------|----------------------|
| [Dorothy H.](docs/scenarios/dorothy-home-help.md) | 71 | Outcome Owner (Delegate) | Multi-contract outcome, full AI delegation |
| [Ahmed F.](docs/scenarios/ahmed-business-taxes.md) | 44 | Outcome Owner (Facilitator) | ESL matching, cultural trust signals |
| [Alex C.](docs/scenarios/alex-upwork-migration.md) | 32 | Capacity Operator (Facilitator) | Reputation portability, fee transparency |
| [Rosa M.](docs/scenarios/rosa-community-exchange.md) | 34 | Both (Agent) | Non-monetary value, community exchange |
| [Harold B.](docs/scenarios/harold-car-diagnosis.md) | 70 | Capacity Operator (Delegate) | 3-level delegation chain, family-assisted |

## Wedge Product

We start in high-friction expert services — **design, consulting, coaching, and event planning** — where buyers have intent but not specs, outcomes are verifiable, and the scoping gap is widest.

## Project Structure

```
├── docs/
│   ├── decisions/          # Architecture Decision Records (ADRs)
│   ├── specs/              # Layer implementation specs + SVG diagrams
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

## The Moat

The defensible asset is the accumulated **language of getting work done through others**: scoping patterns, decomposition templates, routing intelligence, handoff logic, and evaluation calibration. Every completed job deposits operational memory that makes the system smarter, stickier, and harder to replicate.

More jobs → richer reputation data → better routing → better outcomes → more buyer trust → more jobs. Data network effect, not scale effect.

## Status & Roadmap

**Phase 1: Pitch** (complete) — Protocol design, TypeScript library, investor materials
**Phase 2: Build** (next) — Implementation on existing Aquarius backend
**Phase 3: Open** (future) — Formal open standard, SDKs, platform adapters

See the full [Roadmap](docs/ROADMAP.md) for Phase 2 breakdown, sequencing, milestones, and open questions.

## License

TBD
