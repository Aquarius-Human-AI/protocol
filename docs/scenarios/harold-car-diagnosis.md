# Harold's Car Diagnosis

**Persona:** Harold B., 70, rural Arkansas
**Role:** Provider
**Autonomy:** Delegate (managed through a 3-level delegation chain)

> *"I've been fixing cars since before computers were in 'em. I can tell you what's wrong just by listening."*

Harold is a retired master mechanic with 45 years of experience. He can diagnose most car problems by description alone — "it makes a knocking sound when I turn left" gets a precise answer in under five minutes. But Harold doesn't use computers, doesn't have a smartphone, and isn't going to learn. His grandson Jake set him up on Aquarius, and the AI handles everything Harold can't (or won't) touch.

This scenario shows the protocol's delegation chain — three levels deep, fully tracked, and transparent to the buyer.

---

## The Delegation Chain

```
Harold (principal)
  └── Jake (grandson, tech proxy)
        └── AI Agent (scheduling, communication, contract management)
```

Harold told Jake what he's willing to do. Jake set up the profile and configured the AI. The AI manages day-to-day operations. Each level of delegation is explicit in the protocol.

---

## Harold's Identity Record

```
Identity Record
├── id: "harold-b"
├── type: human
├── auth: { method: "phone-verified", verified: true }  (Jake verified on Harold's behalf)
├── trust_level: community-verified
├── autonomy_setting: delegate
├── delegation_chain: []  (Harold is the principal — he delegates outward, not inward)
├── preferences:
│   ├── communication_style: "plain spoken, no jargon"
│   ├── language: "en"
│   ├── timezone: "America/Chicago"
│   └── accessibility_needs: ["no-text", "phone-only"]
└── risk_profile:
    ├── max_auto_commit_value: 100  (USD)
    ├── restricted_categories: ["in-person-visits"]  (Harold diagnoses remotely only)
    └── approval_rules: { delegate_to: "jake-b" }
```

### Jake's Identity Record (Tech Proxy)

```
Identity Record
├── id: "jake-b"
├── type: human
├── auth: { method: "email", verified: true }
├── trust_level: platform-verified
├── autonomy_setting: facilitator  (Jake reviews things Harold can't)
├── delegation_chain: ["harold-b"]  (acting on behalf of Harold)
├── preferences:
│   ├── communication_style: "text, quick responses"
│   ├── language: "en"
│   ├── timezone: "America/Chicago"
│   └── accessibility_needs: []
└── risk_profile:
    ├── max_auto_commit_value: 100  (USD, matching Harold's cap)
    └── restricted_categories: ["in-person-visits"]
```

### AI Agent Identity Record

```
Identity Record
├── id: "ai-agent-harold"
├── type: agent
├── auth: { method: "api-key", verified: true }
├── trust_level: platform-verified
├── autonomy_setting: delegate  (AI operates at Delegate within Harold's bounds)
├── delegation_chain: ["harold-b", "jake-b"]
├── preferences: (inherited from Harold)
└── risk_profile: (inherited from Harold, enforced by Jake's Facilitator gates)
```

The delegation chain is the key: `["harold-b", "jake-b"]`. This means the AI agent was authorized by Jake, who was authorized by Harold. Any participant interacting with this agent can trace authority back to Harold.

---

## Harold's Capability Card

```
Capability Card
├── participant_id: "harold-b"
├── skills:
│   ├── { name: "car-diagnosis", category: "automotive", proficiency: "master" }
│   ├── { name: "engine-troubleshooting", category: "automotive", proficiency: "master" }
│   ├── { name: "transmission-diagnosis", category: "automotive", proficiency: "expert" }
│   └── { name: "electrical-diagnosis", category: "automotive", proficiency: "expert" }
├── modalities: ["phone", "video"]  (no in-person, no text)
├── confidence: 0.95
├── constraints:
│   ├── { type: "family-assisted", description: "Scheduling handled by grandson Jake" }
│   ├── { type: "modality", description: "Phone or video call only — no text, no in-person" }
│   └── { type: "scope", description: "Diagnosis only — does not perform physical repairs" }
├── availability:
│   ├── schedule: "mornings, Central time"
│   ├── timezone: "America/Chicago"
│   └── response_time_estimate: "within 24 hours (scheduled by AI via Jake)"
├── pricing: { model: "fixed", min: 15, max: 25, currency: "USD" }
├── performance:
│   ├── contracts_completed: 47
│   ├── completion_rate: 0.98
│   ├── avg_satisfaction: 4.8
│   └── dispute_rate: 0.0
└── version: { last_updated: "2026-03-15", change_log: [] }
```

Harold's confidence is 0.95 — nearly as high as it gets. He's completed 47 diagnoses through the platform, virtually all successful. His constraints are strict: phone or video only, diagnosis only, mornings only. The protocol enforces these during matching — Harold never appears as a candidate for in-person repair work or evening availability.

---

## A Contract: Walter's Truck Problem

Walter, 55, lives two towns over. His pickup truck is making a grinding noise when braking. His regular mechanic quoted $800 for a brake job, but Walter isn't sure that's the right diagnosis.

### What the Buyer Sees

Walter told the AI: "My truck grinds when I brake. My mechanic says I need new brakes but I want a second opinion before I spend $800."

The AI found Harold's profile. What Walter sees:

> **Harold's Auto Diagnosis**
> Master mechanic, 45 years experience. Phone or video consultation.
> 47 diagnoses completed, 4.8 rating.
> $20 flat fee. *Managed by AI.*

That last line — "Managed by AI" — is the delegation chain made visible. Walter knows he's getting Harold's expertise, but the scheduling and logistics are handled by technology. He doesn't need to know about Jake.

### State: INTENT
**Triggered by:** AI agent, from Walter's request
**Autonomy gate:** Auto (Walter is at Facilitator mode on the buyer side)

### State: REQUIREMENTS
```
Requirements
├── description: "Second opinion on truck brake diagnosis"
├── acceptance_criteria:
│   ├── "Verbal diagnosis of likely brake issue based on symptoms"
│   ├── "Assessment of whether $800 brake job quote is reasonable"
│   └── "Recommendation on next steps"
├── category: "automotive/diagnosis"
└── constraints: { modality: "phone or video", urgency: "within 1 week" }
```

### State: MATCHING
Harold was the top match. In rural Arkansas, he may be the only remote car diagnosis provider, but his 0.95 confidence and master-level proficiency made the match strong regardless.

```
Match Candidate
├── confidence_score: 0.95
├── match_reasoning: "Master mechanic, brake diagnosis expertise, phone available,
│                     47 successful diagnoses"
├── uncertainty_flags: ["Diagnosis only — cannot verify in person"]
├── estimated_price: "$20"
└── estimated_timeline: "24-48 hours"
```

### State: PROPOSAL to NEGOTIATION
Terms: $20 flat fee, 15-minute phone call, scheduled within 48 hours. Straightforward — no negotiation needed.

### State: NEGOTIATION to ACTIVE — The Delegation Chain in Action

**On Walter's side (buyer):** Walter is at Facilitator mode. The AI asked: "Harold can do a phone diagnosis for $20 within 48 hours. Want to proceed?" Walter: "Yes."

**On Harold's side (provider):** This is where the delegation chain operates.

The AI agent (authorized by Jake, authorized by Harold) evaluated the contract:
- Category: automotive diagnosis (within Harold's scope)
- Modality: phone (Harold's preferred)
- Price: $20 (within normal range)
- Schedule: morning slot available day after tomorrow

The AI auto-committed Harold because his Delegate setting and the $20 price (well under the $100 cap) allowed it.

But the AI didn't just commit — it scheduled through the delegation chain:

```
Handoff Record #1
├── from: "ai-agent-harold"
├── to: "jake-b"
├── reason: delegation
├── context_transferred:
│   ├── summary: "New diagnosis request — truck brake grinding.
│   │            Suggested Thursday 9am. Need Jake to confirm Harold's availability."
│   └── key_decisions: ["$20 flat fee", "Phone call", "15 minutes"]
├── context_lost: ["Walter's full conversation history"]
├── delegation_chain: ["harold-b", "jake-b", "ai-agent-harold"]
└── timestamp: "2026-03-12T15:00:00Z"
```

```
Handoff Record #2
├── from: "jake-b"
├── to: "harold-b"
├── reason: delegation
├── context_transferred:
│   ├── summary: "Grandpa, you've got a call Thursday at 9. Guy named Walter,
│   │            his truck grinds when braking. He wants to know if the $800
│   │            brake job quote is right."
│   └── key_decisions: ["Thursday 9am", "15 minutes", "$20"]
├── context_lost: ["Contract details", "Walter's identity record", "Matching scores"]
├── delegation_chain: ["harold-b", "jake-b"]
└── timestamp: "2026-03-12T18:30:00Z"
```

Notice how the context simplifies at each level. The AI sent Jake structured contract details. Jake told Harold in plain language: who, when, and what the problem is. Harold doesn't need to know about matching scores or autonomy gates. He needs to know there's a call Thursday about brakes.

### State: ACTIVE

Thursday morning. Harold picks up the phone.

**Harold:** "This is Harold. I hear you've got a grinding noise when you brake."
**Walter:** "Yes sir. Left front, mainly. Gets worse going downhill."
**Harold:** "Left front only? How long since your last brake job?"
**Walter:** "Maybe three years. 40,000 miles."
**Harold:** "And your mechanic said full brake job, $800?"
**Walter:** "That's what he quoted."
**Harold:** "At 40,000 miles, you probably do need pads. But grinding on just the left side — that could be a stuck caliper, not worn pads. If it's the caliper, pads alone won't fix it, and if he's only doing pads, you'll be back in six months. Tell him to check the caliper slide pins before he does anything. If the caliper's stuck, the job's different — more like $400 for a caliper replacement plus pads on that side."

Eleven minutes. Harold nailed it.

### State: VERIFICATION
**Triggered by:** AI agent (Harold's call completed)
**Autonomy gate:** Auto

Verification method: self-report. Harold told Jake the call went fine. The AI logged it.

The acceptance criteria check:
- Verbal diagnosis provided (Harold identified likely stuck caliper)
- Assessment of $800 quote (Harold said it's potentially wrong diagnosis)
- Next steps recommended (check caliper slide pins before proceeding)

### State: COMPLETE
**Triggered by:** AI agent
**Autonomy gate:** Auto (Delegate mode, $20, self-report verification)

Walter was satisfied. He followed Harold's advice, and the mechanic found a stuck caliper — exactly as Harold predicted. The actual repair was $350, saving Walter $450.

Payment of $20 processed. Harold's record updated: 48 completed diagnoses.

**What Harold experienced:** Jake told him there was a call at 9. He picked up the phone, talked about brakes for 11 minutes, and hung up. That's it.

**What the protocol tracked:**

```
Contract State History
├── INTENT      → triggered_by: ai-agent       → gate: auto
├── REQUIREMENTS → triggered_by: ai-agent       → gate: auto
├── MATCHING    → triggered_by: ai-agent       → gate: auto
├── PROPOSAL    → triggered_by: matching-algo   → gate: auto
├── NEGOTIATION → triggered_by: ai-agent       → gate: auto
├── ACTIVE      → triggered_by: ai-agent       → gate: auto (delegate, $20)
├── VERIFICATION → triggered_by: ai-agent       → gate: auto
└── COMPLETE    → triggered_by: ai-agent       → gate: auto
```

Eight transitions. Three participants in the delegation chain. Two handoff records. Zero human approvals needed (Delegate mode at $20). One 11-minute phone call that saved someone $450.

---

## The Family-Assisted Model

Harold's scenario demonstrates a pattern that no existing marketplace supports: family-assisted service provision.

Traditional platforms require the service provider to manage their own profile, respond to messages, handle scheduling, and process payments. Harold can't do any of that. On Upwork or Fiverr, Harold's 45 years of expertise would be inaccessible.

PLN's delegation chain makes it work:

| Responsibility | Who Handles It | How |
|---------------|---------------|-----|
| Expertise | Harold | Phone calls — the only thing Harold does |
| Profile setup | Jake | Created Capability Card, set constraints |
| Scheduling | AI (via Jake) | AI proposes times, Jake confirms with Harold |
| Client communication | AI | Pre-call context, post-call follow-up |
| Payment | AI | Direct deposit to Harold's bank (Jake set up) |
| Quality tracking | AI | Performance metrics, satisfaction scores |

Harold's entire technology interaction: answering a phone call that Jake told him about. Everything else is delegated. And the delegation is fully transparent — Walter saw "Managed by AI," and the full chain is available if anyone asks.

---

## Summary

| What Happened | Who Did It | Protocol Layer |
|--------------|-----------|---------------|
| Walter described his problem | Walter + AI | INTENT (Contract) |
| Requirements structured | AI | REQUIREMENTS (Contract) |
| Harold matched as top candidate | AI (Matching) | MATCHING (Capability) |
| Terms set at $20 | AI | NEGOTIATION (Contract) |
| Jake confirmed Harold's Thursday availability | Jake | Handoff (Execution) |
| Jake told Harold about the call | Jake | Handoff (Execution) |
| Harold diagnosed the stuck caliper | Harold | ACTIVE (Execution) |
| AI confirmed completion | AI | VERIFICATION (Contract) |
| Walter paid $20 | Protocol | COMPLETE (Contract) |

Three people, one AI agent, two handoff records, zero technology required from Harold. Master-level expertise, accessible to anyone with a phone, at $20. The protocol made the connection possible. The delegation chain made it practical.
