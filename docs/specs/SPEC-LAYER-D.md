# Layer D — Execution, Evaluation, and Handoff Protocol: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Approved for implementation
**Dependencies:** SPEC-LAYER-A.md, SPEC-LAYER-B.md, SPEC-LAYER-C.md, ADR-003, ADR-004

---

## 1. Purpose

Layer D is the runtime that actually performs work. It orchestrates DAG execution, dispatches tasks to AI agents and human workers, evaluates every output against acceptance criteria, manages handoffs between worker types, handles retry and escalation, enforces autonomy gates, streams real-time progress, and manages dispute resolution.

Layer D is an **execution layer** — necessary infrastructure but not a compounding moat. Its value is in reliability, not defensibility.

---

## 2. Scope

### In Scope (v1)

- **DAG orchestrator**: Persistent orchestrator agent that walks the DAG, starts tasks when dependencies resolve, manages parallel execution (max 10 concurrent, configurable)
- **Task execution**: Orchestrator delegates to task-type-specific agents (library) via SDK handoffs/agents-as-tools, with generic agent fallback
- **Human task management**: Dispatch via SMS/email/in-app notification, collect self-report completion + buyer confirmation, evidence collection (photo/video)
- **Evaluator**: Single evaluator agent (separate model from execution), access to execution trace + own measurement tools, evaluates at aggregate output level, produces pass/fail + quality score + deficiency notes
- **Retry cascade**: Same worker → reroute to next-best (Layer C) → replan trigger (Layer B). Last stable state passed to next worker.
- **Handoffs**: Conceptual state changes. Agent-to-agent uses SDK handoffs. Human involvement changes communication channel.
- **Context preservation**: Last stable state serialized and passed on failure/handoff. 35-minute safety net with context summarization for AI tasks.
- **Progress tracking**: Single SSE endpoint per contract, all events with importance field, weighted progress percentage, events stored in Cosmos DB for replay
- **Timeout**: Soft at 80% of max_duration, hard at 100% triggers reroute. 35-minute safety net for AI tasks.
- **Autonomy gates**: Layer D owns task-level gate checks using LLM-first risk scoring. Cross-cutting dependencies evaluated by governance layer.
- **Dispute resolution**: AI agent recommends resolution (refund/redo/partial_credit/dismissed), buyer makes final decision
- **Artifact storage**: Task outputs stored in Cosmos DB

### Deferred (see DEFERRED.md)

- Human QA workers for evaluation (buyer does QA for v1)
- Multi-dimensional learned risk scoring weights (LLM-based for v1)
- Agent-to-external-platform execution (platform adapters)
- Task-type-specific evaluators (single evaluator for v1)
- In-flight re-decomposition within Layer D (replan delegates to Layer B)

---

## 3. Data Models

All models use Pydantic v2 `BaseModel` with strict typing.

### 3.1 Enums

```python
class TaskExecutionState(str, Enum):
    """Full task lifecycle state — extends Layer C's TaskMatchState with execution states."""
    # Matching states (owned by Layer C)
    PENDING = "pending"
    READY = "ready"
    MATCHING = "matching"
    MATCHED = "matched"
    ASSIGNED = "assigned"
    # Execution states (owned by Layer D)
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"              # Human task waiting for scheduled work
    EVALUATING = "evaluating"
    PASSED = "passed"              # Evaluation passed
    FAILED_EVALUATION = "failed_evaluation"  # Evaluation failed, retry possible
    NEEDS_REVIEW = "needs_review"  # Routed to buyer for QA
    RETRYING = "retrying"          # Retry in progress
    REROUTING = "rerouting"        # Being rerouted to new worker via Layer C
    COMPLETE = "complete"
    FAILED = "failed"
    SKIPPED = "skipped"

class HandoffType(str, Enum):
    CAPABILITY_BOUNDARY = "capability_boundary"    # Current worker can't do next step
    CONFIDENCE_DROP = "confidence_drop"            # Worker confidence below threshold
    AUTONOMY_GATE = "autonomy_gate"                # Action exceeds risk tolerance
    DELEGATION_REQUEST = "delegation_request"      # Explicit delegation
    PLATFORM_BOUNDARY = "platform_boundary"        # Work must happen on external platform

class DisputeOutcome(str, Enum):
    REFUND = "refund"
    REDO = "redo"
    PARTIAL_CREDIT = "partial_credit"
    DISMISSED = "dismissed"          # Frivolous dispute

class EventImportance(str, Enum):
    CRITICAL = "critical"            # Failures, SLA breaches, disputes
    HIGH = "high"                    # Task completions, evaluations, handoffs
    MEDIUM = "medium"                # Task state changes, progress milestones
    LOW = "low"                      # Intermediate progress, heartbeats
    DEBUG = "debug"                  # Execution traces, internal state
```

### 3.2 TaskExecution

Runtime state for a task during execution. Extends the `TaskNode` from Layer B with execution-specific fields.

```python
class TaskExecution(BaseModel):
    task_id: str                                     # References TaskNode.id from Layer B
    contract_id: str
    outcome_id: str
    execution_state: TaskExecutionState = TaskExecutionState.ASSIGNED
    assigned_provider_id: str | None = None          # From Layer C matching
    assigned_capability_card_id: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    actual_duration_minutes: float | None = None
    actual_cost_usd: float | None = None
    retry_count: int = 0
    max_retries: int = 2                             # Configurable
    last_stable_state: dict[str, Any] | None = None  # Serialized intermediate state for handoff/retry
    artifact_refs: list[str] = []                    # Cosmos DB references to task outputs
    execution_trace_ref: str | None = None           # Cosmos DB reference to execution trace
    evaluation: TaskEvaluation | None = None
    handoff_history: list[HandoffRecord] = []
    state_history: list[TaskStateTransition] = []
    metadata: dict[str, Any] = {}
```

### 3.3 TaskStateTransition

```python
class TaskStateTransition(BaseModel):
    from_state: TaskExecutionState
    to_state: TaskExecutionState
    triggered_by: str                    # Identity ID, agent ID, or "system"
    timestamp: datetime
    reason: str | None = None
    autonomy_gate_result: str | None = None
```

### 3.4 TaskEvaluation

```python
class TaskEvaluation(BaseModel):
    task_id: str
    evaluator_model: str                 # Which model performed the evaluation
    passed: bool
    quality_score: float                 # 0.0-1.0
    deficiency_notes: list[str] = []     # Specific issues for retry guidance
    acceptance_criteria_results: list[CriterionResult] = []
    evaluation_trace_ref: str | None = None  # Cosmos DB reference
    evaluated_at: datetime

class CriterionResult(BaseModel):
    criterion_id: str                    # References AcceptanceCriterion.id from Layer A
    passed: bool
    score: float                         # 0.0-1.0
    notes: str | None = None
```

### 3.5 HandoffRecord

```python
class HandoffRecord(BaseModel):
    id: str                              # uuid4
    task_id: str
    handoff_type: HandoffType
    from_identity_id: str
    to_identity_id: str | None = None    # None if handoff target not yet determined
    reason: str
    context_passed: dict[str, Any]       # What context was transferred
    timestamp: datetime
```

### 3.6 DisputeRecord

```python
class DisputeRecord(BaseModel):
    id: str                              # uuid4
    contract_id: str
    task_id: str | None = None           # Specific task disputed, or None for contract-level
    raised_by: str                       # Identity ID of the disputant
    reason: str                          # Why the dispute was raised
    evidence_refs: list[str] = []        # Cosmos DB references to evidence
    ai_recommendation: DisputeRecommendation | None = None
    buyer_decision: DisputeOutcome | None = None
    resolved_at: datetime | None = None
    created_at: datetime

class DisputeRecommendation(BaseModel):
    recommended_outcome: DisputeOutcome
    reasoning: str                       # AI agent's explanation
    confidence: float                    # 0.0-1.0
    alternative_outcomes: list[dict[str, str]] = []  # Other options with brief rationale
```

### 3.7 ProgressSnapshot

Computed state for the SSE stream.

```python
class ProgressSnapshot(BaseModel):
    contract_id: str
    outcome_id: str
    overall_progress: float              # 0.0-1.0, weighted by estimated duration
    tasks_total: int
    tasks_complete: int
    tasks_in_progress: int
    tasks_failed: int
    tasks_pending: int
    critical_path_progress: float        # 0.0-1.0, progress along critical path
    cost_accumulated_usd: float
    cost_budget_usd: float | None = None
    sla_on_track: bool
    estimated_completion: datetime | None = None
    timestamp: datetime
```

### 3.8 ExecutionEvent

All events emitted to the SSE stream and stored in Cosmos DB.

```python
class ExecutionEvent(BaseModel):
    id: str                              # uuid4
    contract_id: str
    outcome_id: str
    event_type: str                      # e.g., "task.state_changed", "task.evaluation_complete", "handoff.occurred"
    importance: EventImportance
    payload: dict[str, Any]              # Event-specific data
    timestamp: datetime
    sequence_number: int                 # Monotonically increasing per contract, for replay ordering
```

---

## 4. DAG Orchestrator

### 4.1 Design

The orchestrator is a persistent agent that manages the lifecycle of all tasks in an execution plan. It runs for the duration of the contract and is the central coordination point for Layer D.

```python
orchestrator_agent = Agent(
    name="dag_orchestrator",
    instructions=ORCHESTRATOR_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.2),
    tools=[
        dispatch_ai_task,            # Delegate to a task-specific AI agent
        dispatch_human_task,         # Send task to human worker via notification
        check_task_dependencies,     # Query which tasks are now READY
        get_dag_state,               # Current state of all tasks in the DAG
        trigger_evaluation,          # Send task output to evaluator
        trigger_reroute,             # Request new worker from Layer C
        trigger_replan,              # Request replan from Layer B
        record_handoff,              # Log a handoff event
        pause_task,                  # Pause a task (human tasks waiting for schedule)
        resume_task,                 # Resume a paused task
        check_sla_status,            # Check time/cost against SLA
        emit_progress,               # Emit progress snapshot to SSE
    ],
)
```

### 4.2 Orchestrator System Prompt (Key Behaviors)

- **Walk the DAG**: When a task completes, check which dependent tasks are now READY and dispatch them
- **Respect concurrency limits**: Never exceed `MAX_CONCURRENT_TASKS` active tasks per contract
- **Monitor SLA**: Track accumulated cost and elapsed time against contract SLA. Emit warnings at 80% budget/time.
- **Handle human task pacing**: Human tasks may take hours or days. Pause the task, queue dependent work, and continue with independent branches. Resume when the human reports progress.
- **AI task safety net**: If an AI task approaches 35 minutes, summarize context and prepare for handoff/retry
- **Deficiency feedback loop**: When evaluation fails, pass deficiency notes to the retry worker as additional instructions
- **Escalation judgment**: Use LLM reasoning to decide whether a failure is retryable, reroutable, or requires replanning

### 4.3 Orchestrator Lifecycle

```
ExecutionPlan.status → EXECUTING
        │
        ▼
Orchestrator starts
        │
        ├─── Scan DAG for READY tasks
        ├─── Dispatch tasks (AI or human)
        ├─── Wait for task completion events
        ├─── Evaluate completed tasks
        ├─── Handle failures (retry → reroute → replan)
        ├─── Dispatch newly READY tasks
        ├─── Emit progress events
        │
        ▼
All tasks COMPLETE or FAILED
        │
        ▼
Aggregate evaluation at contract level
        │
        ▼
Contract → VERIFICATION
```

### 4.4 Concurrency Control

```python
MAX_CONCURRENT_TASKS = int(os.getenv("MAX_CONCURRENT_TASKS", "10"))
```

The orchestrator tracks active tasks and holds READY tasks in a queue when the concurrency limit is reached. Priority for dispatch:
1. Critical path tasks (highest priority)
2. Tasks with earlier deadlines
3. Tasks with more dependents (unblocks more downstream work)

---

## 5. Task Execution

### 5.1 AI Task Execution

The orchestrator delegates AI tasks to specialized agents using the OpenAI Agents SDK's handoff and agent-as-tool patterns. The orchestrator agent decides which specialized agent to invoke based on the task description and required capabilities.

```python
# Agent library — task-type-specific agents registered as tools
content_writer_agent = Agent(
    name="content_writer",
    instructions="Write high-quality content based on the task brief.",
    model=make_model(),
    tools=[web_search, write_document, ...],
    handoff_description="Handles content writing tasks: articles, blog posts, copy, show notes.",
)

web_researcher_agent = Agent(
    name="web_researcher",
    instructions="Research topics thoroughly using web search and produce structured findings.",
    model=make_model(),
    tools=[WebSearchTool(), summarize_findings, ...],
    handoff_description="Handles web research tasks: fact-finding, competitive analysis, market research.",
)

data_analyst_agent = Agent(
    name="data_analyst",
    instructions="Analyze data and produce insights with visualizations.",
    model=make_model(),
    tools=[code_interpreter, analyze_data, ...],
    handoff_description="Handles data analysis tasks: statistics, visualization, trend analysis.",
)

generic_executor_agent = Agent(
    name="generic_executor",
    instructions="Execute the given task to the best of your ability.",
    model=make_model(),
    tools=[WebSearchTool(), code_interpreter, write_document, ...],
    handoff_description="General-purpose executor for tasks that don't match a specialist.",
)

# Orchestrator uses these as tools or handoff targets
orchestrator_agent = Agent(
    name="dag_orchestrator",
    instructions=ORCHESTRATOR_SYSTEM_PROMPT,
    model=make_model(),
    tools=[
        content_writer_agent.as_tool(
            tool_name="execute_content_task",
            tool_description="Execute content writing tasks.",
        ),
        web_researcher_agent.as_tool(
            tool_name="execute_research_task",
            tool_description="Execute web research tasks.",
        ),
        data_analyst_agent.as_tool(
            tool_name="execute_analysis_task",
            tool_description="Execute data analysis tasks.",
        ),
        generic_executor_agent.as_tool(
            tool_name="execute_generic_task",
            tool_description="Execute tasks that don't match a specialist agent.",
        ),
        # ... other orchestrator tools
    ],
)
```

**Agent selection**: The orchestrator LLM decides which specialized agent to invoke based on the task's `required_capabilities`, `description`, and `task_type`. If no specialist matches, it falls back to the generic executor.

### 5.2 AI Task Execution Flow

1. Orchestrator dispatches task to selected AI agent via `agent.as_tool()`
2. AI agent receives: task description, acceptance criteria it maps to, context from completed predecessor tasks, deficiency notes (if retry)
3. AI agent executes, producing output artifacts
4. Artifacts stored in Cosmos DB, execution trace stored separately
5. Orchestrator triggers evaluation
6. On pass: task → COMPLETE, check for newly READY dependents
7. On fail: deficiency notes attached, retry cascade initiated

### 5.3 AI Task Safety Net (35-Minute Ceiling)

```python
AI_TASK_TIMEOUT_MINUTES = int(os.getenv("AI_TASK_TIMEOUT_MINUTES", "35"))
AI_TASK_SOFT_TIMEOUT_RATIO = float(os.getenv("AI_TASK_SOFT_TIMEOUT_RATIO", "0.8"))
```

- At 80% of timeout (28 minutes): summarize current context, checkpoint intermediate state
- At 100% (35 minutes): force stop, serialize last stable state, trigger retry with summarized context

### 5.4 Human Task Execution

Human tasks follow a different flow — Layer D is the project manager, not the executor.

```python
@function_tool
async def dispatch_human_task(
    ctx: RunContextWrapper[OrchestratorContext],
    task_id: str,
    provider_identity_id: str,
    notification_channels: list[str],
    task_brief: str,
) -> str:
    """Dispatch a task to a human worker via configured notification channels.

    Args:
        task_id: The task to dispatch
        provider_identity_id: The assigned human worker's identity ID
        notification_channels: Channels to use (e.g., ["in_app", "sms", "email"])
        task_brief: Human-readable task description and instructions
    """
    ...
```

### 5.5 Human Task Flow

1. Orchestrator sends notification to human worker via configured channels (preference: in-app, with SMS/email as invitations to the platform)
2. Notification includes: task brief, acceptance criteria, deadline, instructions for reporting completion
3. Task enters IN_PROGRESS (or PAUSED if scheduled for future)
4. Human self-reports completion with evidence (photo, video, text description)
5. Buyer confirms completion (for v1)
6. Orchestrator triggers evaluation
7. On pass: task → COMPLETE
8. On fail: deficiency notes sent to human, retry or reroute

### 5.6 Human Task Pacing

Human tasks may take hours or days. The orchestrator handles this via the PAUSED state:

- Task is ASSIGNED → worker acknowledges → IN_PROGRESS
- If the task is scheduled for a future time (e.g., "gutter cleaning next Tuesday") → PAUSED
- The orchestrator continues dispatching independent branches of the DAG
- When the human reports progress or completion → task resumes
- Heartbeat mechanism: periodic check-in notifications at configurable intervals for long-running tasks

```python
HUMAN_TASK_CHECKIN_HOURS = int(os.getenv("HUMAN_TASK_CHECKIN_HOURS", "24"))
```

---

## 6. Evaluation Engine

### 6.1 Design

A single evaluator agent, using a separate (typically stronger) model from execution agents. Never the same model that performed the work.

```python
evaluator_agent = Agent(
    name="task_evaluator",
    instructions=EVALUATOR_SYSTEM_PROMPT,
    model=make_model(deployment=os.getenv("EVALUATOR_DEPLOYMENT", "gpt-5.2")),
    model_settings=ModelSettings(temperature=0.2),
    tools=[
        fetch_task_output,           # Retrieve artifacts from Cosmos DB
        fetch_execution_trace,       # Retrieve execution trace for context
        fetch_acceptance_criteria,   # Get criteria from Layer A contract
        measure_metric,              # Tool for measuring quantitative thresholds
        compare_outputs,             # Compare task output against reference/standard
    ],
    output_type=TaskEvaluation,
)
```

### 6.2 Evaluator System Prompt (Key Behaviors)

- **Evaluate against acceptance criteria**: For each criterion the task maps to, produce a pass/fail + score
- **Use execution trace for context**: Understand how the work was done, not just the final output. Suggest modifications based on the process, not just the result.
- **Be specific in deficiency notes**: "The article lacks citations for statistical claims in paragraphs 2 and 4" is useful. "Could be better" is not.
- **Threshold criteria**: Use measurement tools to independently verify metrics. Don't trust self-reported measurements.
- **Binary checks**: Evaluate strictly — either the condition is met or it isn't.
- **LLM evaluation criteria**: Apply your judgment to assess quality. Layer A stores the criterion type; you determine methodology.
- **Human judgment criteria**: Flag these for buyer review (NEEDS_REVIEW state). Provide your assessment as a recommendation, not a decision.

### 6.3 Evaluation Modes

| Criterion Type | Evaluation Mode | Behavior |
|---|---|---|
| `binary_check` | Automated | Pass/fail, no ambiguity |
| `threshold` | Metric-based | Evaluator uses tools to measure; pass if value >= target |
| `human_judgment` | Buyer review | Evaluator provides recommendation; task enters NEEDS_REVIEW; buyer makes final call |
| `llm_evaluation` | Automated (LLM) | Evaluator applies judgment; produces score + reasoning |

### 6.4 Aggregate Evaluation

When all tasks in a contract are complete, the evaluator performs an aggregate evaluation:

1. Collect all task-level evaluation results
2. Map results back to contract-level acceptance criteria
3. Apply the contract's `CompletionMode` (default: `MAJORITY_PASS`)
4. Produce a contract-level evaluation summary
5. Contract transitions to VERIFICATION → COMPLETE (if passed) or VERIFICATION → DISPUTED (if failed)

```python
class ContractEvaluation(BaseModel):
    contract_id: str
    overall_passed: bool
    completion_mode: CompletionMode
    criteria_results: list[CriterionResult]    # Aggregated across all tasks
    overall_quality_score: float               # 0.0-1.0 weighted average
    summary: str                               # Human-readable evaluation summary
    evaluated_at: datetime
```

---

## 7. Retry and Escalation

### 7.1 Retry Cascade

When a task fails evaluation:

```
Step 1: Retry with same worker
        ├── Pass deficiency notes as additional instructions
        ├── Pass last stable state for resumption
        ├── Increment retry_count
        ├── If retry_count <= max_retries → re-execute
        └── If retry_count > max_retries → Step 2

Step 2: Reroute to next-best worker
        ├── Request new candidate from Layer C (emit matching.reroute_requested)
        ├── Layer C returns next-best candidate from original matching
        ├── Assign new worker, pass last stable state + deficiency notes
        └── If no candidates available → Step 3

Step 3: Trigger replan
        ├── Emit replan.requested to Layer B
        ├── Layer B replans the dependent subgraph
        └── If replan fails → task FAILED, escalate per autonomy level
```

### 7.2 Failure State Serialization

On any task failure or handoff, the last stable state is serialized:

```python
class LastStableState(BaseModel):
    task_id: str
    checkpoint_at: datetime
    intermediate_outputs: list[str]      # Cosmos DB refs to partial artifacts
    execution_context_summary: str       # Summarized context for the next worker
    progress_description: str            # What was done, what remains
    deficiency_notes: list[str]          # From evaluation, if applicable
```

The next worker receives this and can choose to resume from the checkpoint or start fresh. For AI tasks, the agent is instructed to resume. For human tasks, the brief includes the previous work and what remains.

---

## 8. Handoffs

### 8.1 Handoff Model

Handoffs are conceptual state changes. Agent-to-agent handoffs use the SDK's handoff mechanism. Human involvement changes the communication channel but not the data model.

### 8.2 Handoff Triggers

| Trigger | Detection | Action |
|---|---|---|
| Capability boundary | Orchestrator determines current worker can't do the next task type | Route to Layer C for new matching |
| Confidence drop | AI agent signals confidence < 0.7 during execution | Checkpoint state, reroute or escalate to human |
| Autonomy gate | LLM risk scoring determines action exceeds tolerance | Pause task, notify buyer, await approval |
| Delegation request | Worker explicitly requests handoff | Record reason, route to Layer C |
| Platform boundary | Task must execute on an external platform | Deferred for v1 |

### 8.3 Agent-to-Agent Handoff

When an AI task is rerouted to a different AI worker:

```python
# SDK handoff pattern for agent-to-agent transitions
handoff_agent = Agent(
    name="handoff_coordinator",
    instructions="Coordinate the transfer of work between agents. Ensure context is preserved.",
    model=make_model(),
    handoffs=[
        handoff(
            agent=target_agent,
            tool_name="transfer_to_specialist",
            tool_description="Transfer work to the specialist agent with full context.",
            on_handoff=record_handoff_callback,
        ),
    ],
)
```

### 8.4 Human Involvement Handoff

When a task transitions between AI and human (or vice versa):
- AI → Human: Task brief generated from AI's execution context + intermediate outputs. Sent via configured notification channels.
- Human → AI: Human's completion report + evidence collected. AI agent receives as structured input.
- The communication channel changes but the task record is continuous.

---

## 9. Autonomy Gates

### 9.1 LLM-First Risk Scoring

Layer D uses an LLM agent for risk scoring at task-level state transitions. This replaces rule-based threshold checks with contextual reasoning.

```python
risk_scorer_agent = Agent(
    name="risk_scorer",
    instructions=RISK_SCORING_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.1),
    output_type=RiskAssessment,
)

class RiskAssessment(BaseModel):
    risk_score: float                    # 0.0-1.0
    requires_approval: bool
    reasoning: str
    risk_dimensions: dict[str, float]    # Breakdown by dimension
```

### 9.2 Risk Scoring Prompt (Key Behaviors)

Evaluate risk across these dimensions:
- **Monetary value**: Higher cost = higher risk
- **Irreversibility**: Can this action be undone? Gutter cleaning can't be un-cleaned.
- **Category sensitivity**: Medical, legal, financial tasks are inherently higher risk
- **Participant trust**: New worker with 2 AWP jobs vs. veteran with 50
- **Dispute history**: Similar tasks/workers with high dispute rates
- **Novelty**: First time the system has handled this task type

### 9.3 Gate Logic

```python
async def check_autonomy_gate(
    task: TaskExecution,
    contract: WorkContract,
    transition: TaskStateTransition,
) -> GateResult:
    """Check if a task state transition requires buyer approval."""
    # Layer D owns task-level gates
    risk = await Runner.run(risk_scorer_agent, input=gate_context)

    autonomy_level = contract.autonomy_level

    if autonomy_level == AutonomyLevel.ADVISOR:
        # Everything requires approval
        return GateResult(approved=False, requires_buyer_action=True)

    elif autonomy_level == AutonomyLevel.FACILITATOR:
        # All commitments require approval
        return GateResult(approved=False, requires_buyer_action=True)

    elif autonomy_level == AutonomyLevel.AGENT:
        # Auto-approve within risk tolerance
        if risk.final_output.requires_approval:
            return GateResult(approved=False, requires_buyer_action=True)
        return GateResult(approved=True, auto_approved=True)

    elif autonomy_level == AutonomyLevel.DELEGATE:
        # Auto-approve unless high risk
        if risk.final_output.risk_score > 0.8:
            return GateResult(approved=False, requires_buyer_action=True)
        return GateResult(approved=True, auto_approved=True)

class GateResult(BaseModel):
    approved: bool
    auto_approved: bool = False
    requires_buyer_action: bool = False
    risk_assessment: RiskAssessment | None = None
```

### 9.4 Cross-Cutting Dependencies

For transitions that affect other layers (e.g., contract state changes, amendment flows), Layer D delegates to the governance layer:

```python
# Layer D handles task-level gates locally
# Cross-cutting concerns go to governance
governance_result = await governance.validate_transition(transition_request)
```

---

## 10. Dispute Resolution

### 10.1 Dispute Agent

```python
dispute_agent = Agent(
    name="dispute_mediator",
    instructions=DISPUTE_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.3),
    tools=[
        fetch_contract_details,      # Full contract with acceptance criteria
        fetch_task_evaluations,      # All evaluation results
        fetch_evidence,              # Evidence submitted by both parties
        fetch_communication_history, # Relevant communications
        fetch_handoff_history,       # Handoff records for context
    ],
    output_type=DisputeRecommendation,
)
```

### 10.2 Dispute Flow

1. Contract enters DISPUTED state (from VERIFICATION)
2. Evidence is compiled: deliverables, acceptance criteria results, evaluation scores, communication history, handoff records
3. Dispute agent reviews all evidence and produces a recommendation
4. Recommendation presented to buyer with: recommended outcome, reasoning, confidence, and alternative outcomes
5. Buyer decides: accept recommendation or choose alternative
6. Dispute resolved: contract transitions to ACTIVE (redo), COMPLETE (partial credit/dismissed), or FAILED (refund)
7. Dispute outcome feeds into Layer E reputation scoring for both parties

### 10.3 Dispute System Prompt (Key Behaviors)

- **Review all evidence objectively**: Don't favor buyer or provider
- **Check acceptance criteria carefully**: Were they met? Were they ambiguous?
- **Consider the execution trace**: Did the provider make a good-faith effort?
- **Propose fair outcomes**: Redo for fixable issues, partial credit for partial completion, refund for non-delivery, dismiss for frivolous disputes
- **Explain reasoning clearly**: The buyer must understand why you recommend what you recommend
- **Present alternatives**: Always show at least 2 options with reasoning

---

## 11. Progress Tracking & SSE

### 11.1 SSE Endpoint

Single SSE endpoint per contract. All events are emitted with an importance field. The client (Layer F) decides what to display based on the buyer's autonomy level and preferences.

```python
# FastAPI SSE endpoint
@app.get("/contracts/{contract_id}/events")
async def contract_event_stream(contract_id: str):
    async def event_generator():
        # On connect: replay stored events from Cosmos DB
        stored_events = await get_stored_events(contract_id)
        for event in stored_events:
            yield f"data: {event.model_dump_json()}\n\n"

        # Then stream live events
        async for event in subscribe_to_contract_events(contract_id):
            yield f"data: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
```

### 11.2 Event Replay

All events are stored in Cosmos DB with a monotonically increasing `sequence_number` per contract. On SSE reconnection, the client can request replay from a specific sequence number:

```python
@app.get("/contracts/{contract_id}/events")
async def contract_event_stream(
    contract_id: str,
    last_sequence: int = 0,    # Replay from this sequence number
):
    ...
```

### 11.3 Weighted Progress Calculation

Progress is weighted by estimated task duration, not task count.

```python
def calculate_weighted_progress(tasks: list[TaskExecution], dag: ExecutionPlan) -> float:
    """Calculate progress weighted by estimated duration."""
    total_weight = 0.0
    completed_weight = 0.0

    for task in dag.tasks:
        weight = task.estimated_duration.max_minutes  # Use max estimate as weight
        total_weight += weight

        execution = next((t for t in tasks if t.task_id == task.id), None)
        if execution and execution.execution_state == TaskExecutionState.COMPLETE:
            completed_weight += weight
        elif execution and execution.execution_state == TaskExecutionState.IN_PROGRESS:
            # Partial credit for in-progress tasks based on elapsed time
            if execution.started_at:
                elapsed = (datetime.utcnow() - execution.started_at).total_seconds() / 60
                progress_ratio = min(elapsed / weight, 0.9)  # Cap at 90% until complete
                completed_weight += weight * progress_ratio

    return completed_weight / total_weight if total_weight > 0 else 0.0
```

### 11.4 Event Types Emitted

| Event Type | Importance | Payload |
|---|---|---|
| `task.state_changed` | MEDIUM | task_id, from_state, to_state, reason |
| `task.started` | MEDIUM | task_id, provider_id, estimated_duration |
| `task.completed` | HIGH | task_id, actual_duration, actual_cost |
| `task.failed` | CRITICAL | task_id, reason, retry_available |
| `task.evaluation_complete` | HIGH | task_id, passed, quality_score, deficiency_notes |
| `evaluation.aggregate` | HIGH | contract_id, overall_passed, quality_score |
| `handoff.occurred` | HIGH | task_id, handoff_type, from_id, to_id |
| `retry.initiated` | MEDIUM | task_id, retry_count, strategy (same_worker/reroute/replan) |
| `progress.snapshot` | LOW | ProgressSnapshot |
| `sla.warning` | CRITICAL | type (cost/time), current_value, threshold |
| `dispute.raised` | CRITICAL | contract_id, reason |
| `dispute.recommendation` | HIGH | contract_id, recommended_outcome |
| `dispute.resolved` | HIGH | contract_id, outcome |
| `autonomy_gate.blocked` | HIGH | task_id, risk_score, awaiting_buyer |
| `autonomy_gate.auto_approved` | LOW | task_id, risk_score |

---

## 12. Timeout and Deadline Management

### 12.1 Task-Level Timeouts

```python
SOFT_TIMEOUT_RATIO = float(os.getenv("SOFT_TIMEOUT_RATIO", "0.8"))
```

- **Soft timeout** (80% of task max_duration): Emit `sla.warning` event. For AI tasks, checkpoint intermediate state.
- **Hard timeout** (100%): Force stop. Serialize last stable state. Trigger reroute.
- **AI safety net** (35 minutes): Independent of task-level timeout. If an AI task hits 35 minutes regardless of its SLA, checkpoint and prepare for handoff.

### 12.2 Contract-Level Deadline Monitoring

The orchestrator periodically checks overall SLA status:

- Compute remaining work (critical path duration of incomplete tasks)
- Compare against remaining time budget
- If critical path exceeds remaining time: emit `sla.warning` with importance CRITICAL
- The orchestrator can suggest to the buyer: (a) extend deadline, (b) reduce scope, (c) add more parallel workers

---

## 13. Notification System

### 13.1 Channels

| Channel | Use Case | Implementation |
|---|---|---|
| In-app | Primary channel for all notifications | Push notification via Layer F |
| SMS | Human task dispatch, urgent alerts, platform invitation | Integration with SMS gateway (e.g., Twilio) |
| Email | Task briefs, evaluation summaries, platform invitation | Integration with email service (e.g., SendGrid) |

### 13.2 Notification Preferences

Notification preferences are stored on the `IdentityRecord.communication_preferences` in Layer C. Layer D reads preferences when dispatching notifications.

```python
async def notify_participant(
    identity_id: str,
    notification_type: str,
    content: dict[str, Any],
    urgency: EventImportance = EventImportance.MEDIUM,
) -> None:
    """Send notification via the participant's preferred channels."""
    identity = await get_identity(identity_id)
    channels = identity.communication_preferences.get("channels", ["in_app"])

    for channel in channels:
        if channel == "in_app":
            await send_in_app_notification(identity_id, content)
        elif channel == "sms" and urgency in (EventImportance.CRITICAL, EventImportance.HIGH):
            await send_sms(identity.contact_info.get("phone"), content)
        elif channel == "email":
            await send_email(identity.contact_info.get("email"), content)
```

SMS and email also serve as invitations to the platform — workers who haven't claimed their profile receive messages that invite them to join AWP for a better experience.

---

## 14. Context Management Integration

Layer D depends on the shared context management service (interface defined in SPEC-LAYER-B, Section 6.5) for assembling execution context.

```python
class ExecutionContext(BaseModel):
    task: TaskNode                       # The task to execute
    contract: WorkContract               # Parent contract
    outcome: Outcome                     # Parent outcome
    predecessor_outputs: list[dict]      # Outputs from completed dependency tasks
    last_stable_state: LastStableState | None  # For retries/handoffs
    deficiency_notes: list[str]          # From previous evaluation, if retry
    intake_conversation_summary: str | None  # Summarized intake context (not full history)
```

For AI tasks, this context is passed to the executing agent. For human tasks, it's used to generate the task brief.

---

## 15. Events

### 15.1 Inbound Events (Layer D Listens)

| Topic | Event | Action |
|---|---|---|
| `pln.execution_plans` | `execution_plan.approved` | Start orchestrator for the contract |
| `pln.matching` | `matching.provider_assigned` | Task is ASSIGNED, orchestrator can start it |
| `pln.matching` | `matching.failed` | No provider found, orchestrator handles (replan or fail) |
| `pln.execution_plans` | `execution_plan.replanned` | Orchestrator reconciles new tasks into the running DAG |
| `pln.layer_f.deliverables` | `task.deliverable_submitted` | Worker submitted deliverable, trigger evaluation |
| `pln.layer_f.task_responses` | `task.accepted` | Worker accepted assignment, transition to IN_PROGRESS |
| `pln.layer_f.task_responses` | `task.declined` | Worker declined, orchestrator triggers reroute via Layer C |
| `pln.layer_f.approvals` | `approval.decision` | Buyer approved/rejected/counter-proposed a gate |
| `pln.layer_f.comments` | `task.comment_added` | Buyer/worker comment, orchestrator factors into decisions |
| `pln.layer_f.clarifications` | `clarification.sent` | Buyer asked for clarification, pause evaluation |

### 15.2 Outbound Events (Layer D Emits)

| Topic | Event | Trigger |
|---|---|---|
| `pln.tasks` | `task.ready` | Orchestrator determines task dependencies are resolved |
| `pln.tasks` | `task.completed` | Task finished and passed evaluation |
| `pln.tasks` | `task.failed` | Task unrecoverably failed |
| `pln.contracts` | `contract.state_changed` | Contract → VERIFICATION or COMPLETE or FAILED |
| `pln.execution` | All `ExecutionEvent` types | Stored in Cosmos DB + emitted to SSE |
| `pln.matching` | `matching.reroute_requested` | Retry cascade step 2 |
| `pln.execution_plans` | `replan.requested` | Retry cascade step 3 |
| `pln.disputes` | `dispute.raised`, `dispute.resolved` | Dispute lifecycle events |
| `pln.reputation` | `task.evaluation_complete` | Task evaluation data for Layer E scoring |

### 15.3 Event Topics

| Topic | Events |
|---|---|
| `pln.tasks` | `task.ready`, `task.completed`, `task.failed` |
| `pln.execution` | All SSE events (task state changes, evaluations, handoffs, progress, SLA warnings) |
| `pln.disputes` | `dispute.raised`, `dispute.resolved` |

---

## 16. Error Handling

### 16.1 Orchestrator Failures

| Failure | Behavior |
|---|---|
| Orchestrator process crashes | Restart from last known DAG state in Cosmos DB. Events are replayed. Active tasks are re-checked for status. |
| AI task agent crashes | Serialize available state, increment retry count, attempt retry. |
| Human task notification fails | Retry notification via alternative channel. If all channels fail, log and emit warning. |
| Evaluator agent fails | Retry once. If second attempt fails, route to NEEDS_REVIEW (buyer QA). |
| Risk scorer agent fails | Default to requiring buyer approval (fail safe). |

### 16.2 Execution State Recovery

All execution state is persisted to Cosmos DB:
- `TaskExecution` records with full state history
- `ExecutionEvent` stream with sequence numbers
- Orchestrator DAG state (which tasks are active, queued, complete)

On restart, the orchestrator reconstructs its state from Cosmos DB and resumes.

---

## 17. Configuration

| Variable | Default | Description |
|---|---|---|
| `MAX_CONCURRENT_TASKS` | `10` | Max parallel tasks per contract |
| `MAX_TASK_RETRIES` | `2` | Max retries with same worker before reroute |
| `AI_TASK_TIMEOUT_MINUTES` | `35` | Safety net timeout for AI tasks |
| `AI_TASK_SOFT_TIMEOUT_RATIO` | `0.8` | Soft timeout as fraction of max_duration |
| `SOFT_TIMEOUT_RATIO` | `0.8` | Soft timeout ratio for all tasks |
| `HUMAN_TASK_CHECKIN_HOURS` | `24` | Hours between check-in notifications for human tasks |
| `EVALUATOR_DEPLOYMENT` | `gpt-5.2` | Azure OpenAI deployment for the evaluator agent |
| `RISK_SCORER_TEMPERATURE` | `0.1` | Temperature for risk scoring (low for consistency) |
| `PROGRESS_SNAPSHOT_INTERVAL_SECONDS` | `30` | How often to emit progress snapshots |
| `AZURE_OPENAI_KEY` | (required) | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | (required) | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` | Default model deployment name |
| `COSMOS_DB_ENDPOINT` | (required) | Azure Cosmos DB endpoint |
| `COSMOS_DB_KEY` | (required) | Azure Cosmos DB key |

---

## 18. File Structure

```
packages/execution/
├── __init__.py
├── models.py                  # All Pydantic models (Section 3)
├── orchestrator.py            # DAG orchestrator agent, dispatch logic, concurrency control
├── agents/
│   ├── __init__.py
│   ├── registry.py            # Agent library registry, agent selection logic
│   ├── content_writer.py      # Content writing specialist agent
│   ├── web_researcher.py      # Web research specialist agent
│   ├── data_analyst.py        # Data analysis specialist agent
│   ├── generic_executor.py    # Generic fallback agent
│   └── ...                    # Additional specialist agents
├── evaluator.py               # Evaluator agent, evaluation modes, aggregate evaluation
├── handoff.py                 # Handoff record management, context serialization
├── retry.py                   # Retry cascade logic, reroute/replan triggers
├── risk.py                    # LLM-first risk scoring agent, autonomy gate checks
├── dispute.py                 # Dispute agent, recommendation generation
├── progress.py                # SSE endpoint, weighted progress calculation, event storage
├── notifications.py           # Multi-channel notification dispatch (in-app, SMS, email)
├── timeout.py                 # Timeout monitoring, soft/hard timeout handlers
├── events.py                  # Event models + emission helpers
├── listener.py                # Kafka consumer for execution plan and matching events
└── tests/
    ├── __init__.py
    ├── test_models.py             # Model construction, validation
    ├── test_orchestrator.py       # DAG walking, concurrency, dispatch logic
    ├── test_agents.py             # Agent selection, AI task execution (mocked LLM)
    ├── test_evaluator.py          # Evaluation modes, aggregate evaluation (mocked LLM)
    ├── test_handoff.py            # Handoff records, context serialization
    ├── test_retry.py              # Retry cascade, reroute/replan triggers
    ├── test_risk.py               # Risk scoring, autonomy gate logic (mocked LLM)
    ├── test_dispute.py            # Dispute recommendation (mocked LLM)
    ├── test_progress.py           # Weighted progress calculation, SSE replay
    ├── test_notifications.py      # Multi-channel dispatch, channel fallback
    ├── test_timeout.py            # Soft/hard timeout, AI safety net
    └── test_listener.py           # Event-driven triggers
```

---

## 19. Testing Strategy

All tests use pytest + pytest-asyncio. LLM calls, Cosmos DB, and notification services are mocked.

### 19.1 Orchestrator Tests (`test_orchestrator.py`)

- Linear DAG: tasks dispatched in order, each waits for predecessor
- Parallel DAG: independent tasks dispatched simultaneously up to concurrency limit
- Diamond DAG: convergence point waits for all predecessors
- Concurrency limit enforced: 11th task queued when limit is 10
- Priority ordering: critical path tasks dispatched first
- Human task pacing: task enters PAUSED, DAG continues with independent branches
- Orchestrator recovery: restart from Cosmos DB state

### 19.2 Agent Tests (`test_agents.py`)

- Orchestrator selects content writer for content task
- Orchestrator selects generic executor for unknown task type
- AI task execution produces artifacts stored in Cosmos DB
- AI safety net: task force-stopped at 35 minutes, intermediate state serialized

### 19.3 Evaluator Tests (`test_evaluator.py`)

- Binary check: pass and fail cases
- Threshold: measured value above/below target
- LLM evaluation: mock evaluator returns quality score + deficiency notes
- Human judgment: task enters NEEDS_REVIEW
- Aggregate evaluation: majority pass, all-or-nothing, weighted modes
- Deficiency notes passed to retry worker

### 19.4 Retry Tests (`test_retry.py`)

- Step 1: retry with same worker, deficiency notes + last stable state passed
- Step 1 exhausted: reroute event emitted
- Step 2: reroute succeeds, new worker assigned
- Step 2 exhausted: replan event emitted
- Step 3: replan succeeds, new subgraph integrated
- All steps exhausted: task FAILED, escalation per autonomy level

### 19.5 Risk Scoring Tests (`test_risk.py`)

- Advisor: always requires approval
- Facilitator: always requires approval
- Agent: low-risk auto-approved, high-risk blocked
- Delegate: only very high risk (> 0.8) blocked
- Risk dimensions: monetary value, category sensitivity, worker trust

### 19.6 Dispute Tests (`test_dispute.py`)

- Dispute agent produces recommendation with reasoning
- Multiple outcome options presented
- Buyer approves recommendation → contract transitions
- Buyer chooses alternative → contract transitions accordingly
- Dispute outcome emitted for Layer E reputation scoring

### 19.7 Progress Tests (`test_progress.py`)

- Weighted progress: large task incomplete = low progress despite many small tasks done
- Event replay from Cosmos DB on reconnection
- Sequence numbers monotonically increasing
- SLA warning emitted at 80% cost/time

### 19.8 Notification Tests (`test_notifications.py`)

- In-app notification sent for all participants
- SMS sent only for HIGH/CRITICAL importance
- Email sent for task briefs
- Channel fallback when primary channel fails

---

## 20. Key Design Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Orchestrator selects specialist agents via SDK agent-as-tool pattern | LLM-first agent selection; SDK handles routing naturally |
| 2 | Single evaluator agent for v1, separate model from execution | Avoids self-confirmation bias; single evaluator is simpler to maintain |
| 3 | Evaluator has access to execution trace | Can suggest modifications based on process, not just output |
| 4 | Retry stops at reroute; re-decomposition delegates to Layer B | Simpler Layer D; Layer B already handles replanning |
| 5 | LLM-first risk scoring for autonomy gates | Consistent with architecture philosophy; captures nuance that rules miss |
| 6 | AI dispute recommendation, buyer decides | Avoids liability; builds buyer trust through transparency |
| 7 | Single SSE endpoint with importance field, client decides what to show | Simple server-side; autonomy-level-aware rendering is Layer F's job |
| 8 | Events stored in Cosmos DB for replay | Supports SSE reconnection, debugging, audit trail |
| 9 | Human tasks use PAUSED state, orchestrator continues independent branches | Long-running human tasks don't block the entire DAG |
| 10 | Last stable state passed to next worker on failure/handoff | Workers can resume rather than restart; reduces waste |
| 11 | Weighted progress by estimated duration | Prevents misleading progress (9 trivial tasks done ≠ 90% complete) |
| 12 | Notification channels prioritize in-app with SMS/email as platform invitation | Drives platform adoption while reaching workers where they are |
| 13 | Orchestrator persists to Cosmos DB, recoverable on crash | No lost state; execution survives process restarts |

---

## 21. Open Questions (Resolve During Implementation)

1. **Agent library bootstrapping**: Which task-type-specific agents ship in v1? Start with content writer, web researcher, data analyst, and generic executor. Expand as demand patterns emerge.
2. **Evaluator model selection**: The spec says "typically stronger model." Confirm which Azure OpenAI deployment to use for evaluation. May need a separate deployment for cost management.
3. **SMS/email provider**: Twilio for SMS, SendGrid for email are suggested. Confirm before implementation.
4. **Cosmos DB collection design for events**: Events per contract may grow large. Consider TTL policies or archival for completed contracts.
5. **Orchestrator scaling**: One orchestrator per contract. At high volume, this means many concurrent orchestrator processes. Confirm infrastructure (AKS pods, Container Apps, etc.).
