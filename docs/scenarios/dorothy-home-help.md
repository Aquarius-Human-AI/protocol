# Dorothy's Home Help

**Persona:** Dorothy H., 71, widowed, rural Wisconsin
**Role:** Buyer
**Autonomy:** Delegate ("Handle it, just keep me posted")
**Outcome:** "Get reliable home help"

> *"My husband always handled this stuff. I just need someone I can count on."*

Dorothy doesn't want to manage contractors. She doesn't want to compare quotes on websites. She wants her gutters cleaned, her thermostat figured out, and someone to teach her how to use her iPad. She wants to say what she needs and have it taken care of.

That's what Delegate mode is for.

---

## Dorothy's Identity Record

```
Identity Record
├── id: "dorothy-h"
├── type: human
├── auth: { method: "email", verified: true }
├── trust_level: community-verified
├── autonomy_setting: delegate
├── delegation_chain: []  (Dorothy is the principal — no one delegated to her)
├── preferences:
│   ├── communication_style: "patient, simple language"
│   ├── language: "en"
│   ├── timezone: "America/Chicago"
│   └── accessibility_needs: ["large-text", "phone-preferred"]
└── risk_profile:
    ├── max_auto_commit_value: 200  (USD)
    ├── restricted_categories: ["financial", "legal", "medical"]
    └── approval_rules: { notify_on_commit: true }
```

Dorothy set her autonomy to Delegate during onboarding, when the AI asked: "When I find someone to help, would you like me to go ahead and book them, or check with you first?" Dorothy said, "Just go ahead, honey. I trust you."

Her risk profile caps automatic commitments at $200. Anything above that, the AI will still ask. This isn't because Dorothy requested it — the protocol applies a sensible default based on her income bracket and the Delegate setting. She can adjust it, but she hasn't needed to.

---

## The Outcome

Dorothy told the AI: "I need help around the house. My husband always took care of things and now I'm behind on everything."

The AI created an Outcome and, through conversation, identified three distinct needs:

```
Outcome
├── id: "outcome-dorothy-home"
├── owner: "dorothy-h"
├── description: "Get reliable home help"
├── contracts: ["contract-gutters", "contract-thermostat", "contract-ipad"]
├── status: active
└── progress: { total: 3, completed: 1, in_progress: 1, blocked: 0 }
```

**What Dorothy sees:** "You've got 3 things on your list. Gutters are done! We're working on the thermostat, and I have a few questions about the iPad help."

**What the protocol tracks:** Three independent contracts, each with its own state machine, participants, and lifecycle.

---

## Contract 1: Gutter Cleaning (COMPLETE)

This contract has gone through every state in the happy path. Here is every transition, who triggered it, and what happened at each autonomy gate.

### State: INTENT
**Triggered by:** AI agent, parsing Dorothy's conversation
**Autonomy gate:** Auto (Delegate mode, non-commitment transition)

Dorothy mentioned the gutters during her initial conversation. The AI identified this as a discrete, actionable need and created a contract in INTENT state. Dorothy didn't see anything change — the AI was still just chatting with her.

### State: REQUIREMENTS
**Triggered by:** AI agent
**Autonomy gate:** Auto

The AI structured the requirements from the conversation:

```
Requirements
├── description: "Clean gutters on single-story ranch house"
├── acceptance_criteria:
│   ├── "All gutters cleared of debris"
│   ├── "Downspouts flowing freely"
│   └── "Provider confirms visual inspection"
├── category: "home-maintenance"
├── constraints: { location: "Baraboo, WI", access: "no ladder needed, single story" }
```

**What Dorothy sees:** Nothing yet. The AI is working in the background.

### State: MATCHING
**Triggered by:** AI agent
**Autonomy gate:** Auto

The Capability layer searched for providers matching these requirements. In rural Wisconsin, the candidate pool is small. The matching algorithm considered:
- Location (within 30 miles of Baraboo)
- Category (home maintenance / gutter cleaning)
- Modality (in-person required)
- Availability (within 2 weeks)

### State: PROPOSAL
**Triggered by:** Matching algorithm (automatic on results)
**Autonomy gate:** Auto

Two candidates returned:

| Candidate | Confidence | Price | Uncertainty Flags |
|-----------|-----------|-------|-------------------|
| Mike's Handyman Service | 0.87 | $85 | "Limited reviews (new to platform)" |
| GutterPro Madison | 0.72 | $150 | "45-minute drive — may charge travel fee" |

### State: NEGOTIATION
**Triggered by:** AI agent (selected Mike based on confidence, price, and proximity)
**Autonomy gate:** Auto

The AI selected Mike and confirmed terms: $85 fixed price, available next Tuesday at 2pm. No negotiation was needed — Mike's listed rate was within Dorothy's budget and the AI accepted it.

### State: ACTIVE
**Triggered by:** AI agent
**Autonomy gate:** Auto (Delegate mode, $85 is under the $200 auto-commit cap)

This is the commitment point. In Facilitator mode, the AI would have asked Dorothy to approve. In Delegate mode at $85, it went straight through.

**What Dorothy sees:** "Good news! Mike from Mike's Handyman Service is coming Tuesday at 2pm to clean your gutters. It'll be $85."

**What the protocol tracks:** The contract is now ACTIVE. An Execution Plan was created:

```
Execution Plan
├── contract_id: "contract-gutters"
├── tasks:
│   ├── Task 1: "Schedule appointment" — assigned: ai-agent — status: complete
│   ├── Task 2: "Clean gutters" — assigned: handyman-mike — status: pending
│   └── Task 3: "Confirm completion" — assigned: ai-agent — status: blocked_by: [task-2]
```

#### Handoff: AI to Handyman Mike

When the contract went ACTIVE, a handoff occurred — the AI can't physically clean gutters.

```
Handoff Record #1
├── from: "ai-agent"
├── to: "handyman-mike"
├── reason: capability_boundary
├── context_transferred:
│   ├── summary: "Single-story ranch, all gutters need cleaning. Homeowner is
│   │            elderly — please be patient and introduce yourself."
│   ├── key_decisions: ["Tuesday 2pm confirmed", "$85 fixed price"]
├── context_lost: ["Dorothy's full conversation history", "Other home help needs"]
├── delegation_chain: ["dorothy-h", "ai-agent"]
└── timestamp: "2026-03-10T14:30:00Z"
```

Mike received: the address, the scope, the price, and a note about being patient with Dorothy. He did not receive Dorothy's full chat history or information about her other contracts. That's intentional — data minimization.

### State: VERIFICATION
**Triggered by:** AI agent (after Mike reported completion)
**Autonomy gate:** Auto

Mike cleaned the gutters and marked the job complete in the system. The AI sent Dorothy a message: "Mike says the gutters are all done! Everything look good to you?"

Dorothy replied: "Looks great, tell him thank you."

The verification method was self-report (low-risk, community-verified provider). Dorothy's confirmation elevated it to buyer-confirmed.

### State: COMPLETE
**Triggered by:** AI agent (Dorothy confirmed satisfaction)
**Autonomy gate:** Auto (Delegate mode, verification confirmation)

Payment of $85 triggered. Mike's Capability Card updated: one more completed contract, completion rate maintained at 100%.

**What Dorothy sees:** "Gutters are done! I've paid Mike $85. One down, two to go."

**What the protocol tracks:** Full state history with 8 transitions, 1 handoff record, 1 execution plan with 3 completed tasks, payment processed.

---

## Contract 2: Thermostat Help (MATCHING)

Dorothy mentioned that her thermostat "does something weird in the morning." The AI created a contract, but this one is still early in its lifecycle.

**Current state:** MATCHING

The AI structured requirements during the INTENT and REQUIREMENTS phases (both auto-approved in Delegate mode). The challenge: "thermostat help" is ambiguous. It could be:
- A smart thermostat that needs programming (tech support)
- A malfunctioning thermostat (HVAC repair)
- A thermostat that's working correctly but Dorothy doesn't understand the schedule (tutoring)

The AI asked Dorothy a clarifying question: "When you say it does something weird, do you mean the temperature changes on its own, or the screen shows something you don't understand?"

Dorothy: "The screen shows all these little numbers and I just want it to be 68 in the morning."

This narrowed it to: someone who can program or explain a programmable thermostat. The matching algorithm is now searching with constraints:

```
Matching Request
├── requirements: "Program or explain programmable thermostat"
├── buyer_preferences: { patience: "high", communication: "in-person or phone" }
├── constraints: { location: "Baraboo, WI", category: "tech-support-home" }
└── context: { prior_contracts: ["contract-gutters — positive experience with Mike"] }
```

**Matching considerations:**
- Could Mike do this? He's a handyman, not tech support. The AI considers it but his Capability Card doesn't include thermostat programming. Confidence: 0.3.
- Is there a local tech support service? The pool is very thin in rural WI.
- Could this be done remotely via video call? Dorothy prefers in-person, but this is a fallback the matching algorithm flags.

**Uncertainty flags:** "Limited local candidates for this niche. Video support is a viable fallback if in-person match not found."

---

## Contract 3: iPad Tutoring (INTENT)

Dorothy also said: "My daughter got me this iPad and I can barely turn it on."

This contract is still in INTENT state. The AI is refining requirements through conversation:

**AI:** "What would you most like to do on your iPad? Call your daughter? Read? Watch shows?"

**Dorothy:** "I just want to FaceTime with my grandkids. And maybe read my email."

The AI is building structured requirements from this conversation. It hasn't yet transitioned to REQUIREMENTS because it's still gathering information — Dorothy tends to reveal needs gradually, and the AI is patient (matching her communication style preference).

**What Dorothy sees:** A friendly conversation about what she'd like to learn.

**What the protocol tracks:** A contract in INTENT state with partial requirements being assembled.

---

## Summary: What Dorothy Experiences vs. What the Protocol Tracks

| Dorothy's Experience | Protocol Reality |
|---------------------|-----------------|
| "I chatted about what I need" | 1 Outcome created, 3 Contracts initialized |
| "Someone came and cleaned my gutters" | Contract #1: 8 state transitions, 1 handoff, 3 execution tasks |
| "They're figuring out the thermostat thing" | Contract #2: in MATCHING with uncertainty flags |
| "We're still talking about the iPad" | Contract #3: in INTENT, requirements being refined |
| "I didn't have to do anything" | 7 autonomy gates evaluated, all auto-approved |
| "It just worked" | Delegation chain tracked, context transferred, data minimized |

Dorothy never sees the word "contract." She never sees a state machine. She never approves a transition. She told someone what she needed, and it's getting handled. That's the Delegate experience.

But under the surface, every decision is tracked, every handoff is documented, and every commitment was evaluated against her risk profile. If something goes wrong — if Mike overcharges, if the thermostat person is rude, if the iPad tutor doesn't show up — the protocol has the full history to resolve it.

That's the point. The protocol does the bookkeeping so Dorothy doesn't have to.
