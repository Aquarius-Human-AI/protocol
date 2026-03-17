# ADR-002: Contract-Centric Protocol with Outcome Abstraction Layer

**Date:** 2026-03-16
**Status:** Accepted
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

We needed to decide the core primitive of the protocol. Two candidates:

### Option A: Outcome-Centric

The core primitive is an **Outcome** (e.g., "get 3 quotes for kitchen renovation"). Everything else — tasks, subtasks, agent actions — are decompositions. A listing is a provider's claim they can deliver certain outcomes. A buyer request is a desired outcome.

**Pros:** Maps well to how users actually think.
**Cons:** Too fuzzy for a protocol spec. "Outcome" is subjective and hard to verify programmatically.

### Option B: Contract-Centric

The core primitive is a **Work Contract** between two parties (human, agent, or platform). It specifies inputs, outputs, acceptance criteria, and payment terms. An outcome is just the top-level contract, and subtasks are sub-contracts.

**Pros:** More formal, maps better to an open standard, machine-verifiable.
**Cons:** Can feel cold/transactional to users.

## Decision

**Contract-centric as the underlying protocol, with a clear Outcome abstraction layer on top.**

The protocol itself deals in contracts — precise, verifiable, machine-readable. But users never see "contracts." They see Outcomes: "Get reliable home help" which decomposes into multiple contracts (gutter cleaning, thermostat programming, iPad tutoring) each at different lifecycle stages.

```
Outcome: "Get reliable home help" (Dorothy)
  ├── Contract 1: Gutter cleaning (ACTIVE — scheduled for Tuesday)
  ├── Contract 2: Thermostat programming (MATCHING — 2 candidates)
  └── Contract 3: iPad tutoring (INTENT — AI refining requirements)
```

## Rationale

Andrew's framing: "B as underlying protocol with a clear abstraction layer of A on top of 1 or more contracts to make it more user/consumer friendly."

This gives us:
- **For investors:** "Outcomes" is the pitch — people achieve goals, not sign contracts
- **For engineers:** Contracts are the implementation — precise, testable, stateful
- **For the open standard:** Contract is the interop boundary — external platforms speak contracts, not outcomes
- **For users:** They never see the word "contract" — they see goals, progress, and results
