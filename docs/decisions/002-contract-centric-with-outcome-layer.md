# ADR-002: Outcome Schema + Contract as Protocol Core

**Date:** 2026-03-17
**Status:** Accepted (replaces 2026-03-16 version)
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

We needed to decide the core primitive of the protocol. Two candidates:

### Option A: Outcome-Centric

The core primitive is an **Outcome** (e.g., "get 3 quotes for kitchen renovation"). Everything else — tasks, subtasks, agent actions — are decompositions of this goal.

**Pros:** Maps precisely to how users think. Dorothy thinks "I want my home looked after," not "I want a work contract for gutter cleaning."
**Cons:** Too fuzzy for a protocol spec. "Outcome" is subjective and hard to verify programmatically. Outcomes can't easily be handed between agents — there's no agreed boundary for what constitutes one.

### Option B: Contract-Centric

The core primitive is a **Work Contract** between two parties (human, agent, or platform). It specifies inputs, outputs, acceptance criteria, and payment terms. An outcome is just the top-level contract; subtasks are sub-contracts.

**Pros:** Formal, machine-verifiable, maps well to an open standard. Contracts have clear state transitions and a defined lifecycle.
**Cons:** Can feel cold and transactional to users. "Contract" implies legal weight that most people don't want for everyday tasks.

## Decision

**Contract-centric as the underlying protocol, with a clear Outcome abstraction layer on top.**

The protocol deals in contracts — precise, verifiable, machine-readable. But users never see "contracts." They see Outcomes: "Get reliable home help" which decomposes into multiple contracts (gutter cleaning, thermostat programming, iPad tutoring) each progressing through their own lifecycle.

```
Outcome: "Get reliable home help" (Dorothy)
  ├── Contract 1: Gutter cleaning        (COMPLETE — done Tuesday)
  ├── Contract 2: Thermostat programming (ACTIVE — Mike scheduled Thursday)
  └── Contract 3: iPad tutoring          (MATCHING — 2 candidates found)
```

### The Outcome Schema (Layer A)

The Outcome Schema is the universal, machine-readable format for "what done means." This is Layer A of the Programmable Labor Network and one of the three compounding moat layers — every validated outcome schema makes future outcomes easier to specify, decompose, and price.

Each outcome carries:

- **Acceptance criteria** — one of `binary_check`, `threshold`, `human_judgment`, or `llm_evaluation`
- **Confidence range** — a `[low, mid, high]` tuple estimating the probability of successful completion
- **SLA parameters** — `max_duration`, `max_cost`, `quality_floor`, `escalation_trigger`
- **Composability** — outcomes nest with child outcomes and dependency declarations
- **Pricing hook** — `fixed`, `per_unit`, `time_capped`, or `outcome_contingent`
- **Versioning** — immutable once the job begins; amendments create new versions

### The Contract Lifecycle

Contracts move through a defined state machine. This is the implementation backbone of Layer A:

```
INTENT → REQUIREMENTS → MATCHING → PROPOSAL → NEGOTIATION → ACTIVE → VERIFICATION → COMPLETE
                                                                              ↓
                                                                           DISPUTED
```

Every state transition has defined actors (who can trigger it), required data, and autonomy gate rules. Ahmed's scenario shows what happens when autonomy gates block: his Facilitator mode requires explicit approval at `NEGOTIATION → ACTIVE` and again at `VERIFICATION → COMPLETE`. Dorothy's Delegate mode lets both transitions auto-fire.

### Layer A as Moat

The schema library compounds over time. Every job processed contributes a validated outcome definition — acceptance criteria that worked, confidence ranges that proved accurate, SLAs that held. This accumulated library makes future outcome specification faster and more accurate. A "tax preparation for small business" outcome specified by Ahmed becomes a template that helps the next hundred Ahmed-equivalent buyers define their outcomes without starting from scratch.

## Rationale

Andrew's framing: "Option B as underlying protocol, with a clear abstraction layer of Option A on top of one or more contracts to make it more user/consumer friendly."

This gives us:
- **For investors:** "Outcomes" is the pitch — people achieve goals, not sign contracts
- **For engineers:** Contracts are the implementation — precise, testable, stateful
- **For the open standard:** Contract is the interop boundary — external platforms speak contracts, not outcomes
- **For users:** They never see the word "contract" — they see goals, progress, and results
- **For the moat:** The schema library of validated outcomes compounds as a proprietary data asset
