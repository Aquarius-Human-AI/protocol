# Alex's Upwork Migration

**Persona:** Alex C., 32, Austin, TX
**Role:** Provider (primarily), Facilitator autonomy
**Outcome:** Migrate freelance copywriting business from Upwork to better economics

> *"I've earned $180K on Upwork in three years. They take 20%. I'm done."*

Alex is a successful freelance copywriter who has built a strong reputation on Upwork — 47 completed contracts, a 98% satisfaction rate, and a Top Rated badge. But Upwork's 20% fee on the first $500 of each contract is eating into her margins. She's heard about Aquarius and wants to bring her reputation with her, not start from zero.

This scenario shows the provider side of the protocol — how Alex's Upwork track record becomes an PLN Capability Card, how confidence bootstraps for new participants, and what her first contract looks like from the other side of the state machine.

---

## Alex's Identity Record

```
Identity Record
├── id: "alex-c"
├── type: human
├── auth: { method: "email+oauth", verified: true }
├── trust_level: platform-verified  (bootstrapped from Upwork verification)
├── autonomy_setting: facilitator
├── delegation_chain: []
├── preferences:
│   ├── communication_style: "professional, async text preferred"
│   ├── language: "en"
│   ├── timezone: "America/Chicago"
│   └── accessibility_needs: []
└── risk_profile:
    ├── max_auto_commit_value: 500  (USD)
    ├── restricted_categories: []
    └── approval_rules: { review_all_proposals: true }
```

Alex chose Facilitator because she wants to review every client before accepting work. She's not going to let an AI commit her time to a bad client — she's been burned by scope creep too many times. She wants help managing her pipeline, but she decides who she works with.

---

## Building the Capability Card from Upwork

When Alex connected her Upwork account, the platform adapter imported her professional history into an PLN Capability Card.

### What the Upwork Adapter Extracted

```
Upwork Profile (raw)
├── Title: "Brand Copywriter & Content Strategist"
├── Rate: $75/hr
├── Total Earned: $182,400
├── Jobs Completed: 47
├── Success Score: 98%
├── Top Rated Badge: yes
├── Categories: Copywriting, Brand Strategy, Content Marketing
├── Skills: Website Copy, Email Campaigns, Brand Voice, SEO Content
└── Recent feedback: 4.9/5.0 (last 12 months)
```

### What Became the Capability Card

```
Capability Card
├── participant_id: "alex-c"
├── skills:
│   ├── { name: "website-copywriting", category: "content", proficiency: "expert" }
│   ├── { name: "email-campaigns", category: "marketing", proficiency: "expert" }
│   ├── { name: "brand-voice-development", category: "branding", proficiency: "expert" }
│   └── { name: "seo-content", category: "content", proficiency: "intermediate" }
├── modalities: ["text", "video"]
├── confidence: 0.78  (NOT 0.98 — see below)
├── constraints:
│   ├── { type: "availability", description: "max 3 active contracts" }
│   └── { type: "scope", description: "no technical/API documentation" }
├── availability:
│   ├── schedule: "weekdays, async with 24hr response time"
│   ├── timezone: "America/Chicago"
│   └── response_time_estimate: "within 24 hours"
├── pricing: { model: "hourly", min: 65, max: 85, currency: "USD" }
├── performance:
│   ├── contracts_completed: 47  (imported)
│   ├── completion_rate: 0.98  (imported)
│   ├── avg_satisfaction: 4.9  (imported)
│   └── dispute_rate: 0.0  (imported)
└── version: { last_updated: "2026-03-01", change_log: ["Imported from Upwork"] }
```

### Why Confidence is 0.78, Not 0.98

Alex's Upwork success rate is 98%. But her PLN confidence score is 0.78. This is intentional and important.

**Confidence is platform-adjusted.** PLN applies a discount to imported scores because:

1. **Platform context differs.** Upwork's rating system, client base, and dispute resolution are different from PLN's. A 98% on Upwork doesn't mean 98% on PLN.
2. **No PLN track record yet.** Alex has never completed a contract on this platform. Imported scores are evidence, not proof.
3. **Confidence earns its way up.** After Alex completes her first few PLN contracts successfully, her confidence will rise. The imported score sets a strong starting point — a brand-new provider without imports starts at 0.50.

The formula: `base_confidence = imported_score * platform_discount_factor`. For Upwork (a well-known, structured platform), the discount factor is 0.80. For less-structured platforms, it would be lower.

**What Alex sees:** "Your Upwork reputation gives you a head start. Complete a few jobs here and you'll be at the top of search results."

**What the protocol tracks:** Confidence 0.78 with provenance: "imported from Upwork, 47 contracts, 98% success, platform-verified."

---

## Fee Transparency

This is why Alex is here. The economics:

| | Upwork | PLN |
|---|--------|-----|
| Hourly rate | $75 | $75 |
| Platform fee | 20% (first $500) / 10% / 5% | 5% flat |
| Alex earns on a $750 job | $637.50 | $712.50 |
| Alex earns on a $2,000 job | $1,750 | $1,900 |
| Annual difference (at $60K) | ~$51,000 net | ~$57,000 net |

That's roughly $6,000 more per year in Alex's pocket at the same volume. The fee structure is part of the protocol — visible to both parties, not hidden in terms of service.

---

## Alex's First Contract as Provider

A buyer named Sarah posted a need: "I need website copy for my new bakery. About 5 pages — home, about, menu, catering, contact."

The matching algorithm found Alex and two other candidates. Alex appeared with high confidence because of her imported track record and the exact category match (website copywriting).

### State: INTENT (buyer side)
Sarah described her need. The AI structured it.

### State: REQUIREMENTS
```
Requirements
├── description: "Website copy for artisan bakery — 5 pages"
├── acceptance_criteria:
│   ├── "Home, About, Menu, Catering, and Contact pages completed"
│   ├── "Brand voice: warm, artisanal, community-focused"
│   ├── "SEO-optimized for local search (Austin, TX)"
│   └── "Two rounds of revisions included"
├── category: "content/website-copywriting"
└── constraints: { timeline: "2 weeks", budget: "$500-750" }
```

### State: MATCHING
Alex appeared as the top match:

```
Match Candidate (Alex)
├── confidence_score: 0.78
├── match_reasoning: "Expert website copywriter, 47 completed projects,
│                     strong brand voice portfolio. Local to Austin."
├── uncertainty_flags: ["New to platform — no PLN-native reviews yet"]
├── estimated_price: "$675 (9 hours at $75/hr)"
└── estimated_timeline: "10 business days"
```

### State: PROPOSAL
The AI presented Alex and two others to Sarah. Sarah selected Alex based on portfolio samples (linked from the Capability Card).

### State: NEGOTIATION
Terms proposed to Alex:

**AI to Alex:** "New project opportunity: website copy for a bakery in Austin, 5 pages, $675 budget, 2-week timeline. Want to see the details?"

**Alex:** "Show me."

**AI presented:** Full requirements, acceptance criteria, timeline, and the buyer's profile (Sarah, new bakery, first contract on platform).

**Alex:** "This is a good fit. I'd want to see some examples of the brand direction before I start. Can we add a kickoff call?"

The AI relayed Alex's request to Sarah. Sarah agreed. Terms updated to include a 30-minute kickoff call before writing begins.

### State: NEGOTIATION to ACTIVE — Alex's Facilitator Gate

**Triggered by:** AI agent (terms finalized)
**Autonomy gate: BLOCKED** (Facilitator mode — Alex reviews before committing)

**AI:** "Terms are set. $675 for 5 pages, kickoff call first, 2 revision rounds, 2-week delivery. Accept this contract?"

**Alex:** "Yes, let's go."

**Autonomy gate result: APPROVED**

```
State History Entry
├── state: ACTIVE
├── timestamp: "2026-03-05T09:30:00Z"
├── triggered_by: "alex-c"  (provider approved)
└── autonomy_gate_result: approved
```

### State: ACTIVE

From Alex's perspective, the Execution Plan looks different than Dorothy's. Alex is the one doing the work:

```
Execution Plan
├── tasks:
│   ├── Task 1: "Kickoff call with Sarah" — assigned: alex-c — status: complete
│   ├── Task 2: "Draft 5 pages" — assigned: alex-c — status: complete
│   ├── Task 3: "Revision round 1" — assigned: alex-c — status: complete
│   ├── Task 4: "Revision round 2" — assigned: alex-c — status: complete
│   └── Task 5: "Final delivery" — assigned: alex-c — status: complete
```

No handoff records for this contract — Alex handled everything herself. The AI's role was coordination: reminders, milestone tracking, and keeping Sarah informed.

### State: VERIFICATION
**Triggered by:** Alex (submitted final copy)

Sarah reviewed the pages. The AI checked acceptance criteria:
- Five pages delivered (verified)
- Brand voice matches brief (Sarah confirmed: "This sounds exactly like us")
- SEO optimized (AI verified: target keywords present, meta descriptions included)
- Two revision rounds completed (tracked in execution plan)

### State: COMPLETE
**Triggered by:** Sarah (confirmed satisfaction)

Payment of $675 processed. Alex received $641.25 ($675 minus 5% platform fee).

**Alex's Capability Card updated:**
- contracts_completed: 48
- confidence: 0.81 (up from 0.78 — one successful PLN-native contract)
- completion_rate: maintained at 0.98

Three more successful contracts and Alex's confidence will be above 0.90, putting her at the top of matching results for her categories.

---

## The Provider Experience

Most marketplace documentation focuses on buyers. Here is what Alex's day-to-day looks like as a provider on PLN:

**Pipeline view (what Alex sees):**
- 2 active contracts (bakery copy, SaaS email campaign)
- 1 proposal pending her review (e-commerce product descriptions)
- 0 disputes

**What the protocol manages for her:**
- Matching algorithm surfaces relevant opportunities
- AI handles scheduling and client communication logistics
- Milestone tracking keeps projects on timeline
- Payment triggered automatically on verified completion
- Reputation builds with every contract, increasing match priority

**What Alex controls (Facilitator mode):**
- She reviews every proposal before accepting
- She sets her own rates and availability
- She defines her scope constraints (no API docs)
- She decides when to mark work as delivered

Alex doesn't need the AI to do her writing. She needs it to do the business overhead — finding clients, managing contracts, handling payments — so she can focus on the work itself. At 5% instead of 20%.

---

## Summary

| What Alex Experienced | Protocol Reality |
|----------------------|-----------------|
| "I imported my Upwork profile" | Platform adapter created Capability Card, confidence discounted to 0.78 |
| "A bakery job came to me" | Matching algorithm ranked her as top candidate |
| "I reviewed the terms and said yes" | Facilitator gate blocked at commitment, Alex approved |
| "I did the work and got paid" | 5-task execution plan, evidence-based verification, payment on completion |
| "I kept $641 of $675" | 5% fee vs. Upwork's $112.50 on the same job |
| "My profile is already improving" | Confidence: 0.78 to 0.81 after first contract |
