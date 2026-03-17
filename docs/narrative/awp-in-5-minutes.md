# The Aquarius Work Protocol (AWP) in 5 Minutes

> *The operating system for agent-powered services.*

---

## The Problem

Every service marketplace today -- Fiverr, Upwork, TaskRabbit, Thumbtack -- was built
for the same interaction: one human posts a job, another human bids on it. They
negotiate, someone does the work, someone pays. That model is about to break. AI agents
can now browse websites, fill out forms, compare quotes, and manage projects. But there
is no shared language for how an AI agent hires a handyman, how a freelancer's
reputation travels between platforms, or how a 71-year-old widow in rural Wisconsin
gets her gutters cleaned when she can barely use a smartphone. The current
infrastructure assumes humans on both sides. The moment you introduce AI -- as a buyer,
a seller, or a go-between -- the whole system falls apart. There is no contract format
an agent can read, no way to verify work was done, no framework for deciding what the
agent should handle versus what needs a human touch.

## The Insight

Work needs a protocol, the same way payments needed Stripe. Before Stripe, accepting a
credit card online meant negotiating with banks, managing PCI compliance, and writing
thousands of lines of integration code. Stripe abstracted all of that into seven lines
of code. The result: any developer could accept payments, and an entire economy of
internet businesses followed. AWP does the same thing one level up. Stripe abstracted
payments; AWP abstracts work -- defining what needs to be done, finding who can do it,
managing the doing, and confirming it got done. The protocol works whether the
participants are humans, AI agents, external platforms, or any combination. It is the
missing infrastructure layer that makes agent-powered services possible.

---

## How It Works

AWP is organized into five layers. Each layer handles one job. Together, they take a
person from "I need help" to "that's done" -- whether the work involves cleaning
gutters, filing taxes, or migrating a freelance business.

![The Five-Layer Architecture](../specs/diagrams/layer-model.svg)

### Layer 1: Identity -- Who is participating?

Every participant -- human, AI agent, or external platform -- gets an Identity Record.
It answers three questions: Who are you? How much do you trust the system? And how much
should the system do on your behalf?

When Dorothy, a 71-year-old widow in Appleton, Wisconsin, signs up, her Identity Record
notes that she prefers phone calls over text, needs simple English, and wants the AI to
handle nearly everything. When her AI agent later contacts a local handyman, that
handyman's Identity Record shows he is a verified local provider. The protocol treats
both of them as first-class participants.

The Identity layer also tracks delegation. Dorothy's grandson helped her set up the
account. The AI agent acts on Dorothy's behalf. The full chain -- Dorothy authorized her
grandson, who configured the AI, which is now hiring providers -- is recorded and
transparent. No one ends up unknowingly negotiating with a bot.

### Layer 2: Capability -- What can each participant do?

Every participant registers what they can do through Capability Cards -- a structured
profile of skills, availability, pricing, and track record. A handyman's card might
list gutter cleaning, basic plumbing, and thermostat installation. An AI agent's card
might list web research, form filling, and appointment scheduling.

The key difference from a marketplace profile: confidence is earned, not claimed. A new
provider starts with a baseline score. Every completed job adjusts it up or down. An AI
agent's confidence comes from measured task pass rates -- we literally test what it can
do and record the results.

When Dorothy says "I need help around the house," the protocol's matching system
searches Capability Cards for providers near Appleton who can do home maintenance,
communicate patiently, and work within her budget. It returns candidates ranked by
confidence, with honest flags about uncertainty: "This handyman has a 0.92 confidence
score for gutter cleaning. Note: he's only available on weekdays."

### Layer 3: Execution -- How does the work get done?

Once a contract is agreed upon, the Execution layer breaks it into tasks, assigns them,
and tracks progress. For simple jobs, this is one task. For complex goals, the AI
creates a task tree -- parallel or sequential work items with clear handoff points.

![The Handoff Protocol](../specs/diagrams/handoff-protocol.svg)

Handoffs are where most service experiences fall apart. You explain your problem to one
person, get transferred, and have to start over. AWP tracks every handoff explicitly.
When Dorothy's gutter contract moves from the AI (which found and scheduled the
provider) to the handyman (who does the physical work), the handoff record captures what
context was transferred, what was summarized, and what was lost. If Dorothy later says
"I already mentioned the loose railing," the system knows what happened.

Five things trigger a handoff: a capability boundary (the AI cannot climb a ladder), a
confidence drop (the AI is not sure what to do next), an autonomy gate (the next step
costs more than the user pre-approved), an explicit delegation (the user asks someone
else to take over), or a platform boundary (the work must happen on Fiverr or another
external site).

### Layer 4: Contract -- The agreement between two parties

The Contract layer is the heart of the protocol. A Work Contract captures what needs to
be done, who is doing it, what "done" looks like, and when payment happens. Every
contract follows the same lifecycle, regardless of whether the parties are human, AI, or
a mix:

**Intent** -- someone expresses a need in plain language.
**Requirements** -- the AI extracts structured requirements and acceptance criteria.
**Matching** -- the system finds candidates.
**Proposal** -- candidates are ranked and presented.
**Negotiation** -- terms are discussed and adjusted.
**Active** -- work begins.
**Verification** -- deliverables are checked against acceptance criteria.
**Complete** -- criteria met, payment released.

![Contract State Machine](../specs/diagrams/contract-state-machine.svg)

The same state machine handles Dorothy hiring a handyman, a freelancer migrating her
Upwork clients, and one AI agent subcontracting research to another. The rules are
identical. What changes is the autonomy setting -- how much human approval is required
at each step. More on that below.

### Layer 5: Outcome -- The goal the human actually cares about

Users never see contracts. They see Outcomes -- goals expressed in their own words.
Dorothy's outcome is "get reliable home help." That single goal decomposes into three
separate contracts: gutter cleaning (scheduled for Tuesday), thermostat programming
(two candidates found), and iPad tutoring (still figuring out what she needs). The
Outcome layer tracks progress across all of them and reports back in language Dorothy
understands.

![Dorothy's Full Scenario](../specs/diagrams/dorothy-scenario.svg)

This is where the AI earns its keep. It identifies needs Dorothy did not explicitly
state ("my husband always handled the gutters" implies a home maintenance gap). It
prioritizes by urgency. It manages dependencies between contracts. And it communicates
progress at Dorothy's pace, in Dorothy's style.

---

## Real People, Real Outcomes

### Dorothy -- "I need help around the house"

Dorothy is 71, lives alone in rural Wisconsin, and her late husband handled everything
around the house. She tells Aquarius she needs help, speaking naturally the way she
would to a neighbor. The AI agent parses her words into three contracts: gutter
cleaning, thermostat programming, and someone to teach her how to use her iPad. It
finds a verified local handyman for the first two, schedules the work for Tuesday when
her granddaughter can be there, and locates a patient tech tutor who does home visits.
Dorothy never opens a browser, never compares bids, never reads a terms of service.
She gets a phone call confirming the schedule and a text from her grandson saying
everything looks good.

### Alex -- "I want to leave Upwork without starting over"

Alex is a 32-year-old freelance copywriter who built a strong reputation on Upwork over
five years. She is tired of the 20% fee on her first $500 with each client and wants
to move her business to better economics -- but she cannot afford to lose her reviews,
her client relationships, or her search ranking. She sets her autonomy to Facilitator
mode: the AI handles discovery and structuring, but Alex approves every commitment. The
protocol imports her verified work history into a Capability Card, preserving her track
record. It creates contracts with her existing clients on new terms -- same work, lower
fees, portable reputation. Alex reviews and approves each one. Her five years of earned
trust travel with her.

### Ahmed -- "I need an accountant who speaks Somali"

Ahmed is a 44-year-old Somali refugee in Minneapolis who runs a small cleaning business.
Tax season is coming, and he needs an accountant -- but not just any accountant. He
needs someone who understands immigrant small business taxes, speaks Somali (or at
least works well through simple English), and who he can trust. Ahmed's community
mosque has vouched for a Somali-American CPA on the platform. The protocol's matching
system weighs that community trust signal heavily alongside professional credentials.
It finds the CPA, flags that she is only available evenings, and presents Ahmed with a
clear proposal. The contract includes milestone-based payment so Ahmed only pays as
each tax form is completed. His AI agent handles the scheduling and document gathering.
Ahmed focuses on running his business.

---

## The Autonomy Model

This is the part that changes how you think about AI-powered services.

When you open a brokerage account, you choose an investment strategy. Conservative: the
advisor shows you options, you make every decision. Balanced: the advisor manages your
portfolio within agreed parameters, you approve big moves. Aggressive: the advisor has
broad discretion, you review quarterly. You are not choosing how smart the advisor is
-- you are choosing how much latitude to give them based on your comfort with risk.

AWP works the same way. Every user chooses an autonomy level:

**Advisor** -- "Show me options, I decide everything." The AI researches and recommends.
The user clicks every button. Best for: people who want control, power users learning
the system.

**Facilitator** -- "Help me do this, but ask before spending my money." The AI handles
discovery, structures contracts, and presents options. The user approves commitments.
Best for: professionals like Alex who want efficiency without giving up control.

**Agent** -- "Handle it within these bounds." The AI commits to contracts within
pre-set limits -- say, up to $200 per job, only in home maintenance. Anything outside
those bounds gets escalated. Best for: busy people with clear needs and defined budgets.

**Delegate** -- "Take care of it, keep me posted." The AI manages end-to-end. The user
gets updates but is never blocked from progress. Best for: people like Dorothy who want
results without managing the process.

Here is the critical nuance: autonomy is not a blank check. Even at Delegate level, the
protocol calculates a risk score for every action. A $50 gutter cleaning auto-executes.
A $5,000 kitchen renovation triggers a confirmation, even for a Delegate user. The
system weighs the dollar amount, whether the action can be undone, how sensitive the
category is, and the provider's track record. Just like an aggressive investment fund
does not put everything in one stock, Delegate mode does not approve everything
blindly.

This is how you build trust with vulnerable users. Dorothy does not need to understand
contracts or state machines. She just needs to know that Aquarius will handle things
the way her husband used to -- competently, within reason, and with a call if something
big comes up. The autonomy model makes that possible without compromising safety.

Users are growing their self-worth and net worth, not just their bank accounts.

---

## Why Now

Three things are converging:

**AI agents are production-ready.** Not research demos -- production systems that
browse the web, fill out forms, compare quotes, and execute multi-step tasks. Our own
agent, AquaBot, passes 84% of its capability benchmarks across 12 task categories. The
technology works. What is missing is the infrastructure to make it useful for ordinary
people.

**Marketplaces have not adapted.** Fiverr, Upwork, TaskRabbit, and Thumbtack were built
for human-to-human transactions. None of them have a protocol for agent participation,
portable reputation, or configurable autonomy. They are adding AI features -- chatbots,
smart matching, generated descriptions -- but bolting AI onto a human-only protocol is
like adding a turbocharger to a horse. The architecture needs to be different.

**The window is narrow.** The company that defines how AI agents participate in service
work will set the standard. Payment protocols (Stripe), identity protocols (OAuth),
and communication protocols (HTTP) all followed the same pattern: first mover defines
the spec, everyone else implements it. AWP is positioned to be that first mover for
work. Every month without a work protocol is a month where agent-powered services grow
more fragmented, more siloed, and harder to unify.

---

## The Business

**Revenue model:** ~5% transaction fee on work completed through the protocol. This is
the Stripe model applied to work, not payments. Stripe charges a percentage of every
payment it processes. AWP charges a percentage of every contract it facilitates --
whether that contract is between two humans, a human and an agent, or two agents.

**Why 5% works:**
- Lower than Upwork (20% on first $500), Fiverr (20%), and TaskRabbit (15%)
- Competitive with Stripe's 2.9% + 30 cents, but at a higher abstraction layer
- Applies to every transaction the protocol touches, including agent-to-agent work

**Stripe-for-work positioning:** Stripe did not build a store. It built the payment
rails that every store uses. AWP is not building a marketplace. It is building the work
rails that every marketplace -- and every AI agent -- can use. The protocol is the
product. The platform is the reference implementation.

**Network effects compound in three ways:**
1. More providers create better matches, which attract more buyers
2. More completed contracts produce more performance data, which improves matching
3. More platform adapters (Fiverr, Upwork, etc.) expand the supply without Aquarius
   having to recruit providers directly

The long-term endgame: AWP becomes the default protocol for agent-powered work, the
way HTTP became the default protocol for web communication. Aquarius captures value by
running the reference implementation and charging the transaction fee. Third parties
build on the protocol and expand the ecosystem.

---

## Phasing

### Phase 1: Pitch (current)

What is done:
- Full protocol design specification with five-layer architecture
- Five architectural decision records documenting the reasoning behind key choices
- Four technical diagrams (layer model, contract state machine, handoff protocol,
  Dorothy scenario walkthrough)
- Machine-readable schema definitions for all protocol entities
- Working contract state machine with autonomy gate logic
- Persona-grounded scenarios walking real users through the full protocol

What this phase delivers: a clear, testable protocol design that investors can evaluate
and engineers can build from. Not slides -- working definitions and validated logic.

### Phase 2: Build

What comes next:
- Contract state machine integrated into the existing Aquarius backend
- Capability Cards built on the existing expert and listing infrastructure
- Autonomy level configuration added to user profiles
- Handoff protocol wired into AquaBot's task execution system
- Platform adapters for Fiverr and Upwork (bridging external marketplaces)

What this phase delivers: a working product where real users experience the protocol.
Dorothy can actually say "I need help around the house" and have contracts created,
providers matched, and work managed on her behalf.

### Phase 3: Open

What comes later:
- Formal specification published as an open standard (RFC-style)
- Contract Layer SDK for third-party integration
- Platform adapter framework so any marketplace can plug in
- Community governance model for protocol evolution

What this phase delivers: AWP becomes infrastructure that others build on. The protocol
escapes the product and becomes a standard.

---

*AWP is the operating system for agent-powered services. The protocol is designed,
the architecture is validated, and the team that built the agent is ready to build the
rails. What we need now is the capital to move from Phase 1 to Phase 2 -- from design
to product.*
