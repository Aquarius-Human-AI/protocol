# ADR-001: Why a Programmable Labor Network?

**Date:** 2026-03-17
**Status:** Accepted (updated 2026-03-28)
**Participants:** Peeyush (founder), Claude (AI collaborator)

## Context

Aquarius is an AI-powered social marketplace that helps people turn ideas into opportunities. The platform already has:

- **Backend:** Flask microservices with intent analysis, expert matching, listings/buyer requests, async task execution
- **Frontend:** React app with conversational UI, AI-generated feeds, marketplace listings
- **AquaBot:** Autonomous web agent that executes tasks on external platforms (browsing, form-filling, research)

These systems work, but the interactions between humans, AI agents, and external platforms are implicit — scattered across API contracts, Firestore documents, and agent prompts. There is no formal model for:

- How an outcome is defined and what "done" means
- How tasks are decomposed and assigned across human and AI workers
- How capability is discovered, indexed, and matched to work
- How confidence and uncertainty are surfaced
- How work is handed between AI agents and humans mid-execution
- How performance is measured and fed back into future routing
- How payment is triggered

Beyond the internal architecture problem, this gap points to a larger market opportunity. Existing labor marketplaces were designed for human-to-human transactions. They break when AI enters — they have no model for AI workers, no concept of hybrid execution, and no way to route work to the optimal blend of human and machine labor.

## Decision

Build a **Programmable Labor Network (PLN)** — the scoping, decomposition, coordination, trust, and routing layer for the human + AI services economy.

PLN discovers human and AI labor supply, profiles and tracks performance over time, and routes outcome-based work to the optimal blend of labor. The system learns the language of getting work done through others — scoping patterns, decomposition templates, routing intelligence, handoff logic, and evaluation calibration.

The moat is not the software. It is the **accumulated language of getting work done**: the labor graph of reputation, capability, and performance data across every worker node. Every completed job deposits operational memory that makes the system smarter, stickier, and harder to replicate. Data network effect, not scale effect.

PLN is implemented through seven building blocks: **Work Contract**, **Autonomy Gates**, **Hybrid Reputation Unit**, **Per-Task Matching**, **Demand-Driven Supply Discovery**, **Provenance Graph**, and **Handoff Protocol**.

## Why Now

1. **Investor pitch (highest priority):** We need seed funding. A well-articulated protocol positions Aquarius as infrastructure, not just another marketplace app. "The coordination layer for the human + AI services economy" is the pitch. The moat narrative — accumulated language of getting work done as compounding data asset — is the differentiator.

2. **Internal architecture:** The protocol becomes the actual roadmap for how we build and unify the backend and frontend systems. Building this rigorously now prevents implicit contracts between systems from calcifying into technical debt.

3. **Open standard ambition:** If the protocol is good enough, it becomes adoptable by third parties — the "HTTP of agent-powered work." External platforms (Fiverr, Upwork, task-specific AI agents) can speak PLN contracts without understanding Aquarius internals.

## What This Is Not

- Not a product spec for a specific feature
- Not a refactor of existing code (yet)
- Not academic — it must be implementable on what we already have

## Who This Must Serve

We grounded the protocol design in our simulation personas, which represent the full diversity of Aquarius users. Key archetypes that stress-test the protocol:

| Persona | Profile | Challenge for the Protocol |
|---------|---------|---------------------------|
| **Dorothy H.** (71, rural Wisconsin, tech-comfort 1, buyer) | Widowed, fixed income, wants home help | Protocol must work when one party can barely use technology. AI handles nearly everything. Delegate mode means Dorothy sees goals and results, not tasks or contracts. |
| **Ahmed F.** (44, ESL, Somali refugee, Minneapolis, buyer) | Small business owner, taxes, institutional distrust | Language, cultural trust networks, and negative prior experiences must be first-class matching criteria — not metadata. |
| **Alex C.** (32, Upwork pro, NYC, provider) | Bootstrapping reputation on a new platform | Protocol must allow reputation portability across platforms, with transparent confidence discounting. Fee transparency is non-negotiable. |
| **Rosa M.** (34, community organizer, South Bronx, both) | Provides benefits navigation; buys peer review | Pricing discomfort ("would feel weird charging"), non-monetary value exchange. $0 contracts must be fully valid and reputation-building. |
| **Harold B.** (70, master mechanic, rural Wisconsin, provider) | Tech-comfort 1, provides car diagnoses by phone | Needs a delegation chain — grandson Jake manages the technology, AI handles the routing, Harold just picks up the phone. |

The protocol must handle everything from "clean my gutters" (Dorothy) to "migrate my freelance business" (Alex) and feel natural whether you're Harold (who never touches a screen) or Rosa (who is on both sides of the same transaction).
