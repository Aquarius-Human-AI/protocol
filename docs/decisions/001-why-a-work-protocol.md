# ADR-001: Why a Work Protocol?

**Date:** 2026-03-16
**Status:** Accepted
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

Aquarius is an AI-powered social marketplace that helps people turn ideas into opportunities. The platform already has:

- **Backend:** Flask microservices with intent analysis, expert matching, listings/buyer requests, async task execution
- **Frontend:** React app with conversational UI, AI-generated feeds, marketplace listings
- **AquaBot:** Autonomous web agent that executes tasks on external platforms (browsing, form-filling, research)

These systems work, but the interactions between humans, AI agents, and external platforms are implicit — scattered across API contracts, Firestore documents, and agent prompts. There's no formal model for:

- How an outcome is defined
- How tasks are broken down and assigned
- How capability is matched to work
- How confidence and uncertainty are surfaced
- How work is handed between AI and human
- How performance is measured
- How payment is triggered

## Decision

Create the **Aquarius Work Protocol (AWP)** — a formal protocol for defining, matching, executing, and verifying work between any combination of:

- Humans ↔ Aquarius AI agents
- Aquarius AI agents ↔ other Aquarius AI agents
- Aquarius AI agents ↔ external platforms (Fiverr, Upwork, etc.)

The user interface and adapters vary wildly for these, but the underlying protocol is the same.

## Why Now

1. **Investor pitch (highest priority):** We need seed funding. A well-articulated protocol positions Aquarius as infrastructure, not just another marketplace app. "Operating system for agent-powered services" is the pitch.
2. **Internal architecture:** The protocol becomes the actual roadmap for how we refactor and unify the backend/AquaBot systems.
3. **Open standard ambition:** If the protocol is good enough, it becomes adoptable by third parties — the "HTTP of agent-powered work."

## What This Is Not

- Not a product spec for a specific feature
- Not a refactor of existing code (yet)
- Not academic — it must be implementable on what we already have

## Who This Must Serve

We grounded the protocol design in our 50 simulation personas, which represent the full diversity of Aquarius users. Key archetypes that stress-test the protocol:

| Persona | Challenge for the Protocol |
|---------|---------------------------|
| **Dorothy H.** (71, rural, tech-comfort 1, buyer) | Protocol must work when one party can barely use technology. AI handles nearly everything. |
| **Ahmed F.** (44, ESL, refugee, buyer) | Language barriers, institutional distrust, community-based trust networks. |
| **Alex C.** (32, Upwork pro, provider) | Fee transparency, portfolio portability, professional-grade contract terms. |
| **Rosa M.** (34, community organizer, both) | Pricing discomfort ("would feel weird charging"), non-monetary value exchange. |
| **Harold B.** (70, tech-comfort 1, provider) | Needs delegation/proxy model — grandson manages the tech side. |

The protocol must handle everything from "clean my gutters" to "migrate my freelance business" and feel natural whether you're Dorothy or Alex.
