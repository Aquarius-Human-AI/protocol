# PLN Persona Scenarios

Real-world protocol walkthroughs using personas from the Aquarius simulation system.
Each scenario shows a complete journey through the protocol layers and contract states.

These scenarios serve two purposes:
1. **Investor pitch** — concrete examples of how PLN works for real people
2. **Protocol validation** — if a scenario breaks the protocol, it's a design bug

## User Taxonomy Mapping

Each persona maps to the PLN user taxonomy defined in the investor memo:

| Taxonomy Category | Description | Scenario Persona |
|-------------------|-------------|-----------------|
| **Outcome Owner** | Time-starved person with urgent, underspecified outcomes | Dorothy H., Ahmed F. |
| **Capacity Operator** | Established freelancers/agencies hitting a fulfillment ceiling | Alex C., Harold B. |
| **Emerging Operator** | Reskilled workers packaging transferable skills | — |
| **Specialist-in-Waiting** | Domain experts wanting flexibility without a full business | — |
| **Apprentice Builder** | Students, new grads, career starters | — |
| **Functional Collaborator** | People pulled into workflows for approvals/handoffs (growth loop) | Rosa M. (partial) |
| **Transitioning Portfolio Worker** | Workers turning unstable income into structured work | Rosa M. (partial) |

The five scenario personas stress-test the protocol across the taxonomy. Future scenarios should cover Emerging Operators, Specialists-in-Waiting, and Apprentice Builders as PLN expands beyond the initial wedge.

## Scenarios

| Scenario | Persona | Taxonomy | Autonomy | Key Protocol Features |
|----------|---------|----------|----------|----------------------|
| [Dorothy's Home Help](dorothy-home-help.md) | Dorothy H. (71, rural WI) | Outcome Owner | Delegate | Multi-contract outcome, full AI delegation, handoff tracking |
| [Ahmed's Business Taxes](ahmed-business-taxes.md) | Ahmed F. (44, Minneapolis) | Outcome Owner | Facilitator | ESL matching, cultural trust signals, human-approved commitments |
| [Alex's Upwork Migration](alex-upwork-migration.md) | Alex C. (32, Austin) | Capacity Operator | Facilitator | Reputation portability, fee comparison, provider-side experience |
| [Rosa's Community Exchange](rosa-community-exchange.md) | Rosa M. (34, South Bronx) | Both | Agent | Non-monetary value, pay-what-you-want, dual-role protocol |
| [Harold's Car Diagnosis](harold-car-diagnosis.md) | Harold B. (70, rural AR) | Capacity Operator | Delegate | 3-level delegation chain, family-assisted model |

## How to Read These

Each scenario includes:

- **Identity Record** — who the person is in protocol terms
- **Capability Card** — what they can do (providers) or what they need (buyers)
- **Contract state transitions** — every state change, who triggered it, which autonomy gates fired
- **Handoff records** — when and why work transferred between participants
- **Two perspectives** — what the user sees vs. what the protocol tracks

Scenarios are written for a non-technical audience. Protocol details are included inline, formatted as structured records, but the narrative is always primary.

## Wedge Product Context

All scenarios take place in or adjacent to PLN's wedge categories: **design, consulting, coaching, and event planning** — categories where buyers have intent but not specs, outcomes are verifiable, and the scoping gap is widest.

## Related Documents

- [Layer Specs](../specs/) — implementation specifications per layer
- [Decision Records](../decisions/) — architectural reasoning
- [PLN Investor Memo](../pln-memo.md) — full market thesis and user taxonomy
