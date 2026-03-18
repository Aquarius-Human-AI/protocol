# Governance Layer — Cross-Cutting Policy, Context, and Transition Control: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Approved for implementation
**Dependencies:** SPEC-LAYER-A.md, SPEC-LAYER-B.md, SPEC-LAYER-C.md, SPEC-LAYER-D.md, SPEC-LAYER-E.md, SPEC-LAYER-F.md, ADR-003

---

## 1. Purpose

The Governance Layer is the cross-cutting policy enforcement surface for the Programmable Labor Network. It serves three functions:

1. **Transition control**: Every contract-level state transition passes through governance for legality, consistency, and autonomy gate validation before being persisted
2. **Policy enforcement**: Rate limits, budget ceilings, restricted categories, and multi-level autonomy resolution are evaluated centrally
3. **Context assembly**: Assembles execution context for agents across all layers, managing context window limits via truncation and summarization

The Governance Layer is **not a moat layer** — it is infrastructure that ensures the system operates safely and consistently. It sits on the critical path for all contract state transitions and is called synchronously by other layers.

**Failure mode**: Fail-closed. If the governance service is unreachable, layers must pause operations until governance comes online. No state transition proceeds without governance validation.

---

## 2. Scope

### In Scope (v1)

- **Synchronous transition gate**: `validate_transition()` called by every layer before persisting a contract state change
- **Legality checks**: Is this transition in the allowed transitions map?
- **Consistency checks**: Does the contract have required data for the target state?
- **Autonomy gate resolution**: Multi-level policy composition (outcome → contract → task → risk profile → identity) with most-restrictive-wins semantics
- **Policy engine**: Rate limits (max active contracts per buyer), budget enforcement, restricted category blocking, delegation chain validation
- **Timeout/expiration enforcement**: Periodic monitor that transitions stale contracts to EXPIRED
- **Confidence monitoring**: Listens for confidence updates, triggers replan requests to Layer B when critical-path tasks drop below 0.6
- **Context management service**: Assembles `PlannerContext`, `ExecutionContext`, and other cross-layer context objects for agents
- **LLM-based policy reasoning**: An agent for edge cases where rule-based policy cannot resolve (e.g., ambiguous category restrictions, novel risk profiles)
- **Governance audit logging**: All governance decisions recorded to Layer E's audit trail
- **Health endpoint**: Other layers check governance availability before proceeding

### Deferred

- Governance rule UI for operators (rules managed via config + env vars for v1)
- Policy versioning and rollback
- Cross-contract dependency enforcement (e.g., sibling outcomes that must complete in order)
- Governance analytics dashboard
- Dynamic policy learning from historical governance decisions

---

## 3. Architectural Position

### 3.1 Synchronous Gate

Governance is on the critical path. Every contract-level state transition is validated synchronously before persistence:

```
Layer A/B/D/E → governance.validate_transition(request) → TransitionResult
                    ├── allowed=True  → layer persists transition
                    └── allowed=False → layer rejects, returns reason
```

### 3.2 Async Policy Monitor

Governance also runs periodic background processes:

- **Expiration monitor**: Scans contracts with `max_duration` SLAs, transitions stale contracts to EXPIRED
- **Confidence monitor**: Listens to `pln.execution` events for confidence updates, triggers replan requests when critical-path confidence drops below threshold
- **Rate limit enforcement**: Tracks active contract counts per buyer, blocks new contract creation when limits are exceeded

### 3.3 Context Service

Governance owns the shared context assembly service. All layers that need assembled context (planner context, execution context, evaluation context) call governance to build it. This centralizes context window management, summarization, and truncation logic.

```
┌──────────────────────────────────────────────────────┐
│                   Governance Layer                     │
│                                                        │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Transition  │  │   Policy     │  │   Context     │  │
│  │   Gate      │  │   Engine     │  │   Service     │  │
│  └──────┬─────┘  └──────┬───────┘  └──────┬────────┘  │
│         │               │                  │           │
│  ┌──────┴───────────────┴──────────────────┴────────┐  │
│  │              Governance State (Cosmos DB)          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  Expiration  │  │  Confidence  │  (async monitors)  │
│  │  Monitor     │  │  Monitor     │                    │
│  └──────────────┘  └──────────────┘                    │
└──────────────────────────────────────────────────────┘
```

---

## 4. Data Models

All models use Pydantic v2 `BaseModel` with strict typing.

### 4.1 Enums

```python
class PolicyDecision(str, Enum):
    ALLOWED = "allowed"
    BLOCKED = "blocked"
    REQUIRES_APPROVAL = "requires_approval"
    DEFERRED = "deferred"           # Policy cannot be resolved, escalate

class PolicyType(str, Enum):
    TRANSITION_LEGALITY = "transition_legality"
    STATE_CONSISTENCY = "state_consistency"
    AUTONOMY_GATE = "autonomy_gate"
    RATE_LIMIT = "rate_limit"
    BUDGET_CEILING = "budget_ceiling"
    RESTRICTED_CATEGORY = "restricted_category"
    DELEGATION_VALIDITY = "delegation_validity"
    EXPIRATION = "expiration"
    CONFIDENCE_THRESHOLD = "confidence_threshold"

class GovernanceActionType(str, Enum):
    TRANSITION_VALIDATED = "transition_validated"
    TRANSITION_REJECTED = "transition_rejected"
    POLICY_EVALUATED = "policy_evaluated"
    EXPIRATION_TRIGGERED = "expiration_triggered"
    REPLAN_TRIGGERED = "replan_triggered"
    RATE_LIMIT_ENFORCED = "rate_limit_enforced"
    CONTEXT_ASSEMBLED = "context_assembled"
    POLICY_OVERRIDE = "policy_override"         # Manual override by authorized identity
```

### 4.2 TransitionRequest

The input to governance's synchronous gate. Every layer constructs this before requesting a state change.

```python
class TransitionRequest(BaseModel):
    contract_id: str
    outcome_id: str
    requested_state: ContractState
    current_state: ContractState
    triggered_by: str                        # Identity ID of the actor
    triggered_by_type: str                   # "human", "agent", "system", "governance"
    source_layer: str                        # "layer_a", "layer_b", "layer_d", etc.
    reason: str | None = None
    # Context for policy evaluation
    contract_value_usd: float | None = None
    domain: str | None = None
    autonomy_level: AutonomyLevel | None = None
    task_id: str | None = None               # If transition relates to a specific task
    metadata: dict[str, Any] = {}
    timestamp: datetime
```

### 4.3 TransitionResult

```python
class TransitionResult(BaseModel):
    allowed: bool
    decision: PolicyDecision
    policies_evaluated: list[PolicyEvaluation]
    autonomy_gate_result: str | None = None  # "auto_approved", "requires_approval", "blocked"
    reason: str | None = None                # Human-readable explanation
    governance_record_id: str                # Reference to the governance log entry
    timestamp: datetime
```

### 4.4 PolicyEvaluation

Record of a single policy check within a transition validation.

```python
class PolicyEvaluation(BaseModel):
    policy_type: PolicyType
    passed: bool
    decision: PolicyDecision
    reason: str | None = None
    details: dict[str, Any] = {}             # Policy-specific details
```

### 4.5 GovernanceRecord

Every governance decision is logged.

```python
class GovernanceRecord(BaseModel):
    id: str                                  # uuid4
    action_type: GovernanceActionType
    contract_id: str | None = None
    outcome_id: str | None = None
    task_id: str | None = None
    actor_id: str                            # Who triggered the governance check
    transition_request: TransitionRequest | None = None
    transition_result: TransitionResult | None = None
    policies_evaluated: list[PolicyEvaluation] = []
    context_summary: str | None = None       # For context assembly actions
    timestamp: datetime
```

### 4.6 PolicyConfig

Runtime-configurable policy rules.

```python
class RateLimitConfig(BaseModel):
    max_active_contracts_per_buyer: int = 10
    max_active_outcomes_per_buyer: int = 5
    max_contracts_per_hour: int = 20         # Burst protection

class BudgetConfig(BaseModel):
    platform_max_contract_value_usd: float = 10000.0  # Hard ceiling per contract
    require_escrow_above_usd: float = 500.0

class CategoryRestriction(BaseModel):
    category: str                            # Domain tag (e.g., "medical", "legal", "financial")
    min_autonomy_for_auto_approve: AutonomyLevel = AutonomyLevel.DELEGATE
    min_trust_level: TrustLevel = TrustLevel.IDENTITY_VERIFIED
    max_auto_commit_usd: float = 100.0

class GovernancePolicyConfig(BaseModel):
    rate_limits: RateLimitConfig = RateLimitConfig()
    budget: BudgetConfig = BudgetConfig()
    category_restrictions: list[CategoryRestriction] = []
    replan_confidence_threshold: float = 0.6
    expiration_check_interval_minutes: int = 60
    confidence_check_interval_minutes: int = 5
```

### 4.7 AutonomyResolution

The resolved effective autonomy for a specific action, after composing all levels.

```python
class AutonomyResolution(BaseModel):
    effective_autonomy: AutonomyLevel
    requires_approval: bool
    resolution_chain: list[str]              # Which policies contributed, in order
    most_restrictive_source: str             # What drove the final decision
    reasoning: str                           # LLM-generated or rule-generated explanation
```

---

## 5. Transition Gate

### 5.1 Legal Transitions Map

The canonical transitions map. Governance is the single source of truth for what transitions are legal.

```python
LEGAL_TRANSITIONS: dict[ContractState, set[ContractState]] = {
    ContractState.INTENT: {ContractState.REQUIREMENTS, ContractState.CANCELLED, ContractState.EXPIRED},
    ContractState.REQUIREMENTS: {ContractState.ACTIVE, ContractState.CANCELLED, ContractState.EXPIRED},
    ContractState.ACTIVE: {ContractState.VERIFICATION, ContractState.FAILED, ContractState.CANCELLED},
    ContractState.VERIFICATION: {ContractState.COMPLETE, ContractState.ACTIVE, ContractState.DISPUTED},
    ContractState.DISPUTED: {ContractState.ACTIVE, ContractState.FAILED, ContractState.CANCELLED},
    # Terminal states — no outgoing transitions
    ContractState.COMPLETE: set(),
    ContractState.CANCELLED: set(),
    ContractState.EXPIRED: set(),
    ContractState.FAILED: set(),
}
```

### 5.2 State Consistency Requirements

Each target state has data requirements that must be met before the transition is allowed.

```python
STATE_REQUIREMENTS: dict[ContractState, list[str]] = {
    ContractState.REQUIREMENTS: [
        "acceptance_criteria_present",       # At least one acceptance criterion
    ],
    ContractState.ACTIVE: [
        "acceptance_criteria_present",
        "pricing_set",                       # Pricing model and estimate set
        "autonomy_level_set",               # Autonomy level must be explicitly set
        "sla_set",                          # At least max_duration or max_cost
    ],
    ContractState.VERIFICATION: [
        "execution_plan_exists",            # Layer B must have produced a plan
        "all_tasks_terminal",               # All tasks in COMPLETE, FAILED, or SKIPPED
    ],
    ContractState.COMPLETE: [
        "acceptance_criteria_evaluated",    # All criteria have result != None
        "completion_mode_satisfied",        # CompletionMode logic passes
    ],
    ContractState.DISPUTED: [
        "dispute_record_exists",           # A DisputeRecord must be created before entering DISPUTED
    ],
}
```

### 5.3 Validate Transition

The core synchronous gate function.

```python
async def validate_transition(request: TransitionRequest) -> TransitionResult:
    """
    Validate a contract state transition. Called synchronously by all layers.

    Evaluation order:
    1. Legality — is this transition in the allowed map?
    2. Consistency — does the contract have required data?
    3. Policy — rate limits, budget ceilings, restricted categories
    4. Autonomy gate — does this action require human approval?

    Returns TransitionResult with allowed=True/False and detailed reasoning.
    """
    evaluations: list[PolicyEvaluation] = []

    # 1. Legality
    legality = check_legality(request)
    evaluations.append(legality)
    if not legality.passed:
        return _build_result(False, PolicyDecision.BLOCKED, evaluations, request)

    # 2. Consistency
    consistency = await check_consistency(request)
    evaluations.append(consistency)
    if not consistency.passed:
        return _build_result(False, PolicyDecision.BLOCKED, evaluations, request)

    # 3. Policy checks
    policy_results = await evaluate_policies(request)
    evaluations.extend(policy_results)
    blocked = [p for p in policy_results if p.decision == PolicyDecision.BLOCKED]
    if blocked:
        return _build_result(False, PolicyDecision.BLOCKED, evaluations, request)

    # 4. Autonomy gate
    autonomy = await resolve_autonomy_gate(request)
    evaluations.append(autonomy)
    if autonomy.decision == PolicyDecision.REQUIRES_APPROVAL:
        return _build_result(
            False, PolicyDecision.REQUIRES_APPROVAL, evaluations, request,
            autonomy_gate_result="requires_approval",
        )

    return _build_result(
        True, PolicyDecision.ALLOWED, evaluations, request,
        autonomy_gate_result="auto_approved",
    )
```

---

## 6. Policy Engine

### 6.1 Rate Limits

```python
async def check_rate_limits(request: TransitionRequest) -> PolicyEvaluation:
    """Check rate limits for contract creation (INTENT → REQUIREMENTS transition)."""
    if request.requested_state != ContractState.REQUIREMENTS:
        return PolicyEvaluation(
            policy_type=PolicyType.RATE_LIMIT, passed=True,
            decision=PolicyDecision.ALLOWED,
        )

    buyer_id = request.triggered_by
    active_contracts = await count_active_contracts(buyer_id)
    active_outcomes = await count_active_outcomes(buyer_id)
    recent_contracts = await count_contracts_last_hour(buyer_id)

    config = get_policy_config().rate_limits

    if active_contracts >= config.max_active_contracts_per_buyer:
        return PolicyEvaluation(
            policy_type=PolicyType.RATE_LIMIT, passed=False,
            decision=PolicyDecision.BLOCKED,
            reason=f"Active contract limit reached ({active_contracts}/{config.max_active_contracts_per_buyer})",
        )

    if active_outcomes >= config.max_active_outcomes_per_buyer:
        return PolicyEvaluation(
            policy_type=PolicyType.RATE_LIMIT, passed=False,
            decision=PolicyDecision.BLOCKED,
            reason=f"Active outcome limit reached ({active_outcomes}/{config.max_active_outcomes_per_buyer})",
        )

    if recent_contracts >= config.max_contracts_per_hour:
        return PolicyEvaluation(
            policy_type=PolicyType.RATE_LIMIT, passed=False,
            decision=PolicyDecision.BLOCKED,
            reason=f"Hourly contract creation limit reached ({recent_contracts}/{config.max_contracts_per_hour})",
        )

    return PolicyEvaluation(
        policy_type=PolicyType.RATE_LIMIT, passed=True,
        decision=PolicyDecision.ALLOWED,
    )
```

### 6.2 Budget Enforcement

```python
async def check_budget(request: TransitionRequest) -> PolicyEvaluation:
    """Enforce platform-wide budget ceilings and escrow requirements."""
    if request.requested_state != ContractState.ACTIVE:
        return PolicyEvaluation(
            policy_type=PolicyType.BUDGET_CEILING, passed=True,
            decision=PolicyDecision.ALLOWED,
        )

    config = get_policy_config().budget
    contract = await get_contract(request.contract_id)

    if contract.pricing.estimated_amount_usd and contract.pricing.estimated_amount_usd > config.platform_max_contract_value_usd:
        return PolicyEvaluation(
            policy_type=PolicyType.BUDGET_CEILING, passed=False,
            decision=PolicyDecision.BLOCKED,
            reason=f"Contract value ${contract.pricing.estimated_amount_usd} exceeds platform maximum ${config.platform_max_contract_value_usd}",
        )

    if contract.pricing.estimated_amount_usd and contract.pricing.estimated_amount_usd > config.require_escrow_above_usd:
        if not contract.pricing.escrow:
            return PolicyEvaluation(
                policy_type=PolicyType.BUDGET_CEILING, passed=False,
                decision=PolicyDecision.BLOCKED,
                reason=f"Contracts above ${config.require_escrow_above_usd} require escrow",
                details={"escrow_required": True},
            )

    return PolicyEvaluation(
        policy_type=PolicyType.BUDGET_CEILING, passed=True,
        decision=PolicyDecision.ALLOWED,
    )
```

### 6.3 Restricted Categories

```python
async def check_restricted_categories(request: TransitionRequest) -> PolicyEvaluation:
    """Enforce category-specific restrictions (medical, legal, financial, etc.)."""
    config = get_policy_config()
    contract = await get_contract(request.contract_id)
    identity = await get_identity(request.triggered_by)

    for restriction in config.category_restrictions:
        if contract.domain == restriction.category:
            # Check trust level
            if identity.trust_level.value < restriction.min_trust_level.value:
                return PolicyEvaluation(
                    policy_type=PolicyType.RESTRICTED_CATEGORY, passed=False,
                    decision=PolicyDecision.BLOCKED,
                    reason=f"Domain '{restriction.category}' requires trust level {restriction.min_trust_level.value}, have {identity.trust_level.value}",
                )

            # Check auto-commit ceiling for this category
            if (request.contract_value_usd and
                request.contract_value_usd > restriction.max_auto_commit_usd and
                contract.autonomy_level.value >= restriction.min_autonomy_for_auto_approve.value):
                return PolicyEvaluation(
                    policy_type=PolicyType.RESTRICTED_CATEGORY, passed=False,
                    decision=PolicyDecision.REQUIRES_APPROVAL,
                    reason=f"Domain '{restriction.category}' requires approval for contracts above ${restriction.max_auto_commit_usd}",
                )

    return PolicyEvaluation(
        policy_type=PolicyType.RESTRICTED_CATEGORY, passed=True,
        decision=PolicyDecision.ALLOWED,
    )
```

---

## 7. Autonomy Gate Resolution

### 7.1 Multi-Level Composition

Autonomy composes across multiple levels. **Lower-level signals override higher-level settings** — the most restrictive policy wins.

Resolution order (each can only make the effective autonomy *more restrictive*, never less):

1. **Outcome-level autonomy**: The buyer's default preference (set during intake)
2. **Contract-level autonomy**: Override for this specific contract (if set)
3. **Identity risk profile**: `max_auto_commit_usd`, `restricted_categories` from the actor's `IdentityRecord`
4. **Domain restriction**: Category-specific ceilings from `GovernancePolicyConfig`
5. **Transaction risk**: LLM-assessed risk score for this specific action

```python
async def resolve_autonomy_gate(request: TransitionRequest) -> PolicyEvaluation:
    """
    Resolve the effective autonomy level for this transition by composing
    all policy layers. Most restrictive wins.
    """
    contract = await get_contract(request.contract_id)
    outcome = await get_outcome(request.outcome_id)
    identity = await get_identity(request.triggered_by)

    # Start with the most permissive level and restrict downward
    effective = contract.autonomy_level  # Already inherits from outcome if not overridden

    resolution_chain = [f"contract_autonomy={effective.value}"]

    # Identity risk profile restrictions
    if identity.risk_profile.max_auto_commit_usd is not None:
        if (request.contract_value_usd and
            request.contract_value_usd > identity.risk_profile.max_auto_commit_usd):
            effective = _most_restrictive(effective, AutonomyLevel.FACILITATOR)
            resolution_chain.append(
                f"identity_budget_exceeded: ${request.contract_value_usd} > ${identity.risk_profile.max_auto_commit_usd}"
            )

    if contract.domain in identity.risk_profile.restricted_categories:
        effective = _most_restrictive(effective, AutonomyLevel.ADVISOR)
        resolution_chain.append(f"identity_restricted_category={contract.domain}")

    # Domain restrictions from governance policy
    config = get_policy_config()
    for restriction in config.category_restrictions:
        if contract.domain == restriction.category:
            min_autonomy = restriction.min_autonomy_for_auto_approve
            if effective.value < min_autonomy.value:
                # Already more restrictive, keep it
                pass
            elif (request.contract_value_usd and
                  request.contract_value_usd > restriction.max_auto_commit_usd):
                effective = _most_restrictive(effective, AutonomyLevel.FACILITATOR)
                resolution_chain.append(
                    f"domain_restriction={restriction.category}: value>${restriction.max_auto_commit_usd}"
                )

    # LLM risk assessment for edge cases
    if effective in (AutonomyLevel.AGENT, AutonomyLevel.DELEGATE):
        risk = await assess_transition_risk(request, contract, identity)
        if risk.requires_approval:
            effective = _most_restrictive(effective, AutonomyLevel.FACILITATOR)
            resolution_chain.append(f"llm_risk_score={risk.risk_score:.2f}")

    # Determine if approval is needed
    requires_approval = effective in (AutonomyLevel.ADVISOR, AutonomyLevel.FACILITATOR)

    decision = (PolicyDecision.REQUIRES_APPROVAL if requires_approval
                else PolicyDecision.ALLOWED)

    return PolicyEvaluation(
        policy_type=PolicyType.AUTONOMY_GATE,
        passed=not requires_approval,
        decision=decision,
        reason=f"Effective autonomy: {effective.name}",
        details={
            "effective_autonomy": effective.value,
            "resolution_chain": resolution_chain,
            "requires_approval": requires_approval,
        },
    )


def _most_restrictive(a: AutonomyLevel, b: AutonomyLevel) -> AutonomyLevel:
    """Return the more restrictive (lower numeric value) autonomy level."""
    return a if a.value <= b.value else b
```

### 7.2 LLM Risk Assessment Agent

For transitions at autonomy levels 3 (Agent) and 4 (Delegate), governance uses an LLM agent to assess whether the specific action's risk warrants buyer approval despite the permissive autonomy setting.

```python
governance_risk_agent = Agent(
    name="governance_risk_assessor",
    instructions=GOVERNANCE_RISK_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.1),
    output_type=GovernanceRiskAssessment,
)

class GovernanceRiskAssessment(BaseModel):
    risk_score: float                        # 0.0-1.0
    requires_approval: bool
    risk_dimensions: dict[str, float]        # Breakdown
    reasoning: str
```

**Governance Risk Prompt (Key Behaviors):**

- Assess risk across: monetary value, irreversibility, category sensitivity, participant trust level, historical dispute rates for similar contracts, novelty of outcome type
- Risk threshold for overriding autonomy: 0.7 for Agent level, 0.85 for Delegate level
- This is a contract-level assessment, not task-level — Layer D handles task-level risk independently
- Be conservative: when in doubt, require approval. The cost of a false-positive (buyer approves a safe action) is low. The cost of a false-negative (unsafe action auto-approved) is high.
- Consider the full identity context: a buyer with 50 completed contracts at Delegate level operating in their usual domain is lower risk than a new buyer at Delegate level trying a novel domain

---

## 8. Timeout and Expiration Monitor

### 8.1 Expiration Logic

A periodic background job scans for contracts that should transition to EXPIRED.

```python
EXPIRATION_CHECK_INTERVAL_MINUTES = int(os.getenv("EXPIRATION_CHECK_INTERVAL_MINUTES", "60"))

async def run_expiration_monitor():
    """Periodic check for contracts that have exceeded their SLA max_duration."""
    while True:
        contracts = await get_contracts_with_sla_duration()
        now = datetime.utcnow()

        for contract in contracts:
            if contract.state in (ContractState.COMPLETE, ContractState.CANCELLED,
                                   ContractState.EXPIRED, ContractState.FAILED):
                continue  # Terminal states

            if contract.sla.max_duration is None:
                continue

            # Calculate elapsed time since the contract entered ACTIVE
            active_transition = next(
                (t for t in contract.state_history if t.to_state == ContractState.ACTIVE),
                None,
            )
            if active_transition is None:
                continue

            elapsed = now - active_transition.timestamp
            if elapsed > contract.sla.max_duration:
                request = TransitionRequest(
                    contract_id=contract.id,
                    outcome_id=contract.outcome_id,
                    requested_state=ContractState.EXPIRED,
                    current_state=contract.state,
                    triggered_by="governance_expiration_monitor",
                    triggered_by_type="system",
                    source_layer="governance",
                    reason=f"Contract exceeded max_duration of {contract.sla.max_duration}",
                    timestamp=now,
                )
                result = await validate_transition(request)
                if result.allowed:
                    await emit_event(ContractStateChangedEvent(
                        contract_id=contract.id,
                        outcome_id=contract.outcome_id,
                        previous_state=contract.state,
                        new_state=ContractState.EXPIRED,
                        triggered_by="governance_expiration_monitor",
                        timestamp=now,
                    ))

        await asyncio.sleep(EXPIRATION_CHECK_INTERVAL_MINUTES * 60)
```

### 8.2 Pre-ACTIVE Expiration

Contracts in INTENT or REQUIREMENTS state that have been inactive for a configurable period are also expired:

```python
INTENT_EXPIRATION_HOURS = int(os.getenv("INTENT_EXPIRATION_HOURS", "168"))  # 7 days
REQUIREMENTS_EXPIRATION_HOURS = int(os.getenv("REQUIREMENTS_EXPIRATION_HOURS", "336"))  # 14 days
```

---

## 9. Confidence Monitor

### 9.1 Replan Trigger

Governance listens to task confidence updates from Layer D's execution events. When any critical-path task's confidence drops below the threshold, governance triggers a replan request to Layer B.

```python
REPLAN_CONFIDENCE_THRESHOLD = float(os.getenv("REPLAN_CONFIDENCE_THRESHOLD", "0.6"))

async def handle_confidence_update(event: ExecutionEvent):
    """Process a confidence update event from Layer D."""
    if event.event_type != "task.confidence_updated":
        return

    task_id = event.payload["task_id"]
    new_confidence = event.payload["confidence"]
    contract_id = event.contract_id

    if new_confidence >= REPLAN_CONFIDENCE_THRESHOLD:
        return

    # Check if this task is on the critical path
    plan = await get_execution_plan(contract_id)
    if task_id not in plan.critical_path:
        return  # Non-critical-path tasks don't trigger replan

    # Check replan count
    if plan.version > int(os.getenv("MAX_REPLANS", "3")):
        return  # Max replans exceeded, Layer D handles escalation

    # Trigger replan
    await emit_event(ReplanRequestedEvent(
        plan_id=plan.id,
        contract_id=contract_id,
        outcome_id=plan.outcome_id,
        trigger_task_id=task_id,
        trigger_confidence=new_confidence,
        threshold=REPLAN_CONFIDENCE_THRESHOLD,
        timestamp=datetime.utcnow(),
    ))

    await log_governance_action(GovernanceRecord(
        id=str(uuid4()),
        action_type=GovernanceActionType.REPLAN_TRIGGERED,
        contract_id=contract_id,
        task_id=task_id,
        actor_id="governance_confidence_monitor",
        timestamp=datetime.utcnow(),
    ))
```

---

## 10. Context Management Service

### 10.1 Interface

The context service assembles cross-layer context for agents. All layers call governance to build their context objects.

```python
class ContextService:
    """Assembles execution context for agents across all layers."""

    async def assemble_planner_context(
        self,
        contract_id: str,
        include_intake_history: bool = True,
        include_prior_outputs: bool = False,
        include_current_dag: bool = False,
    ) -> PlannerContext:
        """Assemble context for the Layer B planner agent."""
        contract = await get_contract(contract_id)
        outcome = await get_outcome(contract.outcome_id)

        intake_conversation = []
        if include_intake_history:
            intake_conversation = await self._get_intake_history(
                contract.outcome_id, max_tokens=4000,
            )

        prior_outputs = None
        if include_prior_outputs:
            prior_outputs = await self._get_completed_task_outputs(contract_id)

        current_dag = None
        if include_current_dag:
            current_dag = await get_execution_plan(contract_id)

        return PlannerContext(
            contract=contract,
            outcome=outcome,
            intake_conversation=intake_conversation,
            prior_task_outputs=prior_outputs,
            current_dag_state=current_dag,
        )

    async def assemble_execution_context(
        self,
        task_id: str,
        contract_id: str,
    ) -> ExecutionContext:
        """Assemble context for Layer D task execution."""
        task = await get_task(task_id)
        contract = await get_contract(contract_id)
        outcome = await get_outcome(contract.outcome_id)

        predecessor_outputs = await self._get_predecessor_outputs(task)
        last_stable_state = await self._get_last_stable_state(task_id)
        deficiency_notes = await self._get_deficiency_notes(task_id)

        intake_summary = await self._summarize_intake(
            contract.outcome_id, max_tokens=500,
        )

        return ExecutionContext(
            task=task,
            contract=contract,
            outcome=outcome,
            predecessor_outputs=predecessor_outputs,
            last_stable_state=last_stable_state,
            deficiency_notes=deficiency_notes,
            intake_conversation_summary=intake_summary,
        )

    async def assemble_evaluation_context(
        self,
        task_id: str,
        contract_id: str,
    ) -> EvaluationContext:
        """Assemble context for Layer D evaluator agent."""
        task = await get_task(task_id)
        contract = await get_contract(contract_id)
        task_output = await get_task_output(task_id)
        execution_trace = await get_execution_trace(task_id)
        criteria = [c for c in contract.acceptance_criteria
                    if c.id in task.acceptance_criteria_ids]

        return EvaluationContext(
            task=task,
            contract=contract,
            task_output=task_output,
            execution_trace=execution_trace,
            acceptance_criteria=criteria,
        )

    async def _get_intake_history(
        self,
        outcome_id: str,
        max_tokens: int = 4000,
    ) -> list[dict]:
        """Retrieve intake conversation history, truncated to fit context window."""
        full_history = await get_session_messages(outcome_id)
        if self._estimate_tokens(full_history) <= max_tokens:
            return full_history
        return await self._summarize_and_truncate(full_history, max_tokens)

    async def _summarize_and_truncate(
        self,
        messages: list[dict],
        max_tokens: int,
    ) -> list[dict]:
        """Summarize older messages, keep recent messages verbatim."""
        # Keep the last N messages verbatim
        recent = messages[-10:]
        older = messages[:-10]

        if not older:
            return recent

        # Summarize older messages using LLM
        summary = await Runner.run(
            context_summarizer_agent,
            input=json.dumps(older),
            max_turns=2,
        )

        return [{"role": "system", "content": f"[Summary of earlier conversation]: {summary.final_output}"}] + recent

    def _estimate_tokens(self, messages: list[dict]) -> int:
        """Rough token estimation (4 chars per token heuristic)."""
        total_chars = sum(len(str(m)) for m in messages)
        return total_chars // 4
```

### 10.2 Context Summarizer Agent

```python
context_summarizer_agent = Agent(
    name="context_summarizer",
    instructions="""Summarize the provided conversation history into a concise summary.
    Preserve: key decisions, agreed-upon requirements, stated preferences, acceptance criteria.
    Omit: pleasantries, repeated questions, exploratory tangents that were resolved.
    Output a single paragraph summary.""",
    model=make_model(),
    model_settings=ModelSettings(temperature=0.1),
)
```

### 10.3 EvaluationContext

```python
class EvaluationContext(BaseModel):
    task: TaskNode
    contract: WorkContract
    task_output: dict[str, Any]              # Artifacts and deliverables
    execution_trace: dict[str, Any] | None   # How the work was done
    acceptance_criteria: list[AcceptanceCriterion]
```

---

## 11. Governance State (Cosmos DB)

### 11.1 Collections

| Collection | Documents | Partition Key |
|---|---|---|
| `governance_records` | `GovernanceRecord` — all governance decisions | `contract_id` |
| `governance_config` | `GovernancePolicyConfig` — runtime policy configuration | `config_id` (singleton) |
| `active_contract_counts` | Materialized view: buyer_id → active contract/outcome counts | `buyer_id` |

### 11.2 Active Contract Tracking

To avoid expensive cross-partition queries for rate limit checks, governance maintains a materialized counter per buyer:

```python
class BuyerActivityCounter(BaseModel):
    buyer_id: str
    active_contracts: int = 0
    active_outcomes: int = 0
    contracts_created_timestamps: list[datetime] = []  # Rolling window for burst protection
    last_updated_at: datetime
```

These counters are updated via the `contract.state_changed` events that governance already processes. Terminal state transitions decrement the counter.

---

## 12. Events

### 12.1 Inbound Events (Governance Listens)

| Topic | Event | Action |
|---|---|---|
| `pln.contracts` | `contract.state_changed` | Update active contract counters, log to governance records |
| `pln.execution` | `task.confidence_updated` | Confidence monitor: check critical-path threshold, trigger replan |
| `pln.execution` | `task.state_changed` | Track task completion for state consistency checks |
| `pln.outcomes` | `outcome.created` | Update active outcome counter for the buyer |

### 12.2 Outbound Events (Governance Emits)

| Topic | Event | Trigger |
|---|---|---|
| `pln.contracts` | `contract.state_changed` (→ EXPIRED) | Expiration monitor detects overdue contract |
| `pln.execution_plans` | `replan.requested` | Confidence monitor detects critical-path degradation |
| `pln.governance` | `governance.transition_validated` | Every transition validation (for audit) |
| `pln.governance` | `governance.policy_blocked` | A transition was blocked by policy (for alerting) |

### 12.3 Event Topics

| Topic | Events |
|---|---|
| `pln.governance` | `governance.transition_validated`, `governance.policy_blocked` |

---

## 13. Error Handling

| Failure | Behavior |
|---|---|
| Governance service unreachable | **Fail-closed**: All layers pause operations. No state transitions proceed. Layers retry with exponential backoff (1s, 2s, 4s, max 30s). |
| LLM risk assessment fails | Fall back to rule-based assessment. If the action would require LLM judgment and the LLM is unavailable, default to `requires_approval` (fail-safe). |
| Cosmos DB write fails for governance record | The transition validation still returns a result (governance record is non-blocking for the decision). Log the failure. Retry record write asynchronously. |
| Cosmos DB read fails for contract data | Transition validation fails with a retriable error. Layer retries. |
| Expiration monitor crashes | Restart from last checkpoint. Stale contracts may persist slightly longer than SLA — acceptable since expiration is a background concern. |
| Confidence monitor misses events | Events are replayed from Kafka offset on restart. No lost signals. |
| Context assembly fails | Return error to calling layer. Layer decides fallback (e.g., Layer B uses minimal context, Layer D retries). |
| Rate limit counter out of sync | Periodic reconciliation job (hourly) queries actual contract counts and corrects counters. |

---

## 14. Configuration

| Variable | Default | Description |
|---|---|---|
| `MAX_ACTIVE_CONTRACTS_PER_BUYER` | `10` | Rate limit: max concurrent active contracts |
| `MAX_ACTIVE_OUTCOMES_PER_BUYER` | `5` | Rate limit: max concurrent active outcomes |
| `MAX_CONTRACTS_PER_HOUR` | `20` | Rate limit: burst protection |
| `PLATFORM_MAX_CONTRACT_VALUE_USD` | `10000` | Hard ceiling per contract value |
| `REQUIRE_ESCROW_ABOVE_USD` | `500` | Contracts above this value require escrow |
| `REPLAN_CONFIDENCE_THRESHOLD` | `0.6` | Critical-path confidence floor for replan trigger |
| `EXPIRATION_CHECK_INTERVAL_MINUTES` | `60` | How often the expiration monitor runs |
| `INTENT_EXPIRATION_HOURS` | `168` | Hours before an INTENT contract expires (7 days) |
| `REQUIREMENTS_EXPIRATION_HOURS` | `336` | Hours before a REQUIREMENTS contract expires (14 days) |
| `GOVERNANCE_RISK_THRESHOLD_AGENT` | `0.7` | Risk score threshold for overriding Agent autonomy |
| `GOVERNANCE_RISK_THRESHOLD_DELEGATE` | `0.85` | Risk score threshold for overriding Delegate autonomy |
| `CONTEXT_MAX_INTAKE_TOKENS` | `4000` | Max tokens for intake history in planner context |
| `CONTEXT_MAX_INTAKE_SUMMARY_TOKENS` | `500` | Max tokens for intake summary in execution context |
| `RATE_LIMIT_RECONCILIATION_INTERVAL_MINUTES` | `60` | How often rate limit counters are reconciled |
| `AZURE_OPENAI_KEY` | (required) | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | (required) | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` | Model deployment name |
| `COSMOS_DB_ENDPOINT` | (required) | Azure Cosmos DB endpoint |
| `COSMOS_DB_KEY` | (required) | Azure Cosmos DB key |

---

## 15. File Structure

```
packages/governance/
├── __init__.py
├── models.py                  # All Pydantic models (Section 4)
├── gate.py                    # validate_transition(), legality, consistency checks
├── policy.py                  # Policy engine: rate limits, budget, categories
├── autonomy.py                # Autonomy gate resolution, multi-level composition
├── risk.py                    # LLM risk assessment agent for governance decisions
├── context_service.py         # Context assembly for all layers
├── expiration.py              # Expiration monitor (async background job)
├── confidence.py              # Confidence monitor (Kafka consumer)
├── state.py                   # Cosmos DB state management (counters, config)
├── events.py                  # Event models + emission helpers
├── listener.py                # Kafka consumer for contract/execution events
├── health.py                  # Health endpoint for availability checks
└── tests/
    ├── __init__.py
    ├── test_models.py             # Model construction, validation
    ├── test_gate.py               # Transition validation: legality, consistency, full pipeline
    ├── test_policy.py             # Rate limits, budget ceilings, restricted categories
    ├── test_autonomy.py           # Multi-level autonomy resolution, most-restrictive-wins
    ├── test_risk.py               # LLM risk assessment (mocked LLM)
    ├── test_context_service.py    # Context assembly, truncation, summarization
    ├── test_expiration.py         # Expiration monitor logic
    ├── test_confidence.py         # Confidence threshold, replan triggering
    ├── test_state.py              # Counter management, reconciliation
    └── test_listener.py           # Event-driven triggers
```

---

## 16. Testing Strategy

All tests use pytest + pytest-asyncio. LLM calls and Cosmos DB are mocked.

### 16.1 Gate Tests (`test_gate.py`)

- Every legal transition succeeds when all policies pass
- Every illegal transition is rejected (e.g., INTENT → COMPLETE, COMPLETE → ACTIVE)
- Terminal states reject all outgoing transitions
- Consistency: ACTIVE requires acceptance_criteria, pricing, SLA, autonomy_level
- Consistency: VERIFICATION requires execution_plan and all tasks terminal
- Consistency: COMPLETE requires all acceptance criteria evaluated and completion mode satisfied
- Consistency: DISPUTED requires dispute record
- Full pipeline: legality → consistency → policy → autonomy gate, evaluated in order
- Early termination: if legality fails, no further checks run

### 16.2 Policy Tests (`test_policy.py`)

- Rate limit: 10th active contract blocked, 11th blocked, 9th allowed
- Rate limit: burst protection — 21st contract in one hour blocked
- Budget ceiling: contract above $10,000 blocked
- Escrow requirement: contract above $500 without escrow blocked
- Restricted category: medical domain requires identity verification
- Restricted category: financial domain requires approval above $100
- Policy composition: multiple policies evaluated, first BLOCKED wins

### 16.3 Autonomy Tests (`test_autonomy.py`)

The critical test suite — verifies most-restrictive-wins semantics:

- Outcome autonomy 4 (Delegate) + no restrictions → auto-approved
- Outcome autonomy 4 + identity `max_auto_commit_usd` $200 + contract value $500 → requires approval
- Outcome autonomy 4 + medical domain restriction on identity → Advisor level (requires approval)
- Contract autonomy 2 (Facilitator) overrides outcome autonomy 4 → requires approval
- Autonomy 3 (Agent) + LLM risk score 0.8 → overridden to requires approval
- Autonomy 4 (Delegate) + LLM risk score 0.9 → overridden to requires approval
- Autonomy 4 + LLM risk score 0.5 → auto-approved (below 0.85 threshold)
- Resolution chain correctly records which policy was most restrictive

### 16.4 Risk Tests (`test_risk.py`)

- High-value novel domain → high risk score (mocked LLM)
- Low-value familiar domain, trusted buyer → low risk score
- LLM failure → fallback to requires_approval
- Risk dimensions breakdown matches expected structure

### 16.5 Context Service Tests (`test_context_service.py`)

- Planner context assembled with full intake history (within token limit)
- Planner context assembled with summarized intake history (exceeds token limit)
- Execution context includes predecessor outputs
- Execution context includes deficiency notes for retries
- Evaluation context includes acceptance criteria mapped to task
- Summarizer produces valid summary from conversation history
- Token estimation is reasonable (within 2x of actual)

### 16.6 Expiration Tests (`test_expiration.py`)

- Contract exceeding max_duration transitions to EXPIRED
- Contract within max_duration not affected
- Terminal-state contracts skipped
- Contracts without max_duration skipped
- INTENT contracts expired after 7 days of inactivity
- REQUIREMENTS contracts expired after 14 days of inactivity

### 16.7 Confidence Tests (`test_confidence.py`)

- Critical-path task below 0.6 confidence triggers replan
- Non-critical-path task below 0.6 does NOT trigger replan
- Task at exactly 0.6 does NOT trigger replan (threshold is strictly below)
- Max replan count respected — no replan triggered when plan.version > MAX_REPLANS
- Replan event carries correct trigger task and confidence value

### 16.8 State Tests (`test_state.py`)

- Active contract counter incremented on ACTIVE transition
- Active contract counter decremented on terminal transition
- Active outcome counter tracks correctly
- Burst protection window rolls correctly (only counts last hour)
- Reconciliation job corrects out-of-sync counters

---

## 17. Integration with Other Layers

### 17.1 Layer A

Layer A calls `governance.validate_transition()` for every contract state change. Layer A no longer implements its own transition validation — it delegates entirely to governance. Layer A persists the transition only if governance returns `allowed=True`.

### 17.2 Layer B

Layer B calls `governance.context_service.assemble_planner_context()` to build the planner agent's context. Layer B receives `replan.requested` events triggered by governance's confidence monitor.

### 17.3 Layer C

Layer C is not directly called by governance in v1. Governance reads identity records and risk profiles from Layer C's Cosmos DB collections for autonomy resolution.

### 17.4 Layer D

Layer D calls `governance.validate_transition()` for contract-level state changes (ACTIVE → VERIFICATION, VERIFICATION → COMPLETE, etc.). Layer D handles task-level autonomy gates independently via its own risk scorer. Layer D calls `governance.context_service.assemble_execution_context()` and `assemble_evaluation_context()` for task execution and evaluation.

### 17.5 Layer E

Governance logs all decisions to Layer E's audit trail via `AuditEntry` records with `action_type` corresponding to governance actions.

### 17.6 Layer F

Layer F does not call governance directly. Approval gate results from governance flow to the buyer via Layer D's SSE stream. When governance returns `requires_approval`, Layer D emits an `autonomy_gate.blocked` event that Layer F renders as an approval prompt.

---

## 18. Key Design Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Synchronous gate, not async event-based | State transitions must not proceed without governance approval. Async would allow race conditions where a transition is persisted before governance evaluates it. |
| 2 | Fail-closed on governance unavailability | Safety over liveness. An unauthorized transition is worse than a paused system. Layers retry with backoff. |
| 3 | Most-restrictive-wins for autonomy composition | Simple, predictable, safe. A buyer setting Delegate on an outcome cannot accidentally bypass their own identity-level restrictions. |
| 4 | LLM-based risk assessment for edge cases | Consistent with the architecture's LLM-first philosophy. Rule-based fallback ensures safety when LLM is unavailable. |
| 5 | Context service lives in governance | Centralizes context window management and summarization. Avoids each layer independently solving truncation. Can be extracted to its own service later if governance becomes too broad. |
| 6 | Materialized counters for rate limits | Cross-partition Cosmos DB queries for "count all active contracts" are expensive. Materialized counters with periodic reconciliation are fast and eventually consistent. |
| 7 | Governance owns the legal transitions map | Single source of truth. Layer A stores the data, governance enforces the rules. Prevents drift between layers. |
| 8 | Separate from Layer E's audit trail | Governance logs its own decisions, but delegates to Layer E's audit trail for the immutable record. Governance records are operational; Layer E's audit trail is the regulatory artifact. |
| 9 | No governance UI for v1 | Policy config via env vars and Cosmos DB document. Operator tooling (deferred in Layer F) will eventually provide a governance rule editor. |
| 10 | Confidence monitor in governance, not Layer D | Governance has the cross-cutting view. Layer D monitors individual tasks; governance monitors the system-wide replan policy. |
| 11 | Expiration is governance-owned, not Layer D | Layer D manages active execution. Governance handles the policy question of "should this contract still be alive?" |
| 12 | Task-level gates stay in Layer D | Layer D's risk scorer handles task-level autonomy. Governance handles contract-level and cross-cutting concerns. Clear separation of responsibilities. |

---

## 19. Open Questions (Resolve During Implementation)

1. **Governance scaling**: Governance is on the critical path for every contract transition. At high volume (1000+ concurrent contracts), the sync gate may become a bottleneck. Consider connection pooling, read replicas for Cosmos DB, and caching of policy configs.

2. **Context service extraction**: If governance becomes too broad (policy + context), the context service can be extracted to `shared/context_service.py`. The interface stays the same; only the import path changes.

3. **Policy hot-reload**: Policy config changes (rate limits, category restrictions) currently require redeploying or updating the Cosmos DB config document. Consider a watch mechanism for real-time config updates without restart.

4. **Delegation chain validation**: Layer C specifies delegation chains with max depth 20. Governance should validate delegation chain integrity on transitions where the actor is a delegate. Deferred until Layer F supports delegation chains.

5. **Cross-contract governance**: Some governance concerns span multiple contracts (e.g., a buyer's total exposure across all active contracts). v1 handles per-contract governance only. Cross-contract policies (portfolio risk limits) should be considered for v2.

6. **Audit trail integration depth**: Should every governance record also be written as a Layer E `AuditEntry` with hash chaining, or is the governance-specific `GovernanceRecord` collection sufficient? Recommendation: write critical decisions (blocked transitions, autonomy overrides) to both; routine allowed transitions to governance records only.
