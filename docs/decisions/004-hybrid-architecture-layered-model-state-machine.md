# ADR-004: Hybrid Architecture — Layered Model + State Machine

**Date:** 2026-03-16
**Status:** Accepted
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

Three architectural approaches were considered:

### Option A: "Contract Stack" — Bottom-up Protocol Layers

Model it like OSI/TCP-IP. Each layer handles one concern:

```
Layer 5: Outcome Layer     — User-facing goals
Layer 4: Contract Layer    — Terms, acceptance criteria, payment triggers
Layer 3: Execution Layer   — Task decomposition, assignment, progress
Layer 2: Capability Layer  — What can this agent/human/platform do?
Layer 1: Identity Layer    — Who are you? Trust level? Autonomy settings?
```

**Pros:** Clean conceptually. Each layer evolves independently. Maps well to open standard. Investors understand layered architectures.
**Cons:** Can feel academic. Risk of over-engineering. Layers may not map cleanly to implementation.

### Option B: "State Machine" — Contract Lifecycle Focus

Single entity (Work Contract) moves through states with well-defined transitions:

```
INTENT → REQUIREMENTS → MATCHING → PROPOSAL → NEGOTIATION → ACTIVE → VERIFICATION → COMPLETE
```

Each transition has: who can trigger it, what data is required, what guardrails apply.

**Pros:** Very concrete and implementable. Maps to Firestore and APIs. Matches AquaBot's existing task lifecycle.
**Cons:** Less modular. Capability matching, identity, and payment are interleaved. Harder to spec as open standard.

### Option C: Hybrid (Recommended)

Layered architecture as the *conceptual model*, state machine as the *implementation*:

- The **spec document** describes 5 layers (pitch-worthy, extensible)
- The **protocol itself** is a contract state machine with transitions that invoke layer concerns
- The **Outcome abstraction** sits above, orchestrating 1+ contracts toward a human goal
- **Autonomy levels** (ADR-003) are a cross-cutting concern modifying transition rules

## Decision

**Option C: Hybrid.** Layered model for investors and open standard. State machine for implementation.

## Rationale

This gives us three things at once:

1. **Investor narrative:** "AWP is a 5-layer operating system for agent-powered services" — comparable to how TCP/IP enabled the internet
2. **Implementation path:** State machine on existing Firestore/AquaBot infrastructure — we can build this
3. **Open standard ambition:** Layers are the spec, state machine is the reference implementation

### Phasing

This architecture naturally suggests a phased approach:

- **Phase 1 (Pitch):** Layer model + contract lifecycle narrative + persona scenarios
- **Phase 2 (Build):** State machine implementation on existing backend/AquaBot
- **Phase 3 (Open):** Formal layer specifications, adapter SDK for external platforms

## Trade-offs Accepted

- More complex to spec than pure state machine — requires discipline to keep layers conceptual and state machine concrete
- Risk of muddling the two — mitigated by clear documentation of which is which
