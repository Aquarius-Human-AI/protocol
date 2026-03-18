# Layer A — Outcome Schema & Work Contract: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-17
**Status:** Approved for implementation
**Dependencies:** ADR-002 (Contract-Centric with Outcome Layer), ADR-003 (Autonomy Levels as Risk Profiles)

---

## 1. Purpose

Layer A defines what "done" means. It provides:

1. A conversational intake agent that negotiates structured outcomes with consumers
2. Pydantic models for Outcomes, Work Contracts, and Acceptance Criteria
3. A contract state machine with transition validation
4. Event emission for downstream layers
5. Structural and semantic validation of outcome schemas

Layer A is a **moat layer** — every validated outcome schema makes future outcomes easier to specify, decompose, and price. Data accumulates for offline training; no runtime template matching in v1.

---

## 2. Scope

### In Scope (v1)

- Pydantic models: `Outcome`, `WorkContract`, `AcceptanceCriterion`, `SLA`, supporting types
- Contract state machine with legal transition enforcement
- Intake agent: conversational, consumer-facing, proposes acceptance criteria, produces finalized Outcome + Contract(s)
- Session persistence for intake conversations (resume support)
- Event emission: `outcome.created`, `contract.state_changed`, `contract.version_amended`
- Structural validation (Pydantic) + semantic validation (logical consistency checks)
- Autonomy level on Outcome and Contract with inheritance
- Cross-cutting governance interface for transition legality validation

### Deferred

- Nested/hierarchical outcomes (`parent_outcome_id` field included but no tree traversal, failure propagation, or progress rollup)
- Amendment versioning with structured diffs
- Template library / similarity search at intake time
- Multi-currency support (USD only)
- Dispute resolution logic (field stored here, logic in Layer D)
- LLM evaluation prompt authoring (criterion type stored here, evaluation logic in Layer E)

---

## 3. Data Models

All models use Pydantic v2 `BaseModel` with strict typing.

### 3.1 Enums

```python
class OutcomeStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETE = "complete"
    ABANDONED = "abandoned"

class OutcomeType(str, Enum):
    DELIVERABLE = "deliverable"          # Tangible output (report, website, artifact)
    STATE_CHANGE = "state_change"        # Real-world state transition (gutter cleaned, account opened)
    METRIC_TARGET = "metric_target"      # Measurable threshold (reduce costs by 20%)
    DECISION = "decision"                # Informed recommendation with options (which contractor to hire)

class ContractState(str, Enum):
    INTENT = "intent"
    REQUIREMENTS = "requirements"
    MATCHING = "matching"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    ACTIVE = "active"
    VERIFICATION = "verification"
    COMPLETE = "complete"
    DISPUTED = "disputed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    FAILED = "failed"

class CriterionType(str, Enum):
    BINARY_CHECK = "binary_check"        # Pass/fail, auto-evaluated
    THRESHOLD = "threshold"              # Numeric value >= target, auto-evaluated
    HUMAN_JUDGMENT = "human_judgment"    # Requires human QA routing
    LLM_EVALUATION = "llm_evaluation"   # Evaluated by Layer E (prompt/method determined there)

class PricingModel(str, Enum):
    FIXED = "fixed"
    PER_UNIT = "per_unit"
    TIME_CAPPED = "time_capped"
    OUTCOME_CONTINGENT = "outcome_contingent"
    PAY_WHAT_YOU_WANT = "pay_what_you_want"        # Community-oriented providers
    RECIPROCAL_EXCHANGE = "reciprocal_exchange"    # Non-monetary value exchange

class PaymentTrigger(str, Enum):
    ON_ACCEPTANCE = "on_acceptance"
    ON_MILESTONE = "on_milestone"
    ON_COMPLETION = "on_completion"
    ON_VERIFICATION = "on_verification"

class DisputeResolution(str, Enum):
    AI_MEDIATED = "ai_mediated"
    HUMAN_MEDIATED = "human_mediated"
    PLATFORM_DEFERRED = "platform_deferred"

class AutonomyLevel(int, Enum):
    ADVISOR = 1        # AI suggests, human executes
    FACILITATOR = 2    # AI structures, human approves every commitment
    AGENT = 3          # AI commits within pre-authorized bounds
    DELEGATE = 4       # AI handles end-to-end, human notified not blocked

class CompletionMode(str, Enum):
    ALL_OR_NOTHING = "all_or_nothing"
    MAJORITY_PASS = "majority_pass"      # Default
    WEIGHTED = "weighted"
    BUYER_DECIDES = "buyer_decides"
```

### 3.2 AcceptanceCriterion

```python
class AcceptanceCriterion(BaseModel):
    id: str                              # uuid4
    description: str                     # Human-readable description of the criterion
    criterion_type: CriterionType
    target_value: str | float | None = None  # For THRESHOLD: numeric target. For others: optional reference value.
    weight: float = 1.0                  # Relative weight when CompletionMode is WEIGHTED
    result: bool | None = None           # None = pending, True = pass, False = fail
    evaluated_by: str | None = None      # Layer E populates: evaluator identity
    evaluated_at: datetime | None = None
```

**Semantic validation rules for criteria:**
- `BINARY_CHECK`: must have a `description` that implies a yes/no answer
- `THRESHOLD`: must have a numeric `target_value`
- `HUMAN_JUDGMENT`: no structural constraint beyond description
- `LLM_EVALUATION`: no structural constraint — Layer E determines evaluation method

### 3.3 SLA

```python
class SLA(BaseModel):
    max_duration: timedelta | None = None    # Maximum wall-clock time for the contract
    max_cost_usd: float | None = None        # Budget ceiling in USD (v1: USD only)
    quality_floor: float | None = None       # Minimum acceptable quality score 0.0-1.0
    escalation_trigger: str | None = None    # Natural language description of escalation conditions
```

`escalation_trigger` is natural language in v1. Layer D interprets it. Examples:
- `"Notify me if cost exceeds 150% of estimate"`
- `"Escalate to human review if any task fails twice"`
- `"Alert buyer if no provider responds within 48 hours"`

### 3.4 Pricing

```python
class Pricing(BaseModel):
    model: PricingModel
    estimated_amount_usd: float | None = None  # Intake agent's initial estimate
    final_amount_usd: float | None = None      # Set after Layer C negotiation
    payment_trigger: PaymentTrigger = PaymentTrigger.ON_COMPLETION
    escrow: bool = False
```

The `estimated_amount_usd` is set during intake as a rough estimate. `final_amount_usd` is refined by Layer C when provider matching and negotiation produce real pricing data.

### 3.5 Participants

```python
class Participants(BaseModel):
    buyer_id: str                            # Identity ID of the buyer
    provider_id: str | None = None           # Assigned by Layer C during MATCHING
    intermediary_ids: list[str] = []         # Compliance agents, referral sources, delegation chain members
```

Intermediaries are identity references with roles and permissions managed by the identity system (Layer C). Layer A stores the reference only.

### 3.6 StateTransition

```python
class StateTransition(BaseModel):
    from_state: ContractState
    to_state: ContractState
    triggered_by: str                        # Identity ID or system identifier
    timestamp: datetime
    reason: str | None = None                # Why the transition occurred
    autonomy_gate_result: str | None = None  # "auto_approved", "human_approved", "blocked", etc.
```

### 3.7 WorkContract

```python
class WorkContract(BaseModel):
    id: str                                  # uuid4
    outcome_id: str                          # Reference to parent Outcome
    participants: Participants
    description: str                         # Structured description of the work
    domain: str                              # Vertical tag (e.g., "home_services", "legal", "creative")
    acceptance_criteria: list[AcceptanceCriterion]  # At least one required
    sla: SLA
    pricing: Pricing
    state: ContractState = ContractState.INTENT
    state_history: list[StateTransition] = []
    autonomy_level: AutonomyLevel            # Always set; inherited from Outcome if not overridden
    completion_mode: CompletionMode = CompletionMode.MAJORITY_PASS  # Default; configurable via env var
    dispute_resolution: DisputeResolution = DisputeResolution.AI_MEDIATED
    confidence: float = 0.0                  # 0.0-1.0, updated as work progresses
    execution_plan_id: str | None = None     # Set by Layer B/D when decomposition happens
    tags: list[str] = []
    metadata: dict[str, Any] = {}            # Domain-specific extensions
    version: int = 1
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def validate_acceptance_criteria_not_empty(self) -> Self:
        if not self.acceptance_criteria:
            raise ValueError("Contract must have at least one acceptance criterion")
        return self

    @model_validator(mode="after")
    def validate_threshold_criteria_have_target(self) -> Self:
        for c in self.acceptance_criteria:
            if c.criterion_type == CriterionType.THRESHOLD and c.target_value is None:
                raise ValueError(f"Threshold criterion '{c.id}' must have a target_value")
        return self
```

### 3.8 Outcome

```python
class Outcome(BaseModel):
    id: str                                  # uuid4
    owner_id: str                            # Identity ID of the buyer
    description: str                         # Natural language goal
    outcome_type: OutcomeType
    domain: str                              # Vertical tag
    contract_ids: list[str] = []             # References to child WorkContracts
    status: OutcomeStatus = OutcomeStatus.ACTIVE
    autonomy_level: AutonomyLevel            # Set during intake; contracts inherit unless overridden
    parent_outcome_id: str | None = None     # For future nesting support (deferred in v1)
    confidence: float = 0.0                  # Aggregate confidence across contracts
    tags: list[str] = []
    metadata: dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
```

### 3.9 JSON-LD Interoperability

All models support JSON-LD serialization for interoperability with external systems. This enables outcomes and contracts to be exchanged with external platforms (Fiverr, Upwork, TaskRabbit adapters) using a shared vocabulary.

**v1 implementation**: Each model includes an optional `@context` field in its JSON serialization that maps to the AWP (Aquarius Work Protocol) vocabulary. The `metadata` dict on Outcome and WorkContract can carry JSON-LD `@type` and `@id` annotations for external system references.

```python
# JSON-LD context for AWP models
AWP_CONTEXT = {
    "@context": {
        "awp": "https://aquarius.work/protocol/v1/",
        "outcome": "awp:Outcome",
        "contract": "awp:WorkContract",
        "criterion": "awp:AcceptanceCriterion",
        "schema": "https://schema.org/",
    }
}

def to_jsonld(model: BaseModel, context: dict = AWP_CONTEXT) -> dict:
    """Serialize a Pydantic model to JSON-LD format."""
    data = model.model_dump(mode="json")
    data.update(context)
    return data
```

The `@context` mapping is not enforced by Pydantic validators — it is applied at the serialization boundary when emitting data to external systems. Internal Layer A operations use standard Pydantic serialization. The AWP vocabulary URL is a placeholder; the formal vocabulary will be defined when the open standard specification begins (Phase 3 per ADR-004).

---

## 4. Contract State Machine

### 4.1 Legal Transitions

```
INTENT        → REQUIREMENTS, CANCELLED, EXPIRED
REQUIREMENTS  → MATCHING, CANCELLED, EXPIRED
MATCHING      → PROPOSAL, CANCELLED, EXPIRED
PROPOSAL      → NEGOTIATION, MATCHING, CANCELLED, EXPIRED
NEGOTIATION   → ACTIVE, MATCHING, CANCELLED, EXPIRED
ACTIVE        → VERIFICATION, FAILED, CANCELLED
VERIFICATION  → COMPLETE, ACTIVE, DISPUTED
DISPUTED      → ACTIVE, FAILED, CANCELLED
COMPLETE      → (terminal)
CANCELLED     → (terminal)
EXPIRED       → (terminal)
FAILED        → (terminal)
```

Notable transitions:
- `PROPOSAL → MATCHING`: No suitable candidates, re-search with broadened criteria
- `NEGOTIATION → MATCHING`: Terms couldn't be agreed, search for new providers
- `VERIFICATION → ACTIVE`: Rework needed, send back to execution
- `DISPUTED → ACTIVE`: Dispute resolved, rework agreed upon

### 4.2 Transition Ownership

Each layer owns specific transitions and notifies Layer A to update the record:

| Transition | Owner | Notes |
|---|---|---|
| INTENT → REQUIREMENTS | Layer A (intake agent) | Intake conversation produces structured schema |
| REQUIREMENTS → MATCHING | Layer A | Fires automatically when schema is finalized |
| MATCHING → PROPOSAL | Layer C | Capability index finds candidates |
| PROPOSAL → NEGOTIATION | Layer C/D | Candidates ranked, proposals presented |
| NEGOTIATION → ACTIVE | Layer D | Terms accepted (subject to autonomy gate) |
| ACTIVE → VERIFICATION | Layer D | Work delivered |
| VERIFICATION → COMPLETE | Layer D/E | Acceptance criteria evaluated |
| VERIFICATION → DISPUTED | Layer D | Verification failed or contested |
| DISPUTED → * | Layer D | Dispute resolution (logic in Layer D) |
| * → CANCELLED | Any layer / buyer | Buyer or system cancels |
| * → EXPIRED | Governance layer | Timeout triggered |
| * → FAILED | Layer D / governance | Unrecoverable failure |

### 4.3 Governance Interface

A cross-cutting governance layer validates transition legality and consistency before any state change is persisted. Layer A exposes an interface for this:

```python
class TransitionRequest(BaseModel):
    contract_id: str
    requested_state: ContractState
    triggered_by: str
    reason: str | None = None
    autonomy_gate_result: str | None = None

class TransitionResult(BaseModel):
    allowed: bool
    reason: str | None = None  # Why it was rejected, if applicable
```

The governance layer checks:
1. **Legality**: Is this transition in the allowed transitions map?
2. **Consistency**: Does the contract have required data for the target state? (e.g., can't go to ACTIVE without acceptance criteria, pricing, and a provider)
3. **Autonomy gate**: Does this transition require human approval given the contract's autonomy level and risk profile?

Layer A provides the `request_transition()` function. The governance layer (cross-cutting, not part of Layer A) implements the validation logic. Layer A enforces that all transitions go through this interface.

### 4.4 Schema Mutability

- **Pre-ACTIVE states** (INTENT through NEGOTIATION): Schema is a living draft. Any field can be modified.
- **ACTIVE and beyond**: Schema is frozen. Only `terms` (pricing, timeline) are negotiable via the amendment flow.
- **Amendment flow**: Creates a new contract version. The old version remains the contractual version until both parties agree to the amendment. In-flight tasks continue against the current version. If the amendment is accepted, tasks are updated to meet the new contract (requires buyer verification per ADR-003 autonomy settings).

---

## 5. Intake Agent

### 5.1 Role

The intake agent is a conversational AI that guides consumers from vague intent to a structured Outcome with one or more Work Contracts. It is the INTENT → REQUIREMENTS transition.

### 5.2 Design

```python
intake_agent = Agent(
    name="outcome_intake",
    instructions=INTAKE_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.7),
    output_type=IntakeResult,
    input_guardrails=[commitment_guardrail],
    tools=[
        finalize_outcome,       # Produces the Outcome + Contract(s)
        propose_criteria,       # Suggests acceptance criteria to the buyer
        estimate_pricing,       # Rough pricing estimate based on outcome type + domain
        clarify_requirement,    # Asks targeted follow-up questions
    ],
)
```

### 5.3 Intake Flow

1. Buyer submits natural language input (can be as vague as "help me move")
2. Intake agent asks clarifying questions to extract: outcome_type, domain, success conditions, budget/timeline preferences, autonomy level preference
3. Agent proposes acceptance criteria — buyer confirms, modifies, or adds
4. Agent produces a rough pricing estimate (this is an estimate only; Layer C refines)
5. Agent calls `finalize_outcome` tool which produces the structured `Outcome` + `WorkContract` and emits `outcome.created` event
6. Contract enters REQUIREMENTS state, then auto-transitions to MATCHING

### 5.4 Intake Agent Instructions (Key Behaviors)

The system prompt must encode:

- **No assumptions about buyer sophistication.** The buyer may be Dorothy (71, tech-comfort 1) or Alex (32, power user). Start simple, add detail if the buyer engages technically.
- **Propose, don't demand.** When the buyer can't articulate acceptance criteria, propose concrete ones and ask for confirmation. E.g., "For gutter cleaning, I'd suggest these success criteria: (1) all gutters cleared of debris, (2) downspouts flowing freely, (3) no visible damage to gutters. Does that sound right?"
- **Never make unvalidatable commitments.** The agent must not promise specific prices, timelines, or provider quality. It can say "based on similar work, this typically costs $X-$Y" but must frame it as an estimate.
- **Capture autonomy preference naturally.** Don't ask "what autonomy level do you want?" Instead, gauge from conversation: "Would you like to approve each step, or should I handle the details and just keep you posted?"
- **Respect conversation caps.** Configurable maximum conversation turns (default: 50 turns). If the cap is approaching, the agent summarizes what it has and asks the buyer to confirm or schedule a follow-up.

### 5.5 IntakeResult (Structured Output)

```python
class IntakeResult(BaseModel):
    outcome: Outcome
    contracts: list[WorkContract]
    intake_summary: str          # Human-readable summary of what was agreed
    open_questions: list[str]    # Unresolved items that may need follow-up
```

### 5.6 Session Persistence

Intake conversations use the OpenAI Agents SDK session system:

```python
from agents.extensions.sessions import SQLiteSession  # Dev
# Production: PostgreSQL-backed session

session = SQLiteSession("pln_intake.db")
result = await Runner.run(
    intake_agent,
    input=buyer_message,
    session=session,
    session_id=conversation_id,
)
```

Buyers can resume conversations. The session preserves full conversation history. If the buyer returns after days, the agent re-reads the session and summarizes where things left off before continuing.

### 5.7 Guardrails

```python
@input_guardrail
async def commitment_guardrail(ctx, agent, input):
    """
    Prevents the intake agent from making commitments about:
    - Specific pricing (beyond rough estimates)
    - Guaranteed timelines
    - Provider quality or identity
    - Outcome certainty

    Uses a lightweight LLM check on the agent's proposed response.
    """
    ...
```

Conversation length enforcement:

```python
MAX_INTAKE_TURNS = int(os.getenv("MAX_INTAKE_TURNS", "50"))
```

Enforced by checking the session length before each agent run. If the limit is reached, the agent is instructed to finalize with what it has or ask the buyer to resume later.

---

## 6. Validation

### 6.1 Structural Validation

Handled by Pydantic model validators:
- Required fields present and correctly typed
- Enums contain valid values
- `THRESHOLD` criteria have `target_value`
- At least one acceptance criterion per contract
- `confidence` is in range [0.0, 1.0]
- `quality_floor` is in range [0.0, 1.0]
- `max_cost_usd` is non-negative if present

### 6.2 Semantic Validation

A separate validation module (`validation.py`) performs logical consistency checks:

1. **Criteria verifiability**: Flag acceptance criteria that are too vague to evaluate. Uses heuristics (e.g., criteria under 10 characters, criteria without a measurable assertion). Does NOT use LLM at validation time — this is a fast, rule-based check.

2. **Budget-quality coherence**: Warn if `max_cost_usd` is very low but `quality_floor` is very high for the given `outcome_type` and `domain`. Uses configurable thresholds, not LLM inference.

3. **SLA feasibility**: Warn if `max_duration` is unreasonably short for the `outcome_type`. Rule-based heuristics with configurable thresholds per domain.

4. **State consistency**: Validate that required fields are populated for the current state. E.g., a contract in ACTIVE state must have `participants.provider_id` set.

```python
class ValidationResult(BaseModel):
    valid: bool
    errors: list[str]    # Hard failures — schema cannot proceed
    warnings: list[str]  # Soft issues — logged but don't block

def validate_outcome(outcome: Outcome, contracts: list[WorkContract]) -> ValidationResult:
    ...

def validate_transition(contract: WorkContract, target_state: ContractState) -> ValidationResult:
    ...
```

---

## 7. Events

Layer A emits events to the Kafka event bus via `shared/events.py`. The intake conversation is opaque to other layers — events are only emitted for finalized state changes.

### 7.1 Event Definitions

```python
class OutcomeCreatedEvent(BaseModel):
    event_type: Literal["outcome.created"] = "outcome.created"
    outcome_id: str
    owner_id: str
    outcome_type: OutcomeType
    domain: str
    contract_ids: list[str]
    timestamp: datetime

class ContractStateChangedEvent(BaseModel):
    event_type: Literal["contract.state_changed"] = "contract.state_changed"
    contract_id: str
    outcome_id: str
    previous_state: ContractState
    new_state: ContractState
    triggered_by: str
    timestamp: datetime

class ContractVersionAmendedEvent(BaseModel):
    event_type: Literal["contract.version_amended"] = "contract.version_amended"
    contract_id: str
    outcome_id: str
    old_version: int
    new_version: int
    amended_fields: list[str]  # Which top-level fields changed
    timestamp: datetime
```

### 7.2 Event Topics

| Topic | Events |
|---|---|
| `pln.outcomes` | `outcome.created` |
| `pln.contracts` | `contract.state_changed`, `contract.version_amended` |

---

## 8. Autonomy Level Integration

### 8.1 Inheritance

Autonomy level follows this precedence:

1. **Contract-level** (highest priority): If set explicitly on the contract, use it.
2. **Outcome-level** (inherited): All contracts inherit the outcome's autonomy level unless overridden.

The outcome's autonomy level is **always set** during intake. The intake agent determines it conversationally (see Section 5.4).

### 8.2 Interaction with State Machine

Layer A stores the autonomy level. The cross-cutting governance layer uses it to determine gate behavior at each transition. Layer A does not implement gate logic — it provides the data.

The autonomy level affects:
- Whether transitions auto-fire or require human approval
- Risk thresholds (same autonomy level, different behavior based on contract value — per ADR-003)
- Notification vs. blocking behavior

---

## 9. Completion Semantics

### 9.1 CompletionMode

Determines how acceptance criteria results map to contract completion:

| Mode | Logic |
|---|---|
| `ALL_OR_NOTHING` | Every criterion must pass |
| `MAJORITY_PASS` | >50% of criteria pass (weighted by `weight` if weights differ) |
| `WEIGHTED` | Sum of (weight × result) / sum of weights >= `quality_floor` |
| `BUYER_DECIDES` | Criteria results are presented, buyer makes final call |

### 9.2 Default

```python
DEFAULT_COMPLETION_MODE = os.getenv("DEFAULT_COMPLETION_MODE", "majority_pass")
```

The default is `MAJORITY_PASS`. Configurable via environment variable. The intake agent can override per-contract based on buyer preference expressed during conversation.

---

## 10. Configuration

All Layer A configuration via environment variables:

| Variable | Default | Description |
|---|---|---|
| `DEFAULT_COMPLETION_MODE` | `majority_pass` | Default completion semantics for new contracts |
| `MAX_INTAKE_TURNS` | `50` | Maximum conversation turns before intake agent forces finalization |
| `AZURE_OPENAI_KEY` | (required) | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | (required) | Azure OpenAI endpoint with `/openai/v1/` |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` | Model deployment name |

---

## 11. File Structure

```
packages/outcome_schema/
├── __init__.py
├── models.py              # All Pydantic models (Sections 3.1-3.8)
├── state_machine.py       # Legal transitions map, request_transition(), transition validation
├── validation.py          # Structural + semantic validation (Section 6)
├── intake.py              # Intake agent definition, tools, IntakeResult
├── events.py              # Event models + emission helpers (Section 7)
└── tests/
    ├── __init__.py
    ├── test_models.py         # Model construction, validation, edge cases
    ├── test_state_machine.py  # Legal/illegal transitions, state consistency
    ├── test_validation.py     # Semantic validation rules
    └── test_intake.py         # Intake agent with mocked LLM responses
```

---

## 12. Testing Strategy

All tests use pytest + pytest-asyncio. LLM calls are mocked.

### 12.1 Model Tests (`test_models.py`)

- Construction of all models with valid data
- Rejection of invalid data (missing required fields, out-of-range values)
- Validator behavior: empty acceptance criteria rejected, threshold without target rejected
- Autonomy level inheritance: contract without explicit level inherits from outcome
- Serialization round-trip (model → JSON → model)

### 12.2 State Machine Tests (`test_state_machine.py`)

- Every legal transition succeeds
- Every illegal transition is rejected (e.g., INTENT → COMPLETE, COMPLETE → ACTIVE)
- Terminal states reject all outgoing transitions
- State history is appended on transition
- State consistency validation: ACTIVE requires provider_id, acceptance_criteria, pricing

### 12.3 Validation Tests (`test_validation.py`)

- Vague criteria detection (too short, no measurable assertion)
- Budget-quality coherence warnings
- SLA feasibility warnings
- State-specific required field checks

### 12.4 Intake Agent Tests (`test_intake.py`)

- Mock LLM returns structured IntakeResult for a clear request
- Mock LLM asks clarifying questions for a vague request
- Acceptance criteria are proposed when buyer doesn't provide them
- Conversation turn cap is enforced
- Commitment guardrail blocks pricing promises
- Session resumption preserves context

---

## 13. Key Design Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Confidence is a single float, not a [low, mid, high] tuple | Simplicity for v1; can upgrade later |
| 2 | Intake conversation is opaque to other layers | Execution speed; other layers don't need partial intake state |
| 3 | Autonomy level lives on both Outcome and Contract with contract > outcome priority | Granular control per-contract while defaulting to outcome-level preference |
| 4 | Default completion mode is majority_pass, configurable via env var | Reasonable default for consumers; operators can tune per deployment |
| 5 | Escalation triggers are natural language | Avoids premature structured vocabulary; Layer D interprets |
| 6 | LLM evaluation criteria store type only, not prompts | Decouples schema from LLM capability; Layer E owns evaluation |
| 7 | No template matching at runtime | Execution speed; compounding happens via offline training batches |
| 8 | USD only for v1 | Simplicity; multi-currency is a v2 concern |
| 9 | Governance layer is cross-cutting, not part of Layer A | Layer A is the record keeper, not the policy enforcer |
| 10 | Semantic validation is rule-based, not LLM-powered | Validation must be fast and deterministic |
| 11 | Dispute resolution preference stored in Layer A, logic in Layer D | Layer A defines "what," Layer D handles "how" |
| 12 | Schema frozen at ACTIVE; only terms negotiable post-ACTIVE | Preserves auditability while allowing commercial flexibility |

---

## 14. Open Questions (Resolve During Implementation)

1. **Session backend for production**: SQLiteSession for dev is clear. Confirm PostgreSQL session adapter for production or build custom `SessionABC` implementation.
2. **Governance layer location**: Cross-cutting — does it get its own package or live in `shared/`? Decide when Layer D begins.
3. **Amendment notification flow**: When an amendment is proposed post-ACTIVE, the notification to the other party goes through what channel? Depends on Layer F (buyer surface) decisions.
4. **Intake agent persona tuning**: The system prompt needs iteration with real user conversations. Start with the principles in Section 5.4, refine through testing.
