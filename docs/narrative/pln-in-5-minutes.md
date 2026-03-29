# The Programmable Labor Network (PLN) in 5 Minutes

> *Building the scoping, decomposition, coordination, trust, and routing layer for the human + AI services economy.*

---

## The Problem

Within one to three years, a meaningful share of service demand will be initiated, scoped, and managed by AI agents. But the second real work needs to get done — the second someone needs a brand refresh, a corporate offsite organized, a go-to-market strategy built — the workflow breaks.

A human still has to figure out what "done" looks like. They break the outcome into tasks, decide which parts are AI-doable and which need a human, sequence the steps, manage handoffs between workers, chase updates, and verify each step was completed well. They become an unpaid program manager for a job they wanted off their plate.

Six things break in today's service markets, and they start with the same root cause:

- **Scoping breaks** — platforms expect buyers to arrive with specs; most arrive with intent
- **Search breaks** — more listings doesn't help when the buyer can't evaluate them
- **Trust breaks** — 4.8-star ratings tell you nothing about per-skill, per-task performance
- **Process breaks** — platforms stop at discovery, externalizing coordination to the buyer
- **Completion breaks** — no platform owns whether the outcome was actually achieved
- **Distribution breaks** — supply-side optimization for human eyeballs is invisible to agents

The rails to turn messy intent into accountable execution across human and AI labor do not yet exist. Aquarius is building them.

---

## The Insight

What must exist is a system that absorbs the entire coordination burden. Not a marketplace where you search for help. An orchestration layer that takes "I need this done," scopes it into a structured spec with acceptance criteria, decomposes it into a task graph, routes each task to the right blend of human and AI labor, manages every handoff with full context preservation, evaluates each output, and — critically — gets smarter with every completed job.

This is a new kind of foundation model — one that develops fluency in the language of getting work done through others, the way coding LLMs developed fluency in programming.

---

## Seven Building Blocks

PLN is composed of seven product primitives. Each solves a specific hard problem and connects to the compounding system.

**Work Contract** — A machine-readable work order with a deterministic state machine that any agent can negotiate, execute, and verify against. Service commerce needs this canonical object the way payments needed Stripe's charge object.

**Autonomy Gates** — Risk-modified policy that lets agents spend real money on real services while keeping humans in control proportional to the stakes. The credible answer to "who's in charge when things go wrong?"

**Hybrid Reputation Unit** — A Bayesian score tracking a human-AI composite as a single performant entity, with confidence bands that tighten over time. Per-skill, per-task-type: a worker excellent at transcription may be mediocre at analysis.

**Per-Task Matching** — Independent routing of each task node in the decomposed job graph to the optimal worker. "Produce a podcast package" routes transcription to AI, writing to a human, cover art to a design tool.

**Demand-Driven Supply Discovery** — Web crawling triggered by actual buyer demand that constructs structured worker profiles organized by task-type capability. The cold-start problem is addressed at the architecture level.

**Provenance Graph** — A cryptographically chained receipt of who did what, with what tools, at what quality, for every completed job. When an agent manages three parallel contracts, the buyer needs proof, not promises.

**Handoff Protocol** — An explicit record of every transition between participants: context transferred, quality standards, scope boundaries. "I already told the other person" becomes impossible to ignore.

---

## Six-Layer Architecture + Governance

| Layer | Function | Moat |
|-------|----------|------|
| **A** — Outcome Schema & Work Contract | Scopes intent into structured specs with acceptance criteria | Core moat — compounds |
| **B** — Task Decomposition Engine | Converts outcomes into executable DAGs with dependencies | Execution layer |
| **C** — Capability & Routing Index | Labor graph: registry of all participants with performance data | Core moat — compounds |
| **D** — Execution, Evaluation & Handoff | Runtime that performs work, manages handoffs, evaluates outputs | Execution layer |
| **E** — Trust & Reputation | Bayesian scoring, provenance, anti-gaming, audit trail | Core moat — compounds |
| **F** — Buyer & Worker Control Surface | Unified interface for visibility, approval gates, intervention | Interface layer |
| **Gov** — Cross-Cutting Governance | Policy enforcement, transition control, context assembly | Cross-cutting |

Three layers are the moat (A, C, E). They accumulate data that compounds: scoping patterns, routing intelligence, and reputation graphs. The execution layers (B, D) and interface (F) are reliable but not proprietary. The governance layer is the synchronous gate through which all transitions pass.

---

## How It Works

### The Buyer's Experience

The buyer describes what they need in plain language. The system scopes it into a structured work order with acceptance criteria. It decomposes the outcome into a task graph with dependencies. Each task is routed independently to the optimal worker — human, AI, or hybrid — based on the task's requirements, not the job's category.

The buyer never scopes, decomposes, routes, or manages handoffs themselves. They see outcome-level progress — "72% complete, 3 of 4 milestones passed, on track for your deadline" — and can drill into task-level detail if they want, but never need to. The system feels like ordering a service, not managing a project.

### The Contract Lifecycle

Every contract follows the same state machine:

**Intent** → **Requirements** → **Active** → **Verification** → **Complete**

With branches for: DISPUTED, CANCELLED, EXPIRED, FAILED.

Autonomy gates evaluate risk at every transition. A $50 gutter cleaning auto-executes. A $5,000 kitchen renovation triggers confirmation, even for a Delegate user. The system weighs dollar amount, reversibility, category sensitivity, and provider track record.

---

## Real People, Real Outcomes

### Dorothy — Outcome Owner, Delegate mode

Dorothy is 71, lives alone in rural Wisconsin. She tells Aquarius she needs help around the house. The AI scopes three contracts: gutter cleaning, thermostat programming, iPad tutoring. It finds a verified local handyman, schedules work for Tuesday when her granddaughter can be there, and locates a patient tech tutor. Dorothy never opens a browser. She gets a phone call confirming the schedule.

### Alex — Capacity Operator, Facilitator mode

Alex is a 32-year-old freelance copywriter who built a strong reputation on Upwork over five years. She's tired of 20% fees and wants to move her business. The protocol imports her verified work history into a Capability Card, preserving her track record. She reviews and approves each new contract. Her five years of earned trust travel with her.

### Ahmed — Outcome Owner, Facilitator mode

Ahmed is a 44-year-old Somali refugee in Minneapolis running a small cleaning business. He needs an accountant who understands immigrant small business taxes and speaks Somali. The protocol weighs community trust signals alongside professional credentials, finds the right CPA, and structures milestone-based payment. Ahmed focuses on his business.

---

## The Autonomy Model

Every user chooses an autonomy level — like choosing an investment strategy:

**Advisor** — "Show me options, I decide everything." Best for power users and learning.

**Facilitator** — "Help me do this, but ask before spending." Best for professionals wanting efficiency without losing control.

**Agent** — "Handle it within these bounds." Pre-set limits on spending and categories. Best for busy people with clear needs.

**Delegate** — "Take care of it, keep me posted." End-to-end management with risk-appropriate guardrails. Best for people who want results without managing process.

Autonomy is not a blank check. Even at Delegate level, the protocol calculates a risk score for every action — weighing dollar amount, reversibility, category sensitivity, and provider track record.

---

## Who We Serve

We start in **design, consulting, coaching, and event planning** — categories where buyers have intent but not specs, outcomes are verifiable, and the scoping gap is widest.

| Persona | Description |
|---------|-------------|
| **Outcome Owner** | Time-starved person trying to move an urgent, underspecified outcome forward |
| **Capacity Operator** | Established freelancers and agencies hitting a fulfillment ceiling |
| **Emerging Operator** | Reskilled workers packaging transferable skills into paid work |
| **Specialist-in-Waiting** | Domain experts wanting flexibility without building a full business |
| **Apprentice Builder** | Students, new grads, and career starters |
| **Functional Collaborator** | People pulled into workflows for approvals, edits, handoffs — the growth loop |
| **Transitioning Portfolio Worker** | Workers turning unstable income into structured, repeatable work |

The first user is the **Outcome-Capacity Operator** — an AI-native portfolio worker juggling multiple income streams who needs messy intent turned into scoped, trusted, completed work, whether buying or selling that week.

---

## The Moat

The defensible asset is the accumulated **language of getting work done through others**: scoping patterns, decomposition templates, routing intelligence, handoff logic, and evaluation calibration. Every completed job deposits operational memory that makes the system smarter, stickier, and harder to replicate.

More jobs → richer reputation data → better routing → better outcomes → more buyer trust → more jobs. Data network effect, not scale effect.

What is **not** a moat: the buyer interface (replicable), the execution runtime (reliable but not proprietary), access to frontier models (commoditizing).

---

## The Business

**Pricing model:** Freemium base with a 5-20% take rate on completed work. Subscription tiers for agent allocation:

| Tier | Agents | Price |
|------|--------|-------|
| Starter | 40 agents/month | $20/month |
| Professional | 400 agents/month | $200/month |
| Enterprise | 4,000 agents/month | $1,000/month |
| Pay-as-you-go | Per agent | $0.80/agent |

Target: $1,000 ARR per active user across completed work and subscription revenue.

**Why this works:**
- Lower than Upwork (20%), Fiverr (20%), TaskRabbit (15%)
- Owning the full arc improves conversion — the highest-friction part of the buyer journey is eliminated
- Margins improve over time as scoping patterns get reused, decomposition templates compound, and first-match accuracy improves

---

## Phasing

### Phase 1: Pitch (complete)

Protocol design, six-layer architecture with governance, seven ADRs, layer implementation specs, working contract state machine with autonomy gates, persona-grounded scenarios, investor memo.

### Phase 2: Build (next)

Implementation on existing Aquarius backend. Contract state machine, capability cards, autonomy configuration, handoff protocol, demand-driven supply discovery, Bayesian reputation scoring.

### Phase 3: Open (future)

Formal open standard, SDKs, platform adapters, community governance.

---

*Aquarius is the programmable labor network — the infrastructure for how work gets done. Every completed job deposits operational memory that makes the system smarter, stickier, and harder to replicate. We are building the language of getting work done through others.*
