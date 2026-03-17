# ADR-003: User-Configurable Autonomy Levels as Risk Profiles

**Date:** 2026-03-16
**Status:** Accepted
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

The AI agent's role in contract formation spans a wide spectrum:

| Level | Name | Behavior |
|-------|------|----------|
| 1 | **Advisor** | AI suggests, human does everything |
| 2 | **Facilitator** | AI structures contracts, extracts requirements, suggests terms — both parties explicitly agree |
| 3 | **Agent** | AI enters contracts on behalf of users within pre-authorized boundaries. User confirms. |
| 4 | **Delegate** | AI handles everything end-to-end within guardrails. No per-action approval needed. |

We asked: which is the default posture?

## Decision

**All four levels, user-configurable, with protocol guardrails proportional to (autonomy level × risk).**

The protocol itself is mode-agnostic. Autonomy level is a cross-cutting concern that modifies contract state transition rules:

- **Advisor mode:** Human approval required at every transition
- **Facilitator mode:** AI can advance through low-risk transitions, human approves commitments
- **Agent mode:** AI can commit within pre-authorized bounds (budget, category, risk level)
- **Delegate mode:** AI auto-advances within risk bounds, human notified but not blocked

The approval threshold for any given action = f(autonomy_setting, risk_profile_of_action).

## Rationale

Andrew's key insight: *"We're building something similar to retirement/investment fund interfaces where the user chooses their risk profile and the system takes actions accordingly. We're doing the same, but with 'wealth' defined much more broadly — we're trying to help users grow their self-worth and net worth, not just their bank account."*

This analogy is powerful because:
1. **Users understand it** — risk profiles are a known UX pattern
2. **It's investor-friendly** — the fintech parallel legitimizes the approach
3. **It scales gracefully** — Dorothy (tech-comfort 1) might start at Delegate because she *wants* the AI to handle everything; Alex (power user) might prefer Facilitator because she wants control

### Presentation to Users

Andrew noted these will likely be presented as a choice for "how you want Aquarius to act on your behalf" — possibly as modes, agent personalities, or something even more approachable. The underlying protocol doesn't care about the label; it just needs the autonomy level to determine transition rules.

### Guardrails Scale with Risk

A $20 gutter cleaning at Delegate level might auto-execute. A $5,000 kitchen renovation at the same level would still require confirmation. The risk isn't just the autonomy setting — it's the combination of autonomy setting and the stakes of the specific action.
