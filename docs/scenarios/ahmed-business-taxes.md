# Ahmed's Business Taxes

**Persona:** Ahmed F., 44, Somali refugee, Minneapolis
**Role:** Buyer
**Autonomy:** Facilitator ("Help me do this, but ask before committing")
**Outcome:** "Get small business taxes filed correctly"

> *"I need help but I need to understand what is happening. I do not sign things I cannot read."*

Ahmed owns a small grocery store in the Cedar-Riverside neighborhood of Minneapolis. Tax season is stressful — his English is strong enough for daily business but not for IRS forms. He was burned once by a preparer who didn't understand halal business expenses. He needs a bilingual accountant who gets his community, and he needs to understand every step before he commits.

That's what Facilitator mode is for.

---

## Ahmed's Identity Record

```
Identity Record
├── id: "ahmed-f"
├── type: human
├── auth: { method: "email", verified: true }
├── trust_level: community-verified
├── autonomy_setting: facilitator
├── delegation_chain: []
├── preferences:
│   ├── communication_style: "clear, simple English"
│   ├── language: "so,en"  (Somali primary, English secondary)
│   ├── timezone: "America/Chicago"
│   └── accessibility_needs: ["esl-friendly"]
└── risk_profile:
    ├── max_auto_commit_value: 500  (USD)
    ├── restricted_categories: []
    └── approval_rules: { require_written_summary: true }
```

Ahmed chose Facilitator during onboarding. The AI asked: "Would you like me to find people and set things up for you, or would you prefer to review options and decide yourself?" Ahmed said: "You find, I decide." The AI understood this as Facilitator — Ahmed wants help with discovery and structure, but he approves every commitment.

---

## The Contract: Tax Preparation

Ahmed told the AI: "I need someone to do my business taxes. Last year was bad — the person did not understand my business."

### State: INTENT
**Triggered by:** AI agent, from Ahmed's request
**Autonomy gate:** Auto (Facilitator mode, non-commitment transition)

The AI began structuring Ahmed's need. Through conversation, it surfaced important details:

**AI:** "What kind of business do you run?"
**Ahmed:** "Grocery store. Halal products, some import."
**AI:** "What went wrong last year?"
**Ahmed:** "He did not know halal certification is business expense. I had to pay more."
**AI:** "Would you prefer someone who speaks Somali?"
**Ahmed:** "Yes, very much. Or at least someone who knows our community."

### State: REQUIREMENTS
**Triggered by:** AI agent
**Autonomy gate:** Auto (Facilitator — discovery phases are automatic)

```
Requirements
├── description: "Small business tax preparation — grocery/import business
│                with halal product lines"
├── acceptance_criteria:
│   ├── "Federal and state business tax returns filed"
│   ├── "Halal certification costs properly categorized as business expenses"
│   ├── "All documents explained to buyer before signing"
│   └── "Available for follow-up questions for 30 days after filing"
├── category: "financial-services/tax-preparation"
├── tags: ["small-business", "import", "halal", "esl-friendly"]
└── constraints:
    ├── language_preference: "Somali preferred, bilingual required"
    ├── budget: "$250-350"
    ├── location: "Minneapolis metro or remote"
    └── cultural_fit: "experience with East African business community"
```

Notice the constraint structure. "Cultural fit" isn't a checkbox on Upwork. AWP's matching system treats it as a first-class signal because it came directly from Ahmed's expressed needs and past negative experience.

### State: MATCHING
**Triggered by:** AI agent
**Autonomy gate:** Auto

The matching request went to the Capability layer with specific constraints:

```
Matching Request
├── requirements: (structured above)
├── buyer_preferences:
│   ├── trust_factors: ["community-verified", "somali-community"]
│   ├── communication: "esl-friendly, simple English, patient"
│   └── cultural_fit: "East African business community experience"
├── constraints:
│   ├── budget: { min: 250, max: 350, currency: "USD" }
│   ├── language: ["so", "en"]
│   └── location: "Minneapolis metro or remote"
└── context: { negative_history: "prior preparer mishandled halal expenses" }
```

**Matching considerations and uncertainty flags:**

The algorithm found three candidates, each with different trade-offs:

| Candidate | Confidence | Price | Community Trust | Uncertainty Flags |
|-----------|-----------|-------|-----------------|-------------------|
| Amina Hassan, CPA | 0.91 | $300 | Somali-American, Cedar-Riverside office | "Availability limited to evenings" |
| Midwest Tax Pro | 0.68 | $250 | No community signals | "No evidence of halal expense experience" |
| H&R Block (platform adapter) | 0.45 | $280 | National chain | "ESL support uncertain, no cultural match" |

The community trust signal is the differentiator here. Amina's Capability Card includes:

```
Capability Card (Amina Hassan)
├── participant_id: "amina-h"
├── skills:
│   ├── { name: "small-business-tax", category: "financial", proficiency: "expert" }
│   └── { name: "import-business-tax", category: "financial", proficiency: "intermediate" }
├── modalities: ["in-person", "video", "phone"]
├── confidence: 0.91
├── constraints:
│   ├── { type: "language", description: "Fluent Somali and English" }
│   └── { type: "community", description: "Member of Cedar-Riverside business network" }
├── availability: { schedule: "evenings and weekends", timezone: "America/Chicago" }
├── pricing: { model: "fixed", min: 250, max: 400, currency: "USD" }
├── performance: { contracts_completed: 23, completion_rate: 0.96, avg_satisfaction: 4.9, dispute_rate: 0 }
```

Amina is community-verified through the Somali Business Association — a trust signal that no national platform can replicate. Her confidence score reflects both her professional competence and the cultural fit that matters to Ahmed.

### State: PROPOSAL
**Triggered by:** Matching algorithm
**Autonomy gate:** Auto

The AI presented the top candidate to Ahmed:

**AI:** "I found Amina Hassan — she's a CPA in Cedar-Riverside who speaks Somali. She specializes in small business taxes and charges $300. She's available evenings. Would you like to hear about the other options too?"

**Ahmed:** "Cedar-Riverside? She is Somali?"
**AI:** "Yes, she's part of the Somali Business Association and has done taxes for 23 businesses in the community."
**Ahmed:** "That is good. What about the others?"
**AI:** "There's a general tax service at $250, but they don't have experience with halal business expenses. And H&R Block at $280, but no Somali language support."
**Ahmed:** "No, Amina sounds right. $300 is okay."

### State: NEGOTIATION
**Triggered by:** AI agent (Ahmed selected Amina)
**Autonomy gate:** Auto

The AI reached out to Amina with Ahmed's requirements. Amina confirmed:
- $300 fixed fee for business tax preparation
- She'll need Ahmed's books, receipts, and prior year return
- First meeting: Tuesday evening at her Cedar-Riverside office
- She'll explain every form before Ahmed signs

Terms were straightforward — no negotiation needed.

### State: NEGOTIATION to ACTIVE — The Facilitator Gate

**Triggered by:** AI agent (terms agreed between parties)
**Autonomy gate: BLOCKED** (Facilitator mode requires human approval at commitment)

This is where Facilitator mode earns its name. The AI cannot auto-advance to ACTIVE. It must ask Ahmed.

**AI:** "Everything looks good with Amina. Here's the summary before I confirm:"

**AI presented:**
- **Who:** Amina Hassan, CPA, Cedar-Riverside
- **What:** Business tax preparation (federal + state)
- **Cost:** $300 flat fee
- **When:** First meeting Tuesday at 6pm
- **Terms:** She explains everything before you sign. 30 days of follow-up included.

**Ahmed:** "This is clear. Yes, go ahead."

**Autonomy gate result: APPROVED** (human confirmed)

```
State History Entry
├── state: ACTIVE
├── timestamp: "2026-02-12T10:15:00Z"
├── triggered_by: "ahmed-f"  (human approval)
└── autonomy_gate_result: approved
```

In Delegate mode, this would have been automatic. In Advisor mode, Ahmed would have also needed to confirm the requirements and matching phases. Facilitator is the middle ground: the AI does the legwork, Ahmed makes the decisions that involve his money and his signature.

### State: ACTIVE
**What happens during execution:**

The AI created an Execution Plan:

```
Execution Plan
├── tasks:
│   ├── Task 1: "Gather documents" — assigned: ahmed-f — status: complete
│   ├── Task 2: "First meeting — review and preparation" — assigned: amina-h — status: complete
│   ├── Task 3: "Prepare returns" — assigned: amina-h — status: in_progress
│   ├── Task 4: "Review meeting — explain all forms" — assigned: amina-h — status: pending
│   └── Task 5: "File returns" — assigned: amina-h — status: blocked_by: [task-4]
```

No handoff record was needed here — Amina handles the work directly. The AI's role during ACTIVE is monitoring progress and keeping Ahmed informed.

**AI to Ahmed (week 2):** "Amina finished preparing your returns. She'd like to meet Thursday to walk through everything before filing. Does 6pm work?"

### State: VERIFICATION
**Triggered by:** Amina (marked work complete after filing)
**Autonomy gate:** Auto

Amina filed the returns and confirmed completion. The acceptance criteria were checked:
- Federal and state returns filed (confirmed by Amina, evidence: e-file confirmation)
- Halal certification properly categorized (Ahmed confirmed during review meeting)
- All documents explained before signing (Ahmed confirmed)
- 30-day follow-up window active

### State: VERIFICATION to COMPLETE — The Second Facilitator Gate

**Triggered by:** AI agent
**Autonomy gate: BLOCKED** (Facilitator mode requires human approval for completion)

**AI:** "Amina has filed your returns. Everything on the checklist is done. Are you satisfied with the work?"

**Ahmed:** "Yes, she was very good. She explained everything. Even the halal certification — she knew exactly what to do."

**Autonomy gate result: APPROVED**

### State: COMPLETE

Payment of $300 processed. Both parties' records updated:
- Ahmed: first completed contract, positive experience logged
- Amina: 24th completed contract, satisfaction maintained at 4.9

---

## What the ESL-Friendly Matching Accomplished

Traditional marketplaces would have shown Ahmed a search results page. He would have typed "tax preparer Minneapolis," received 200 results, and had no way to filter for Somali-speaking, halal-familiar, community-trusted accountants.

AWP's matching treated Ahmed's language, cultural context, and past negative experience as first-class inputs — not afterthoughts. The community-verified trust signal (Somali Business Association) carried weight that no star rating could match.

The Facilitator autonomy level meant Ahmed stayed in control of every commitment while the AI handled the parts that would have been hardest for him: searching, evaluating, and structuring the engagement in clear terms.

---

## Summary

| What Ahmed Experienced | Protocol Reality |
|-----------------------|-----------------|
| "I told them what I needed and what went wrong before" | Requirements structured with cultural constraints and negative history |
| "They found someone from my community" | Matching algorithm weighted community trust signals and language |
| "I understood everything before agreeing" | Facilitator gate blocked NEGOTIATION to ACTIVE until human approved |
| "She explained the forms to me" | Acceptance criteria included explanation requirement |
| "I said it was good" | Facilitator gate blocked VERIFICATION to COMPLETE until human confirmed |
| "It cost $300, fair price" | Budget constraint ($250-350) respected in matching |

Two autonomy gates fired. Both were commitment transitions. Both required Ahmed to say yes. Everything else — the searching, the structuring, the scheduling — happened automatically. Facilitator mode: "You find, I decide."
