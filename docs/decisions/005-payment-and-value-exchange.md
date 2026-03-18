# ADR-005: Payment, Pricing, and Value Exchange

**Date:** 2026-03-17
**Status:** Accepted (replaces 2026-03-16 version)
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

Payment is where the protocol gets concrete and where investors zoom in. Three dimensions to decide:

### 1. Fee Structure

Options considered:
- Subscription (flat monthly)
- Low transaction fee (~5%)
- Free for humans, charge agents/platforms for API access
- Freemium (AI facilitation free, delegation premium)
- Subscription access to specialized agents (premium capability tiers)

### 2. Pricing Model per Contract

Options considered:
- Fixed price (agreed upfront, immutable)
- Per-unit (price × quantity, scope-variable)
- Time-capped (hourly with a ceiling)
- Outcome-contingent (pay only if verified complete)

### 3. Non-Monetary Value Exchange

Rosa M. (community organizer, South Bronx) provides expert-level benefits navigation but "would feel weird charging." She creates real, measurable value — completed outcomes, reputation earned, community trust built — but doesn't operate in dollar terms. The protocol needs to accommodate this without treating it as a special case or an afterthought.

## Decision

### Fee Structure: Transaction Fee + Specialized Agent Subscriptions

Andrew's vision: "Eventually our outcome/work-done rails could be similar to Stripe but an abstraction level higher." Stripe abstracted payment complexity (any developer could accept payments in 7 lines of code); AWP abstracts work complexity (any person or agent can contract for work regardless of whether the other party is human or AI).

The business model has two components:

**1. Transaction fee (~5%)** on every job flowing through the network. This is the baseline — the fee applies to all contracts regardless of who executes them. The protocol is the moat; the fee is how we capture value from it.

**2. Subscription access to specialized agents.** Not all AI workers are equal. As the capability index (Layer C) accumulates performance data, certain agents will emerge as demonstrably superior within specific domains — a tax preparation agent with a 0.97 quality score across 2,000 returns, a medical coding agent trained on specific payer rules, a legal document review agent with jurisdiction-specific expertise. These are not commodity compute; they are specialized workers with verified track records.

Buyers can access these agents on a subscription basis — a recurring fee for priority access, guaranteed availability, and reserved capacity. This mirrors how professional service relationships work: a business on retainer with a trusted advisor, not a one-off marketplace transaction.

The subscription model also benefits agents: predictable revenue, committed buyers, and a deeper dataset from long-running relationships that further compounds their reputation scores.

**Revenue model summary:**

| Stream | Trigger | Who Pays |
|--------|---------|----------|
| Transaction fee (~5%) | Every completed contract | Buyer |
| Specialized agent subscription | Monthly/annual retainer | Buyer |

The two streams are complementary: the transaction fee monetizes breadth (the long tail of all work); subscriptions monetize depth (premium access to the best workers in specific domains). As the labor graph matures, the subscription tier becomes increasingly defensible — the agents with 5,000 verified completions cannot be replicated by a new entrant overnight.

### Pricing Hook in the Outcome Schema (Layer A)

Each work contract carries a pricing hook as part of the Outcome Schema. The protocol supports four types:

| Type | Description | When to Use |
|------|-------------|-------------|
| `fixed` | Single agreed price, immutable | Dorothy's gutter cleaning: $180, done |
| `per_unit` | Price × quantity, quantity variable | Harold's car diagnoses: $20/diagnosis |
| `time_capped` | Hourly rate with a maximum | Alex's copywriting projects: $75/hr, max 10 hrs |
| `outcome_contingent` | Pay only on verified completion | Ahmed's tax filing: pay when return is filed and accepted |

The pricing hook is set when the contract is created and becomes immutable once the contract moves past `NEGOTIATION`. Amendments require creating a new contract version.

### Payment Triggers: All Types Supported

The protocol supports all standard trigger types. This is necessary because:
- External platform bridging requires matching their models (Fiverr = milestone, Upwork = hourly)
- Different cultures and regions have different norms around prepayment vs. results-based payment
- Different contract types have different risk profiles: prepay for low-cost commodities, escrow for custom work, results-based for high-stakes outcomes

| Trigger | Mechanism | Example |
|---------|-----------|---------|
| `on_acceptance` | Payment on contract acceptance | Low-cost, commodity tasks |
| `on_milestone` | Escrow released at defined checkpoints | Ahmed's taxes: release on draft approval, then on filing |
| `on_completion` | Payment released when VERIFICATION passes | High-value outcomes where results matter |
| Hybrid | Multiple triggers per contract | Rosa's fellowship review: partial upfront, balance on delivery |

### Routing Optimization and Price

Layer C (Capability + Routing Index) optimizes across a three-dimensional efficiency surface per worker-skill pair: cost, speed, and quality. The pricing hook and contract budget are inputs to this optimization. A buyer who sets `outcome_contingent` pricing selects for workers with high completion rates and quality scores — the routing algorithm surfaces this automatically. A buyer optimizing for speed gets a different candidate set than one optimizing for quality at a given price.

This means pricing is not just a transaction detail — it's a routing signal that feeds directly into which workers the network considers for each job.

### Non-Monetary Exchange: Fully Supported

$0 contracts are valid protocol contracts. They move through the same state machine, generate the same handoff records, and build reputation in exactly the same way as paid contracts.

Rosa's scenario demonstrates this on both sides:
- **As provider:** Her benefits navigation sessions use pay-what-you-want pricing ($0–$50). A client who pays nothing still completes the contract, still triggers reputation update, still counts toward her completed job total.
- **As buyer:** Her fellowship review from a Columbia MSW alum costs $175 via Agent mode with a $150 auto-approve cap. When the commitment exceeds the cap, the protocol requires human confirmation — same gate logic as any other risk-threshold crossing.

Non-monetary forms the protocol supports:
- Pay-what-you-want (Bandcamp model) — buyer sets price after delivery
- Reputation/credit systems — community credits redeemable for future services
- Reciprocal services — contract A and contract B settled against each other
- Community credits — local exchange trading system integration

This matters for the "growing self-worth and net worth, not just your bank account" narrative. Many of the highest-value people in underserved communities — navigators, connectors, translators — don't charge for their work but create enormous value. The protocol treats their contributions as economically real even when no money changes hands.

## Rationale

Andrew: *"We're trying to help users grow their self-worth and net worth, not just their bank account."*

The Stripe analogy anchors the investor pitch. The non-monetary exchange model anchors the mission. Both are necessary: the 5% fee is how we build a sustainable business; supporting $0 contracts is how we serve the communities that need this most.
