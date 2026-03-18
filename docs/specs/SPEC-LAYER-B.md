# Layer B — Task Decomposition Engine: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-17
**Status:** Approved for implementation
**Dependencies:** SPEC-LAYER-A.md, ADR-002, ADR-003, ADR-004

---

## 1. Purpose

Layer B converts buyer-facing outcomes into machine-routable work units. Given a contract in ACTIVE state, it produces a directed acyclic graph (DAG) of executable tasks with explicit dependencies, parallelization opportunities, human/AI suitability annotations, and human-friendly cost/duration estimates.

Layer B is an **execution layer** — it is necessary infrastructure but not a compounding moat. Its value compounds indirectly through the data it generates (DAG patterns stored for offline training).

---

## 2. Scope

### In Scope (v1)

- Planner agent that produces structured DAG output via OpenAI Agents SDK
- DAG-as-tool pattern: planner decides whether decomposition is needed; trivial contracts skip it
- Task model with suitability scores, free-form capability tags, dependency types, human-friendly duration/cost ranges
- DAG validation: cycle detection, dangling reference detection, acceptance criteria coverage, max task cap
- Critical path calculation
- Replanning: accepts original contract + current DAG state, replans dependent tasks only on critical-path confidence drop below 0.6
- Event-driven trigger from `contract.state_changed` → ACTIVE
- Events emitted: `execution_plan.created`, `execution_plan.replanned`
- Execution plan status lifecycle: `pending_approval` → `approved` → `executing` → `complete` / `failed`
- Buyer approval gate for autonomy levels 1 (Advisor) & 2 (Facilitator)
- Plan summary generation: human-readable summary + simplified task list for buyer review (rich UI)

### Deferred (see DEFERRED.md)

- Learning loop (offline training from historical DAG patterns)
- Fine-tuned decomposition model (start with frontier model, move to fine-tuned at 10K+ completions)
- Resource constraint modeling (resolved dynamically by Layer D at runtime)
- Novel outcome type validation by human operators before first execution

---

## 3. Data Models

All models use Pydantic v2 `BaseModel` with strict typing.

### 3.1 Enums

```python
class TaskType(str, Enum):
    AI_ONLY = "ai_only"          # Must be performed by an AI agent
    HUMAN_ONLY = "human_only"    # Must be performed by a human
    EITHER = "either"            # Either human or AI can perform
    HYBRID = "hybrid"            # Requires human + AI composite unit

class DependencyType(str, Enum):
    HARD = "hard"    # Strict sequencing — predecessor must complete before successor starts
    SOFT = "soft"    # Preferred ordering — can be violated if needed for scheduling

class TaskStatus(str, Enum):
    """Execution-level status, managed by Layer D.
    Note: Layer D defines a unified TaskExecutionState that merges TaskMatchState + TaskStatus
    plus additional execution substates (PAUSED, EVALUATING, RETRYING, etc.).
    TaskStatus and TaskMatchState are the Layer B/C view; TaskExecutionState is the Layer D runtime view.
    """
    PENDING = "pending"          # Not yet started
    IN_PROGRESS = "in_progress"  # Currently being executed
    COMPLETE = "complete"        # Finished successfully
    FAILED = "failed"            # Failed (may trigger replan)
    SKIPPED = "skipped"          # Skipped due to replanning

class TaskMatchState(str, Enum):
    """Task-level matching states, managed by Layer C. See SPEC-LAYER-C Section 12."""
    PENDING = "pending"          # Not yet ready for matching
    READY = "ready"              # Dependencies resolved, ready for matching
    MATCHING = "matching"        # Layer C matching pipeline in progress
    MATCHED = "matched"          # Candidates found, awaiting assignment/negotiation
    ASSIGNED = "assigned"        # Provider assigned, ready for execution

class ExecutionPlanStatus(str, Enum):
    PENDING_APPROVAL = "pending_approval"  # Awaiting buyer review (autonomy 1 & 2)
    APPROVED = "approved"                  # Buyer approved or auto-approved (autonomy 3 & 4)
    EXECUTING = "executing"                # Layer D is running the plan
    COMPLETE = "complete"                  # All tasks finished
    FAILED = "failed"                      # Unrecoverable failure
    REPLANNING = "replanning"              # Replan in progress
```

### 3.2 DurationEstimate

Human-friendly ranges, not false precision. The buyer sees these.

```python
class DurationEstimate(BaseModel):
    min_minutes: int          # Lower bound in minutes
    max_minutes: int          # Upper bound in minutes
    display_label: str        # Human-friendly label, e.g., "2-4 hours", "about 30 minutes"

    @model_validator(mode="after")
    def validate_range(self) -> Self:
        if self.min_minutes > self.max_minutes:
            raise ValueError("min_minutes cannot exceed max_minutes")
        if self.min_minutes < 0:
            raise ValueError("min_minutes must be non-negative")
        return self
```

### 3.3 CostEstimate

```python
class CostEstimate(BaseModel):
    min_usd: float            # Lower bound in USD
    max_usd: float            # Upper bound in USD
    display_label: str        # Human-friendly label, e.g., "$50-$100", "under $20"

    @model_validator(mode="after")
    def validate_range(self) -> Self:
        if self.min_usd > self.max_usd:
            raise ValueError("min_usd cannot exceed max_usd")
        if self.min_usd < 0:
            raise ValueError("min_usd must be non-negative")
        return self
```

### 3.4 TaskDependency

```python
class TaskDependency(BaseModel):
    task_id: str                       # ID of the predecessor task
    dependency_type: DependencyType = DependencyType.HARD
```

### 3.5 TaskNode

```python
class TaskNode(BaseModel):
    id: str                                      # uuid4
    name: str                                    # Short human-readable task name
    description: str                             # What this task involves
    task_type: TaskType                          # AI_ONLY, HUMAN_ONLY, EITHER, HYBRID
    required_capabilities: list[str]             # Free-form skill tags; matched via LLM against Layer C
    dependencies: list[TaskDependency] = []      # Predecessor tasks
    ai_suitability: float                        # 0.0-1.0 score for AI execution
    human_suitability: float                     # 0.0-1.0 score for human execution
    estimated_duration: DurationEstimate
    estimated_cost: CostEstimate
    confidence: float                            # 0.0-1.0 planner's confidence this task is well-specified
    status: TaskStatus = TaskStatus.PENDING
    match_state: TaskMatchState = TaskMatchState.PENDING  # Set by Layer C matching pipeline
    assigned_provider_id: str | None = None      # Set by Layer C when task is ASSIGNED
    assigned_capability_card_id: str | None = None  # Capability card used for assignment
    acceptance_criteria_ids: list[str] = []      # IDs of contract acceptance criteria this task contributes to
    metadata: dict[str, Any] = {}

    @model_validator(mode="after")
    def validate_scores(self) -> Self:
        for field_name in ("ai_suitability", "human_suitability", "confidence"):
            val = getattr(self, field_name)
            if not 0.0 <= val <= 1.0:
                raise ValueError(f"{field_name} must be between 0.0 and 1.0")
        return self

    @model_validator(mode="after")
    def validate_capabilities_not_empty(self) -> Self:
        if not self.required_capabilities:
            raise ValueError("Task must have at least one required capability")
        return self
```

**35-minute ceiling enforcement**: AI tasks (`ai_only` and `either`) must have `estimated_duration.max_minutes <= 35`. Human tasks (`human_only`) and hybrid tasks have no duration ceiling. This is enforced during DAG validation, not on the model itself (the planner may produce a task that needs further decomposition).

### 3.6 DAGEdge

Internal representation for graph operations. Not serialized to storage — derived from `TaskNode.dependencies`.

```python
class DAGEdge(BaseModel):
    from_task_id: str
    to_task_id: str
    dependency_type: DependencyType
```

### 3.7 PlanSummary

Generated by the planner agent alongside the DAG. This is what the buyer sees.

```python
class PlanSummary(BaseModel):
    overview: str                        # 2-3 sentence summary of the plan
    task_list: list[TaskSummaryItem]     # Simplified task list for buyer review
    total_estimated_duration: DurationEstimate
    total_estimated_cost: CostEstimate
    critical_path_length: int            # Number of tasks on the critical path
    parallelizable_tasks: int            # Number of tasks that can run in parallel

class TaskSummaryItem(BaseModel):
    task_id: str
    name: str
    task_type: TaskType
    estimated_duration: DurationEstimate
    estimated_cost: CostEstimate
    depends_on_names: list[str]          # Names (not IDs) of predecessor tasks for readability
```

### 3.8 ExecutionPlan

The top-level object produced by Layer B. Links to the contract and contains the full DAG + buyer-facing summary.

```python
class ExecutionPlan(BaseModel):
    id: str                                      # uuid4
    contract_id: str                             # Reference to the WorkContract
    outcome_id: str                              # Reference to the parent Outcome
    status: ExecutionPlanStatus = ExecutionPlanStatus.PENDING_APPROVAL
    tasks: list[TaskNode]                        # All tasks in the DAG
    summary: PlanSummary                         # Human-readable plan summary
    critical_path: list[str]                     # Ordered list of task IDs on the critical path
    version: int = 1                             # Incremented on replan
    created_at: datetime
    updated_at: datetime
    approved_at: datetime | None = None          # When the buyer approved (or auto-approved)
    approved_by: str | None = None               # Identity ID or "system" for auto-approval
    metadata: dict[str, Any] = {}

    @model_validator(mode="after")
    def validate_task_cap(self) -> Self:
        max_tasks = int(os.getenv("MAX_DAG_TASKS", "50"))
        if len(self.tasks) > max_tasks:
            raise ValueError(f"DAG exceeds maximum of {max_tasks} tasks")
        return self
```

---

## 4. DAG Validation

Validation runs after the planner agent produces a DAG, before the execution plan is persisted or emitted as an event. All checks are deterministic and fast — no LLM calls.

### 4.1 Structural Validation

| Check | Rule | Severity |
|---|---|---|
| Cycle detection | Topological sort of the DAG; if it fails, the DAG has cycles | Error — reject DAG |
| Dangling references | Every `task_id` in `dependencies` must reference an existing task in the DAG | Error — reject DAG |
| Self-references | No task may depend on itself | Error — reject DAG |
| Empty DAG | DAG must have at least one task | Error — reject DAG |
| Task cap | Number of tasks must not exceed `MAX_DAG_TASKS` (default: 50, configurable via env var) | Error — reject DAG |
| Duplicate task IDs | All task IDs must be unique | Error — reject DAG |

### 4.2 Semantic Validation

| Check | Rule | Severity |
|---|---|---|
| Acceptance criteria coverage | Every acceptance criterion ID on the contract must appear in at least one task's `acceptance_criteria_ids` | Error — reject DAG |
| AI duration ceiling | Tasks with `task_type` in (`ai_only`, `either`) must have `estimated_duration.max_minutes <= 35` | Error — reject DAG |
| Capability tags present | Every task must have at least one `required_capabilities` entry | Error — reject DAG (also enforced by model validator) |
| Suitability consistency | If `task_type` is `ai_only`, `ai_suitability` should be > 0.5; if `human_only`, `human_suitability` should be > 0.5 | Warning — log but don't reject |
| Cost coherence | Sum of task `max_usd` estimates should not exceed 3x the contract's `max_cost_usd` (if set) | Warning — log but don't reject |
| Duration coherence | Critical path duration estimate should not exceed 2x the contract's `max_duration` (if set) | Warning — log but don't reject |

### 4.3 Validation Result

```python
class DAGValidationResult(BaseModel):
    valid: bool
    errors: list[str]      # Hard failures — DAG cannot proceed
    warnings: list[str]    # Soft issues — logged, don't block
```

```python
def validate_dag(plan: ExecutionPlan, contract: WorkContract) -> DAGValidationResult:
    ...
```

---

## 5. Critical Path Calculation

The critical path is the longest sequence of hard-dependency-linked tasks through the DAG. It determines the minimum total duration and identifies bottleneck tasks.

### 5.1 Algorithm

1. Topological sort all tasks (also validates acyclicity)
2. For each task, compute the earliest start time = max(earliest finish of all hard predecessors)
3. Earliest finish = earliest start + `estimated_duration.max_minutes`
4. The critical path is the sequence of tasks that determines the overall DAG duration (latest finishing chain)
5. Soft dependencies are ignored for critical path calculation but respected for scheduling hints

### 5.2 Output

The `critical_path` field on `ExecutionPlan` is an ordered list of task IDs representing the longest path. This is recalculated on every replan.

---

## 6. Planner Agent

### 6.1 Design

```python
from agents import Agent, ModelSettings, function_tool
from shared.azure_client import make_model

planner_agent = Agent(
    name="decomposition_planner",
    instructions=PLANNER_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.4),
    tools=[
        decompose_contract,      # Produces the full DAG
        skip_decomposition,      # For trivial contracts — single-task plan
        estimate_duration,       # Helper for duration range estimation
        estimate_cost,           # Helper for cost range estimation
    ],
    output_type=PlannerOutput,
)
```

Lower temperature (0.4) than the intake agent — planning benefits from more deterministic output.

### 6.2 PlannerOutput (Structured Output)

```python
class PlannerOutput(BaseModel):
    execution_plan: ExecutionPlan
    reasoning: str               # Brief explanation of decomposition decisions
    skipped_decomposition: bool  # True if the planner determined decomposition was unnecessary
```

### 6.3 DAG-as-Tool Pattern

The planner agent has two tools for producing plans:

**`decompose_contract`**: Full decomposition. Produces a multi-task DAG with dependencies, estimates, and capability tags.

**`skip_decomposition`**: For trivial contracts that map to a single task. Produces a one-node DAG with no edges. The planner decides which to use based on the contract complexity.

```python
@function_tool
async def decompose_contract(
    ctx: RunContextWrapper[PlannerContext],
    tasks: list[dict],
    summary_overview: str,
) -> str:
    """Decompose a contract into a DAG of executable tasks.

    Args:
        tasks: List of task definitions, each with name, description, task_type,
               required_capabilities, dependencies, suitability scores, and estimates.
        summary_overview: A 2-3 sentence human-readable summary of the plan.
    """
    ...

@function_tool
async def skip_decomposition(
    ctx: RunContextWrapper[PlannerContext],
    task_name: str,
    task_description: str,
    task_type: str,
    required_capabilities: list[str],
    estimated_duration_min: int,
    estimated_duration_max: int,
    estimated_cost_min: float,
    estimated_cost_max: float,
) -> str:
    """Create a single-task execution plan for trivial contracts that don't need decomposition.

    Args:
        task_name: Short name for the task.
        task_description: What the task involves.
        task_type: One of: ai_only, human_only, either, hybrid.
        required_capabilities: Skill tags needed to perform this task.
        estimated_duration_min: Lower bound duration in minutes.
        estimated_duration_max: Upper bound duration in minutes.
        estimated_cost_min: Lower bound cost in USD.
        estimated_cost_max: Upper bound cost in USD.
    """
    ...
```

### 6.4 Planner Context

The planner receives full context assembled by the shared context management service. Layer B defines the interface it needs; the context service is built separately.

```python
@dataclass
class PlannerContext:
    contract: WorkContract                 # The contract to decompose
    outcome: Outcome                       # The parent outcome
    intake_conversation: list[dict]        # Full intake session history
    prior_task_outputs: list[dict] | None  # For replanning: completed task results
    current_dag_state: ExecutionPlan | None # For replanning: current plan with task statuses
```

### 6.5 Context Management Interface

Layer B depends on a shared context management service to assemble `PlannerContext`. The interface:

```python
class ContextService(Protocol):
    async def assemble_planner_context(
        self,
        contract_id: str,
        include_intake_history: bool = True,
        include_prior_outputs: bool = False,
        include_current_dag: bool = False,
    ) -> PlannerContext:
        """Assemble context for the planner agent.

        Handles context window limits via truncation and summarization.
        """
        ...
```

This service is **not implemented in Layer B**. Layer B imports and calls it. The service is a shared utility, possibly part of governance (to be decided during implementation).

### 6.6 Planner System Prompt (Key Behaviors)

The system prompt must encode:

- **Decompose to actionable tasks.** Each task should be a unit of work that a single worker (human or AI) can complete independently, given the outputs of its predecessors.
- **Respect the 35-minute ceiling for AI tasks.** If a task is typed as `ai_only` or `either`, its estimated max duration must not exceed 35 minutes. If it would, decompose further.
- **Human tasks have no duration ceiling.** A gutter cleaning task taking 2 hours is fine as a single task.
- **Use human-friendly estimate ranges.** Never output false precision. Say "2-4 hours" not "3 hours 19 minutes." Provide `display_label` values that a consumer would understand.
- **Map every acceptance criterion.** Every criterion on the contract must be addressed by at least one task. Use `acceptance_criteria_ids` to make the mapping explicit.
- **Free-form capability tags.** Use descriptive, specific skill tags. Prefer "residential_gutter_cleaning" over "cleaning." These are matched via LLM against Layer C's worker profiles, so specificity helps.
- **Be honest about confidence.** If a task is ambiguous or the planner is uncertain, set confidence < 0.7. This signals to Layer D that extra monitoring or a human checkpoint may be needed.
- **For trivial contracts, use `skip_decomposition`.** If the entire contract maps to a single well-defined task, don't force a multi-task DAG.
- **Produce a plan summary.** Always generate a human-readable overview, simplified task list, and aggregate estimates. The buyer may see this before execution starts.

---

## 7. Replanning

### 7.1 Trigger

Replanning is triggered when confidence drops below 0.6 on any task in the critical path. The trigger can come from:

- **Layer B**: During plan execution monitoring (if Layer B monitors confidence updates)
- **Layer D**: During task execution when a task fails or confidence drops
- **Governance layer**: Cross-cutting confidence monitoring

Wherever detected, the triggering layer emits a `replan.requested` event (or calls Layer B directly). Layer B does not self-monitor in v1 — it responds to replan requests.

### 7.2 Replan Scope

When replanning is triggered by a failed/low-confidence task:

1. Identify the failed/degraded task and all tasks that transitively depend on it (direct and indirect hard dependencies)
2. Mark the failed task and its dependents as the **replan scope**
3. Pass the original contract + current DAG state (with completed task outputs) to the planner agent
4. The planner produces a new subgraph for only the replan scope
5. The new subgraph replaces the affected tasks in the DAG
6. Completed tasks are never replanned — their outputs are preserved
7. The execution plan's `version` is incremented

### 7.3 Replan Input

The planner receives the same `PlannerContext` but with:
- `prior_task_outputs` populated with outputs from completed tasks
- `current_dag_state` populated with the current plan, including task statuses

### 7.4 DAG Versioning

- For execution: the current version overwrites the previous plan. Layer D works against the latest version.
- For training: all versions are stored in the database. The full replan history (original plan → replan v2 → replan v3...) is preserved for offline learning.

### 7.5 Replan Limits

To prevent infinite replan loops:

```python
MAX_REPLANS = int(os.getenv("MAX_REPLANS", "3"))
```

After `MAX_REPLANS` replans for a single contract, the system stops replanning and escalates based on buyer's autonomy level:
- Autonomy 1-2: Notify buyer, await decision
- Autonomy 3-4: Based on buyer preference — either notify or auto-fail the contract

---

## 8. Execution Plan Status Lifecycle

The execution plan has its own status field, separate from the contract state machine.

```
PENDING_APPROVAL → APPROVED → EXECUTING → COMPLETE
                                    ↓
                               REPLANNING → EXECUTING
                                    ↓
                                  FAILED
```

### 8.1 Status Transitions

| Transition | Trigger | Notes |
|---|---|---|
| (created) → PENDING_APPROVAL | Plan produced by planner | Default for all plans |
| PENDING_APPROVAL → APPROVED | Buyer approves (autonomy 1 & 2) or auto-approved (autonomy 3 & 4) | Auto-approval checks autonomy level on the contract |
| APPROVED → EXECUTING | Layer D begins task execution | Immediate after approval |
| EXECUTING → COMPLETE | All tasks in `COMPLETE` or `SKIPPED` status | Layer D notifies |
| EXECUTING → REPLANNING | Replan triggered | Execution pauses on affected tasks |
| REPLANNING → EXECUTING | New subgraph validated and spliced in | Execution resumes |
| EXECUTING → FAILED | Unrecoverable failure or max replans exceeded | Escalation per autonomy level |
| REPLANNING → FAILED | Replan itself fails (planner can't produce valid DAG) | Escalation per autonomy level |

### 8.2 Auto-Approval Logic

```python
def should_auto_approve(contract: WorkContract) -> bool:
    """Determine if the plan should be auto-approved based on autonomy level."""
    return contract.autonomy_level in (AutonomyLevel.AGENT, AutonomyLevel.DELEGATE)
```

For autonomy levels 1 (Advisor) and 2 (Facilitator), the plan enters `PENDING_APPROVAL` and the buyer is notified. The buyer sees the `PlanSummary` (overview + simplified task list) and can also inspect the raw DAG. Execution does not begin until the buyer approves.

For autonomy levels 3 (Agent) and 4 (Delegate), the plan is auto-approved and immediately transitions to `APPROVED`.

---

## 9. Events

### 9.1 Inbound Events (Layer B Listens)

| Topic | Event | Action |
|---|---|---|
| `pln.contracts` | `contract.state_changed` (new_state = ACTIVE) | Trigger decomposition for the contract |

Layer B subscribes to the contracts topic and filters for ACTIVE transitions.

### 9.2 Outbound Events (Layer B Emits)

```python
class ExecutionPlanCreatedEvent(BaseModel):
    event_type: Literal["execution_plan.created"] = "execution_plan.created"
    plan_id: str
    contract_id: str
    outcome_id: str
    status: ExecutionPlanStatus          # PENDING_APPROVAL or APPROVED (if auto-approved)
    task_count: int
    critical_path_length: int
    skipped_decomposition: bool
    timestamp: datetime

class ExecutionPlanReplannedEvent(BaseModel):
    event_type: Literal["execution_plan.replanned"] = "execution_plan.replanned"
    plan_id: str
    contract_id: str
    outcome_id: str
    version: int                         # New version number
    affected_task_ids: list[str]         # Tasks that were replanned
    new_task_ids: list[str]              # New tasks added by the replan
    timestamp: datetime

class ExecutionPlanApprovedEvent(BaseModel):
    event_type: Literal["execution_plan.approved"] = "execution_plan.approved"
    plan_id: str
    contract_id: str
    approved_by: str                     # Identity ID or "system"
    timestamp: datetime

class ExecutionPlanFailedEvent(BaseModel):
    event_type: Literal["execution_plan.failed"] = "execution_plan.failed"
    plan_id: str
    contract_id: str
    reason: str
    timestamp: datetime
```

### 9.3 Event Topics

| Topic | Events |
|---|---|
| `pln.execution_plans` | `execution_plan.created`, `execution_plan.replanned`, `execution_plan.approved`, `execution_plan.failed` |

---

## 10. Error Handling

### 10.1 Decomposition Failures

| Failure | Behavior |
|---|---|
| Planner produces invalid DAG (fails validation) | Retry once with explicit validation feedback in the prompt. If second attempt fails, emit `execution_plan.failed` event. |
| Planner times out | Retry once. If second attempt times out, emit `execution_plan.failed`. |
| Planner produces DAG exceeding task cap | Retry with instruction to reduce granularity. If second attempt still exceeds, emit `execution_plan.failed`. |
| Context assembly fails (context service unavailable) | Emit `execution_plan.failed`. Contract stays ACTIVE. Buyer notified based on autonomy level. |

### 10.2 Contract State on Plan Failure

When decomposition fails critically:
- The contract **stays in ACTIVE state** (no automatic reversion)
- Based on buyer preference (autonomy level):
  - Autonomy 1-2: Buyer is notified and asked how to proceed
  - Autonomy 3-4: System may retry, attempt with simplified parameters, or notify buyer
- If the failure requires changes to the outcome or major contract renegotiation, the contract transitions back to REQUIREMENTS state. This transition goes through the governance layer.

### 10.3 Replan Failures

| Failure | Behavior |
|---|---|
| Replan produces invalid subgraph | Retry once. If second attempt fails, mark plan as FAILED. |
| Max replans exceeded | Mark plan as FAILED. Escalate per autonomy level. |
| Replan requested for non-critical-path task | Still replan the dependent subgraph, but with lower priority. |

---

## 11. Configuration

| Variable | Default | Description |
|---|---|---|
| `MAX_DAG_TASKS` | `50` | Maximum number of tasks in a single DAG |
| `MAX_REPLANS` | `3` | Maximum number of replans per contract before escalation |
| `AI_TASK_MAX_DURATION_MINUTES` | `35` | Maximum duration for AI tasks (the degradation threshold) |
| `REPLAN_CONFIDENCE_THRESHOLD` | `0.6` | Confidence floor on critical-path tasks that triggers replanning |
| `PLANNER_TEMPERATURE` | `0.4` | Temperature for the planner agent |
| `PLANNER_MAX_RETRIES` | `1` | Number of retries on planner failure |
| `AZURE_OPENAI_KEY` | (required) | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | (required) | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` | Model deployment name |

---

## 12. File Structure

```
packages/decomposition/
├── __init__.py
├── models.py              # All Pydantic models (Sections 3.1-3.8)
├── planner.py             # Planner agent definition, tools, PlannerOutput
├── dag.py                 # DAG data structures, topological sort, critical path
├── validation.py          # Structural + semantic DAG validation (Section 4)
├── replan.py              # Replanning logic, scope calculation, version management
├── events.py              # Event models + emission helpers (Section 9)
├── listener.py            # Kafka consumer for contract.state_changed events
└── tests/
    ├── __init__.py
    ├── test_models.py         # Model construction, validation, edge cases
    ├── test_dag.py            # Topological sort, critical path, cycle detection
    ├── test_validation.py     # All validation rules (structural + semantic)
    ├── test_planner.py        # Planner agent with mocked LLM responses
    ├── test_replan.py         # Replan scope calculation, version management
    └── test_listener.py       # Event-driven trigger from contract state changes
```

---

## 13. Testing Strategy

All tests use pytest + pytest-asyncio. LLM calls are mocked.

### 13.1 Model Tests (`test_models.py`)

- Construction of all models with valid data
- Rejection of invalid data (out-of-range suitability scores, negative costs, inverted ranges)
- DurationEstimate and CostEstimate range validation
- TaskNode capability tag requirement
- ExecutionPlan task cap enforcement
- Serialization round-trip

### 13.2 DAG Algorithm Tests (`test_dag.py`)

- Topological sort of valid DAGs (linear, diamond, wide-parallel)
- Cycle detection (direct cycle, indirect cycle, self-reference)
- Critical path calculation for known DAG structures
- Critical path with mixed hard/soft dependencies (soft ignored)
- Single-task DAG (trivial case)
- DAG with all tasks parallel (critical path = longest single task)

### 13.3 Validation Tests (`test_validation.py`)

- Structural: cycles, dangling refs, duplicate IDs, empty DAG, task cap
- Semantic: acceptance criteria coverage (all covered, some missing, none mapped)
- AI duration ceiling (35-min violation for ai_only, no violation for human_only)
- Suitability consistency warnings
- Cost and duration coherence warnings against contract SLA

### 13.4 Planner Agent Tests (`test_planner.py`)

- Mock LLM returns valid multi-task DAG for a complex contract
- Mock LLM uses `skip_decomposition` for a trivial contract
- Mock LLM returns invalid DAG → retry → valid DAG on second attempt
- Mock LLM returns invalid DAG twice → plan failure event emitted
- Plan summary generation with human-friendly labels
- Auto-approval for autonomy levels 3 & 4
- Pending approval for autonomy levels 1 & 2

### 13.5 Replan Tests (`test_replan.py`)

- Replan scope calculation: only dependent tasks are included
- Completed tasks are preserved across replan
- Plan version is incremented
- Max replan limit enforced
- Replan with no dependent tasks (leaf task failure — replan scope is just that task)

### 13.6 Event Listener Tests (`test_listener.py`)

- `contract.state_changed` to ACTIVE triggers decomposition
- `contract.state_changed` to other states is ignored
- Decomposition failure emits `execution_plan.failed`
- Successful decomposition emits `execution_plan.created`

---

## 14. Key Design Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | DAG-as-tool: planner decides if decomposition is needed | Avoids expensive LLM calls for trivial single-task contracts |
| 2 | Rich internal DAG representation (nodes + edges as objects), serialized to adjacency list | Supports replanning (splice subgraphs, recalculate critical path) cleanly |
| 3 | 35-minute ceiling applies to AI tasks only | Human tasks have fundamentally different duration profiles |
| 4 | Free-form capability tags matched via LLM | No premature taxonomy; matched against Layer C profiles by LLM at routing time |
| 5 | Human-friendly estimate ranges, not point values | Consumers can't act on false precision; "2-4 hours" is more honest than "3h 19m" |
| 6 | Execution plan has its own status lifecycle | Separates plan approval from contract state; buyer approval gate lives on the plan, not the contract state machine |
| 7 | Replanning replaces only dependent tasks | Minimizes disruption; completed work is preserved |
| 8 | Old DAG versions stored for training, overwritten for execution | Execution needs a single source of truth; training needs history |
| 9 | Context management is an external service, not built into Layer B | Shared utility that all layers can use; avoids duplicating context assembly logic |
| 10 | Single LLM call for decomposition + suitability scoring | Pragmatic for v1; separate classification pass is a v2 optimization if quality is insufficient |
| 11 | Planner temperature 0.4 (lower than intake agent) | Planning benefits from more deterministic output |
| 12 | Max 3 replans before escalation | Prevents infinite replan loops while giving the system reasonable recovery attempts |
