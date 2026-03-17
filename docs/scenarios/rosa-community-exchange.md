# Rosa's Community Exchange

**Persona:** Rosa M., 34, South Bronx, social worker in training
**Role:** Both buyer and provider
**Autonomy:** Agent ("Do it for me, within these bounds")

> *"Half the people in my building don't know what they're entitled to. I can help them, and maybe someone can help me too."*

Rosa is finishing her MSW (Master of Social Work) and works part-time as a community navigator — helping neighbors access benefits, fill out applications, and deal with bureaucracy. She doesn't charge market rates because her community can't afford it. At the same time, she needs help with her grad school application for a competitive fellowship.

This scenario shows two things no existing marketplace handles well: non-monetary value exchange, and a single person operating on both sides of the protocol simultaneously.

---

## Rosa's Identity Record

```
Identity Record
├── id: "rosa-m"
├── type: human
├── auth: { method: "email", verified: true }
├── trust_level: community-verified
├── autonomy_setting: agent
├── delegation_chain: []
├── preferences:
│   ├── communication_style: "direct, bilingual Spanish/English"
│   ├── language: "es,en"
│   ├── timezone: "America/New_York"
│   └── accessibility_needs: []
└── risk_profile:
    ├── max_auto_commit_value: 150  (USD)
    ├── restricted_categories: []
    └── approval_rules: {}
```

Rosa chose Agent mode. She's tech-savvy and busy — she doesn't want to approve every small thing, but she doesn't want to hand over the reins entirely. "Do it for me, within these bounds" fits her life: she trusts the AI to operate within her stated limits but isn't comfortable with full delegation.

---

## Rosa as PROVIDER: Benefits Navigation Service

### Rosa's Capability Card

```
Capability Card
├── participant_id: "rosa-m"
├── skills:
│   ├── { name: "benefits-navigation", category: "social-services", proficiency: "expert" }
│   ├── { name: "form-completion", category: "administrative", proficiency: "expert" }
│   └── { name: "housing-assistance", category: "social-services", proficiency: "intermediate" }
├── modalities: ["in-person", "phone", "video", "text"]
├── confidence: 0.88
├── constraints:
│   ├── { type: "location", description: "South Bronx and surrounding neighborhoods" }
│   └── { type: "language", description: "English and Spanish fluent" }
├── availability:
│   ├── schedule: "evenings and weekends"
│   ├── timezone: "America/New_York"
│   └── response_time_estimate: "same day"
├── pricing: { model: "pay-what-you-want", min: 0, max: 50, currency: "USD" }
├── performance:
│   ├── contracts_completed: 31
│   ├── completion_rate: 0.97
│   ├── avg_satisfaction: 4.9
│   └── dispute_rate: 0.0
└── version: { last_updated: "2026-03-10", change_log: [] }
```

The distinctive element: **pay-what-you-want pricing.** Rosa's min is $0 and her max is $50. Most of her clients pay nothing. Some leave $10 or $20. One grateful family paid $50 after Rosa helped them avoid eviction.

This is not charity — it's a deliberate service model. Rosa builds community trust and professional experience while serving people who can't access these services any other way. The protocol treats pay-what-you-want as a first-class pricing model, not a workaround.

### A Provider-Side Contract: Helping Mrs. Delgado

Mrs. Delgado, 62, needs help applying for SNAP benefits. She heard about Rosa through the building's tenant association.

**State: INTENT**
Mrs. Delgado told the AI: "I need help getting food stamps. Rosa from upstairs said she could help."

This is a direct referral — the matching phase will be short because the buyer already specified the provider.

**State: REQUIREMENTS**
```
Requirements
├── description: "SNAP benefits application assistance"
├── acceptance_criteria:
│   ├── "Application completed with all required documents"
│   ├── "Submitted to HRA (Human Resources Administration)"
│   └── "Applicant understands next steps and timeline"
├── category: "social-services/benefits-navigation"
└── constraints: { language: "Spanish preferred", location: "South Bronx" }
```

**State: MATCHING**
The matching algorithm confirmed Rosa as the match. Confidence: 0.88 (her established capability). No other candidates were considered because Mrs. Delgado specified Rosa.

**State: PROPOSAL to NEGOTIATION**
Terms: pay-what-you-want, Rosa available Saturday morning.

**State: NEGOTIATION to ACTIVE**
**Autonomy gate: AUTO** (Rosa is in Agent mode, and this is a $0-base-cost contract well within her risk profile)

Rosa's Agent mode means the AI can commit her to contracts that fit her stated parameters: benefits navigation, her neighborhood, within her schedule. She doesn't need to approve every Mrs. Delgado individually — the AI knows her bounds.

```
State History Entry
├── state: ACTIVE
├── timestamp: "2026-03-08T09:00:00Z"
├── triggered_by: "ai-agent"
└── autonomy_gate_result: auto
```

**State: ACTIVE**
Rosa met Mrs. Delgado Saturday morning at the building's community room. She helped gather documents, filled out the application, and submitted it online.

**State: VERIFICATION**
Rosa marked the contract complete. Verification method: self-report (low-value, community-verified provider). Mrs. Delgado confirmed: "She did everything. I understand what happens next."

**State: COMPLETE**
Mrs. Delgado chose to pay $0. The contract completed at $0 value. This is a valid, fully-tracked protocol completion — the same state machine, the same verification, the same performance update.

Rosa's Capability Card updated: contracts_completed: 32, confidence maintained at 0.88.

**The value Rosa received:** Not money, but a completed contract that builds her professional record. Thirty-one completed benefits navigation contracts at 97% completion rate is powerful evidence for her MSW application — and for future matching confidence.

---

## Rosa as BUYER: MSW Application Help

Now Rosa is on the other side. She needs help with her fellowship application — specifically, someone to review her personal statement and advise on the competitive fellowship at Columbia.

### State: INTENT
**Triggered by:** Rosa's request
**Autonomy gate:** Auto (Agent mode)

Rosa told the AI: "I need someone to review my MSW fellowship application. Specifically the personal statement. Columbia's deadline is April 15."

### State: REQUIREMENTS
```
Requirements
├── description: "MSW fellowship application review — personal statement
│                and application strategy"
├── acceptance_criteria:
│   ├── "Personal statement reviewed with detailed written feedback"
│   ├── "Application strategy advice specific to Columbia's fellowship"
│   └── "At least one revision cycle on the personal statement"
├── category: "education/application-consulting"
├── constraints:
│   ├── deadline: "2026-04-10 (5 days before submission)"
│   ├── budget: "$100-200"
│   └── expertise: "MSW program familiarity, preferably Columbia alumni"
```

### State: MATCHING

The matching request went out with Rosa's buyer preferences:

```
Matching Request
├── requirements: (structured above)
├── buyer_preferences:
│   ├── communication: "async text, direct feedback style"
│   └── expertise: "someone who's been through the MSW application process"
├── constraints:
│   ├── budget: { min: 100, max: 200, currency: "USD" }
│   └── timeline: "completed by April 10"
```

Results:

| Candidate | Confidence | Price | Uncertainty Flags |
|-----------|-----------|-------|-------------------|
| Dr. Priya Rao (Columbia MSW '22) | 0.85 | $175 | "Limited availability — teaching load" |
| GradCoach (platform adapter, Wyzant) | 0.62 | $120 | "Generic grad school advice, not MSW-specific" |

### State: PROPOSAL to NEGOTIATION
The AI presented Dr. Rao as the top candidate. Terms: $175 for personal statement review with one revision round, async over 2 weeks.

### State: NEGOTIATION to ACTIVE
**Autonomy gate: AUTO** (Agent mode, $175 is within Rosa's $150 max_auto_commit_value... actually, it's $25 over)

Wait. $175 exceeds Rosa's max_auto_commit_value of $150. The autonomy gate checks:

```
risk_score($175 commitment) > risk_tolerance(agent mode at $150 cap)
Result: BLOCKED
```

**AI to Rosa:** "I found Dr. Priya Rao — Columbia MSW alum, $175 for a full review and revision. This is slightly above your usual auto-approve limit. Want to go ahead?"

**Rosa:** "Yeah, that's fine. Go for it."

**Autonomy gate result: APPROVED** (human override)

This is the risk-modified autonomy in action. Agent mode doesn't mean unlimited automation — it means automation within bounds, with human override when bounds are exceeded. Rosa's $150 cap caught a $175 commitment. She approved it in seconds, but the protocol asked.

### State: ACTIVE

```
Execution Plan
├── tasks:
│   ├── Task 1: "Rosa sends personal statement draft" — assigned: rosa-m — status: complete
│   ├── Task 2: "Dr. Rao reviews and provides feedback" — assigned: dr-rao — status: complete
│   ├── Task 3: "Rosa revises based on feedback" — assigned: rosa-m — status: complete
│   ├── Task 4: "Dr. Rao reviews revision" — assigned: dr-rao — status: complete
│   └── Task 5: "Final feedback and strategy session" — assigned: dr-rao — status: complete
```

### State: VERIFICATION
Dr. Rao submitted her final feedback. The AI checked acceptance criteria:
- Detailed written feedback on personal statement (evidence: annotated document)
- Columbia-specific application strategy (evidence: strategy notes)
- One revision cycle completed (tracked in execution plan)

### State: COMPLETE
Rosa confirmed satisfaction. Payment of $175 processed ($166.25 to Dr. Rao after 5% fee).

---

## Both Sides in One Protocol

Here is what makes Rosa's scenario distinctive. Within the same protocol, using the same identity:

| Aspect | Rosa as Provider | Rosa as Buyer |
|--------|-----------------|---------------|
| Autonomy mode | Agent (same) | Agent (same) |
| Pricing model | Pay-what-you-want ($0-50) | Fixed ($175) |
| Typical contract value | $0-20 | $175 |
| Verification method | Self-report | Evidence-based |
| Matching | Direct referral (community) | Algorithm (capability match) |
| Value received | Reputation + community impact | Professional development |

Same identity record. Same autonomy setting. Same state machine. Different sides of the transaction.

Traditional marketplaces don't support this. On Fiverr, you're either a seller or a buyer — the interfaces and incentives are different. On Upwork, provider accounts and client accounts are separate experiences. Rosa would need to maintain two profiles, two reputations, two mental models.

In AWP, Rosa is one participant with one Identity Record. Her Capability Card describes what she can do. Her contracts describe what she needs. The protocol doesn't care which side she's on — the state machine works the same way.

---

## The Pay-What-You-Want Model

Rosa's pricing model raises a question: how does a $0 contract work in a protocol designed for paid work?

The protocol handles it cleanly:
- **Payment trigger:** on_completion (same as any contract)
- **Amount:** determined by buyer after verification (pay-what-you-want)
- **$0 is a valid payment.** The contract completes, performance records update, reputation builds.
- **Platform fee on $0:** $0. Aquarius takes 5% of nothing.

Why would the platform support free work? Because Rosa's 31 free contracts built a trust profile that makes her valuable to the ecosystem. When she becomes a licensed social worker, her AWP reputation — 31 completed contracts, 97% completion, community-verified — will be worth something. And the clients she helped? They're now familiar with the platform. Some will become buyers of paid services. Some will become providers themselves.

Community-level adoption doesn't start with transactions. It starts with trust.

---

## Future: Community Credits

The protocol design includes a future extension for community credits — a non-monetary reputation currency. Under this model, Rosa's free benefits navigation would earn credits that she could spend on other services within her community network.

This isn't implemented yet (Phase 3), but Rosa's scenario validates the protocol design. The state machine and verification system work at $0. Adding a credit layer on top is an extension, not a redesign.

---

## Summary

| What Rosa Experienced | Protocol Reality |
|----------------------|-----------------|
| "I helped Mrs. Delgado with SNAP" | Provider-side contract, pay-what-you-want, auto-approved in Agent mode |
| "She paid what she could ($0)" | Valid contract completion at $0, performance recorded |
| "I needed help with my own application" | Buyer-side contract, same identity, standard fixed pricing |
| "The AI found me a Columbia alum" | Matching weighted MSW-specific expertise and alumni status |
| "It asked me about the $175 — a little more than usual" | Agent mode gate caught amount over $150 cap, Rosa approved |
| "Same account, both sides" | One Identity Record, one autonomy setting, two contract roles |
