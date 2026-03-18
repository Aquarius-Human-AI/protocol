# ADR-003: Autonomy as User-Configurable Risk Profile

**Date:** 2026-03-17
**Status:** Accepted (replaces 2026-03-16 version)
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

The AI agent's role in contract execution spans a wide spectrum. At one extreme, the AI is purely advisory — it surfaces options and the human does everything. At the other, it handles an entire outcome end-to-end without asking. Both extremes have legitimate users:

- Dorothy (71, tech-comfort 1) *wants* the AI to handle everything — the friction of approving each step would make the system unusable for her.
- Ahmed (44, prior bad experience with advisors) *needs* to approve every commitment — trust is built through visibility and control, not through speed.
- Alex (32, power user) wants fine-grained control over how her professional work is represented and priced.

We asked: which posture should be the default, and how should the protocol model the variation?

## Decision

**All four autonomy levels, user-configurable, with protocol guardrails proportional to (autonomy level × risk).**

The protocol is mode-agnostic. Autonomy level is a cross-cutting concern — it modifies contract state transition rules at every gate in the lifecycle without changing the contract structure itself.

| Level | Name | Behavior | Example |
|-------|------|----------|---------|
| 1 | **Advisor** | AI suggests; human executes every step | Human manually contacts providers, AI drafts messages |
| 2 | **Facilitator** | AI structures and advances; human approves every commitment | Ahmed approves NEGOTIATION → ACTIVE, then VERIFICATION → COMPLETE |
| 3 | **Agent** | AI commits within pre-authorized bounds (budget, category, risk level) | Rosa auto-approves commitments under $150; anything higher requires confirmation |
| 4 | **Delegate** | AI handles end-to-end within risk bounds; human notified, not blocked | Dorothy's gutter cleaning: 8 state transitions, 0 approvals required |

The approval threshold for any given gate = `f(autonomy_setting, risk_profile_of_action)`.

### Guardrails Scale with Risk

Autonomy level alone does not determine whether a transition auto-fires. The stakes of the specific action matter equally:

- Dorothy at Delegate: $20 gutter cleaning → auto-executes
- Dorothy at Delegate: $5,000 kitchen renovation → still requires confirmation
- Rosa at Agent: $125 fellowship review → auto-approved (under $150 cap)
- Rosa at Agent: $175 commitment → blocked, requires human override

This means the same user, same autonomy setting, same protocol — different behavior based on the risk profile of the specific contract.

### Delegation Chains

Harold's scenario introduced a requirement that single-party autonomy models don't cover: what if the user cannot interact with the system at all, and delegates control to a trusted proxy?

Harold (70, master mechanic, tech-comfort 1) provides car diagnosis services by phone. He has never used a smartphone app. His grandson Jake acts as his technology proxy — he set up Harold's account, manages his availability, and monitors incoming requests. The AI agent handles routing, context prep, and scheduling. Harold only picks up the phone when a buyer calls.

This requires a **three-level delegation chain**, which the protocol models as first-class:

```
harold-b (identity, provider)
  └── jake-b (tech proxy — full account management rights)
        └── ai-agent (routing, scheduling, context prep)
```

Each level in the chain has defined permissions:
- Harold: the canonical identity, capability owner, receives payment
- Jake: authorized account manager, can set availability, approve contracts up to Harold's pre-set limits
- AI agent: can advance low-risk transitions, prepare context, initiate outreach

Delegation chains are tracked in handoff records — every handoff notes who authorized it, what context was passed, and what was simplified or summarized at each level. When Walter's truck diagnosis completes in 11 minutes for $20 (saving $450 at a shop), Harold's reputation record reflects that — not Jake's and not the agent's.

### Formal Implementation: Layer D

Autonomy gates are specified in Layer D (Execution, Evaluation, and Handoff). Every state transition in the contract lifecycle has a defined gate check: does this transition require human approval given the current autonomy setting and risk profile? If yes, the contract pauses and emits an approval request. If no, it advances and emits a notification.

This is enforced at the protocol level, not in application code. Any AWP-compatible runtime must implement these gate checks — they are not optional features.

## Rationale

Andrew's key insight: *"We're building something similar to retirement/investment fund interfaces where the user chooses their risk profile and the system takes actions accordingly. We're doing the same, but with 'wealth' defined much more broadly — we're trying to help users grow their self-worth and net worth, not just their bank account."*

This analogy is powerful because:
1. **Users understand it** — risk profiles are a known UX pattern from fintech
2. **It's investor-friendly** — the fintech parallel legitimizes the approach
3. **It scales gracefully** — Dorothy (tech-comfort 1) starts at Delegate because she *wants* the AI to handle everything; Alex starts at Facilitator because she wants control; Harold uses Delegate via a delegation chain that never requires him to touch a screen
4. **It's honest** — the system does not pretend all users want the same level of AI involvement. It respects that autonomy is a personal preference, not a capability setting.

The label presented to users — "modes," "agent personalities," or something more approachable — is a product decision. The underlying protocol only needs the autonomy level to determine transition rules.
