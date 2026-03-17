# Aquarius Work Protocol (AWP)

> The operating system for agent-powered services.

## What Is This?

AWP is a protocol for defining, matching, executing, and verifying work between humans, AI agents, and external platforms. It's the foundational layer that makes Aquarius a platform, not just an app.

## Current Status

**Phase:** Design & specification (pre-implementation)

We're working through the protocol design, capturing decisions as Architecture Decision Records (ADRs), and building toward a spec that serves three audiences:

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

### Archive

Historical docs (completed investigations, superseded plans) go to `archive/` with date prefixes.
