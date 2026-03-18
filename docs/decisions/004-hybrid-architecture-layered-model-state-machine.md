# ADR-004: Six-Layer Architecture with Moat/Execution Separation

**Date:** 2026-03-17
**Status:** Accepted (replaces 2026-03-16 version)
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

Three architectural approaches were considered for how to model the Programmable Labor Network:

### Option A: "Contract Stack" — Bottom-up Protocol Layers

Model it like OSI/TCP-IP. Each layer handles one concern, evolves independently, and maps to an open standard.

**Pros:** Clean conceptually. Pitch-worthy. Extensible.
**Cons:** Can feel academic. Layers may not map cleanly to implementation.

### Option B: "State Machine" — Contract Lifecycle Focus

Single entity (Work Contract) moves through states with well-defined transitions:
```
INTENT → REQUIREMENTS → MATCHING → PROPOSAL → NEGOTIATION → ACTIVE → VERIFICATION → COMPLETE
```

**Pros:** Very concrete and implementable. Maps directly to Firestore and APIs. Matches AquaBot's existing task lifecycle.
**Cons:** Less modular. Capability matching, identity, and payment are interleaved. Harder to spec as an open standard.

### Option C: Hybrid (Selected)

Layered architecture as the *conceptual model*, state machine as the *implementation*. The layers tell you *what* the system does; the state machine tells you *how* it does it.

## Decision

**Option C: Hybrid.** Six-layer architecture for investors and open standard. State machine for implementation.

The six layers are:

| # | Layer | Function | Moat? |
|---|-------|----------|-------|
| A | Outcome schema + contract | Universal format for "what done means," formalized as work contracts with state machine lifecycle | **Core moat — compounds** |
| B | Task decomposition engine | Breaks contracts into a DAG of executable work units | Execution layer |
| C | Capability + routing index | Maps every worker node (human, AI, hybrid) — skills, performance, cost, availability | **Core moat — compounds** |
| D | Execution, evaluation + handoff | Runs tasks, evaluates output, manages AI↔human transitions, enforces autonomy gates | Execution layer |
| E | Trust + reputation | Verifies work, builds multi-dimensional scored performance data per worker per skill | **Core moat — compounds** |
| F | Buyer control surface | Real-time DAG visualization, approval gates, override and redirect capability | Interface layer |

### The Moat/Execution Split

This is the key architectural insight that separates a Programmable Labor Network from a workflow engine:

**Layers A, C, and E are the compounding data moat.** Every job processed enriches all three:
- Layer A: a validated outcome schema enters the library; future outcomes of that type are faster to specify and price
- Layer C: the routed worker gets a performance data point; the routing model improves
- Layer E: the completed job updates the worker's reputation score; future routing gets more accurate

**Layers B, D, and F are execution and interface.** They are necessary infrastructure but not defensible:
- Layer B (task decomposition) — LLM-powered planning. Reliable, but model access is commoditizing.
- Layer D (execution runtime) — Firestore state machine + AquaBot. Infrastructure, not proprietary.
- Layer F (buyer control surface) — React frontend with SSE. Product surface, replicable.

This split has strategic implications: investment in moat layers (A, C, E) compounds. Investment in execution/interface layers (B, D, F) depreciates. Architectural decisions that trade moat quality for execution convenience should be treated skeptically.

### Infrastructure Requirements

The six-layer architecture has specific infrastructure dependencies that must be planned for:

| Requirement | Purpose | Layer |
|-------------|---------|-------|
| Event bus (Kafka) | Task and state change events across layers | B, D |
| Time-series DB (InfluxDB / TimescaleDB) | Performance metrics, windowed aggregates | C, E |
| Graph database (Neo4j) | Worker capability graph, provenance graph | C, E |
| Append-only audit log (Merkle-tree backed) | Tamper-evident execution history | E |
| Object storage | Task artifacts, evaluation outputs | D |
| WebSocket / SSE infrastructure | Real-time buyer progress view | F |
| LLM API access (frontier models) | Task decomposition (Layer B), LLM-as-judge evaluation (Layer D) | B, D |
| Web search API access | Worker discovery crawler (Layer C) | C |

### Phasing

The hybrid architecture naturally supports a phased build:

- **Phase 1 (Pitch — complete):** Layer model + contract lifecycle narrative + persona scenarios. Investors see a coherent architecture. The TypeScript library and 59 schema/state-machine tests prove it's implementable.
- **Phase 2 (Build):** State machine implementation on existing Firestore/AquaBot infrastructure. Start with Layers A and D (contract lifecycle + execution). Layer C (capability index) and Layer E (reputation) follow as the first jobs complete and generate data.
- **Phase 3 (Open):** Formal layer specifications, adapter SDK for external platforms (Fiverr, Upwork, etc.). Layers A and C become the interop boundary.

## Rationale

This architecture gives us three things at once:

1. **Investor narrative:** "A six-layer Programmable Labor Network, three layers of which form a compounding data moat" — comparable to how TCP/IP enabled the internet, but with an explicit explanation of where defensibility comes from.

2. **Implementation path:** State machine on existing Firestore/AquaBot infrastructure — we can build Phase 2 without greenfielding. The state machine is already specified in the TypeScript library.

3. **Open standard ambition:** The layers are the spec. The state machine is the reference implementation. External platforms implement Layer A (contracts) and optionally Layer C (capability cards) — they don't need to understand the full stack.

## Trade-offs Accepted

- More complex to spec than a pure state machine — requires discipline to keep layers conceptual and the state machine concrete
- Infrastructure requirements (Kafka, Neo4j, time-series DB) are significant. Phase 2 should sequence carefully to avoid over-building before the moat layers have real data to justify the infrastructure
- LLM-as-judge evaluation in Layer D introduces model dependency and cost — mitigated by using a separate evaluator model (not the same model that executed the task) and routing to human QA when confidence falls below threshold
