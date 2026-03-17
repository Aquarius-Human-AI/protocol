# ADR-005: Payment and Value Exchange Model

**Date:** 2026-03-16
**Status:** Accepted
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

Payment is where the protocol gets concrete and where investors zoom in. Three dimensions were discussed:

### 1. Fee Structure

Options considered:
- Subscription (flat monthly)
- Low transaction fee (~5%)
- Free for humans, charge agents/platforms for API access
- Freemium (AI facilitation free, delegation premium)

### 2. Payment Triggers

Options considered:
- On contract acceptance (upfront)
- On milestone completion (escrow-based)
- On outcome verification (results-based)
- Hybrid per contract type

### 3. Non-Monetary Value Exchange

Rosa M. (community organizer) provides expert-level navigation help but "would feel weird charging." The protocol needs to accommodate people who create value but don't think in dollar terms.

## Decision

### Fee Structure
**Low transaction fee (~5%).** Andrew's vision: "Eventually our outcome/work-done rails could be similar to Stripe but an abstraction level higher." Stripe abstracted payment complexity; AWP abstracts work complexity. The fee is the business model, but the protocol is the moat.

### Payment Triggers
**The protocol supports all trigger types.** This is necessary because:
- External platform bridging requires matching their payment models (Fiverr = milestone, Upwork = hourly, etc.)
- Different cultures/regions have different norms
- Different contract types have different risk profiles (prepay for commodities, escrow for custom work, results-based for outcomes)

The protocol defines the trigger types; the contract specifies which one applies.

### Non-Monetary Exchange
**Yes, supported.** Options include:
- "Pay what you want" (Bandcamp model)
- Reputation/credit systems
- Reciprocal services
- Community credits

This is important for the "growing self-worth, not just net worth" narrative and for serving underserved communities where dollar pricing creates barriers.

## Rationale

Andrew: "We're trying to help users grow their self-worth and net worth, not just their bank account."

The Stripe analogy is the investor pitch: Stripe made it possible for any developer to accept payments. AWP makes it possible for any person or agent to contract for work. The 5% fee is how Aquarius captures value; the protocol itself is what creates it.
