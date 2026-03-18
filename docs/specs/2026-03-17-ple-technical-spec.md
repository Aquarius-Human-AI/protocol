# PROGRAMMABLE LABOR NETWORK

Technical Specification for Minimum Viable Architecture

Version 2.0 | March 2026

Internal Working Document

*Thesis: A Programmable Labor Network that discovers human and AI labor supply via web search, profiles and tracks performance over time, and routes outcome-based work to the optimal blend of labor. The moat is the labor graph — the accumulated reputation, capability, and performance data across every worker node.*

## Overview

This document specifies the six minimum technical layers required to build a Programmable Labor Network. Each layer is defined with its purpose, data model, state-of-the-art implementation guidance, key technical decisions, and integration points.

The layers are ordered by dependency — each layer builds on the one above it. Three of these layers (A, C, and E) form the compounding data moat. The remaining three (B, D, and F) are execution and interface layers that enable the moat to function.

The protocol primitives that govern identity, contracts, execution, capability, and autonomy across these layers are collectively referred to as the **Aquarius Work Protocol (AWP)** — the operating system for agent-powered services. Just as Stripe abstracted payment complexity, AWP abstracts work complexity: defining outcomes, matching capabilities, managing execution, and triggering payment through a unified protocol that works regardless of whether the participants are human, AI, or a mix of both.

## Layer Summary

| # | Layer | Function | Moat contribution |
| --- | --- | --- | --- |
| A | Outcome schema | Universal format for what 'done' means — from human-facing goals down to verifiable contract terms | Core moat — compounds |
| B | Task decomposition engine | Breaks outcomes into executable work units | Execution layer |
| C | Capability + routing index | Maps every participant's identity, skills, performance, and cost | Core moat — compounds |
| D | Execution, evaluation + handoff | Runs tasks, evaluates output, manages AI↔human transitions with autonomy-gated handoffs | Execution layer |
| E | Trust + reputation | Verifies work, builds scored performance data per node | Core moat — compounds |
| F | Buyer control surface | Visibility, approval gates, intervention without micromanagement | Interface layer |

## Layer A — Outcome Schema

The outcome schema is the foundation of the entire system. It is a structured, machine-readable format that defines what 'done' means for any unit of purchasable work. Without a rigorous outcome schema, you cannot price work, measure performance, enforce SLAs, or build reputation. Every other layer depends on this.

This layer operates at two levels of abstraction. An **outcome** is a human-facing goal that may span multiple jobs (e.g., 'get reliable home help'). A **work contract** operationalizes a specific piece of that goal with formal terms, acceptance criteria, payment triggers, and a state machine lifecycle. Users see outcomes; the system routes contracts.

### Purpose

Define a universal, composable format for representing outcomes that both humans and machines can consume, evaluate against, and price — then operationalize each outcome as one or more work contracts with enforceable terms and deterministic state transitions.

### Technical Specification

| Attribute | Specification |
| --- | --- |
| Data format | JSON Schema with semantic validation. Each outcome is a typed document with required and optional fields. Extend via JSON-LD for interoperability across external systems. |
| Outcome definition | Natural language description paired with structured fields: outcome_type (enum: deliverable, state_change, metric_target, decision), domain (vertical tag), and a machine-parseable success_condition. |
| Outcome orchestration | An outcome decomposes into one or more contracts. The AI agent manages this decomposition: identifying implicit needs from conversation, prioritizing by urgency and feasibility, managing dependencies between contracts, and surfacing progress in language the user understands. |
| Contract structure | Each contract specifies: participants (buyer, provider, intermediaries), structured requirements with acceptance criteria, pricing terms and payment trigger (on_acceptance, on_milestone, on_completion, or on_verification), escrow setting, dispute resolution method, and a reference to its execution plan. |
| Contract state machine | Every contract follows the same state machine regardless of participant types: INTENT → REQUIREMENTS → MATCHING → PROPOSAL → NEGOTIATION → ACTIVE → VERIFICATION → COMPLETE. Terminal states: CANCELLED, EXPIRED, FAILED. A DISPUTED state handles verification failures. The state machine is identical for human↔human, human↔agent, and agent↔agent — only the autonomy gates differ. |
| Acceptance criteria | Array of verifiable assertions. Each criterion has a type (binary_check, threshold, human_judgment, llm_evaluation) and a target value. Binary checks are auto-evaluated; human_judgment triggers QA routing. |
| Confidence | Probabilistic estimate of fulfillment likelihood before work begins, expressed as a single float (0.0-1.0). Updated in real time as tasks complete. Initial estimates calibrated from historical data in Layer C. |
| SLA parameters | Structured object containing: max_duration (ISO 8601 duration), max_cost (currency + amount), quality_floor (0-1 score threshold), and escalation_trigger (conditions that force human review or buyer notification). |
| Composability | Outcomes can nest. A parent outcome (e.g., 'produce a podcast package') decomposes into child outcomes (e.g., 'transcribe audio', 'write show notes', 'generate cover art'). The schema supports a children[] array with dependency ordering. |
| Versioning | Outcome schemas are immutable once a job begins. Amendments create a new version with a diff reference to the original. This preserves auditability. |
| Pricing hook | Each outcome includes a pricing_model field (fixed, per_unit, time_capped, outcome_contingent) that feeds into the commercial layer. Additional models (pay-what-you-want, reciprocal exchange) are supported for community-oriented providers. |

### State of the Art Reference

No universal 'outcome schema' standard exists today. The closest analogs are OpenAPI for API contracts, JSON Schema for data validation, and the emerging work around task specifications in agentic AI frameworks. The Planner-Worker architecture pattern (referenced in current research showing 90% cost reduction by separating planning from execution models) validates the need for a structured intermediate representation between intent and execution.

MCP (Model Context Protocol) solves tool integration but explicitly does not address work definition, outcome measurement, or inter-agent contracts. A recent analysis noted that production multi-agent systems still lack standardized identity, manifests, discovery, and policy enforcement above the transport layer. The contract state machine fills this gap by providing a standardized lifecycle for work that operates above the transport layer.

### Key Technical Decisions

- Whether acceptance criteria are fully machine-evaluable or allow human-in-the-loop judgment (recommendation: support both, with a bias toward machine evaluation for scalability)

- How to handle ambiguous or underspecified outcomes from buyers (recommendation: use an LLM-powered intake layer that negotiates the outcome schema interactively before committing — this is the INTENT → REQUIREMENTS transition in the contract state machine)

- Schema extensibility strategy: strict core fields with a flexible metadata object for domain-specific extensions

- Whether the contract state machine should be identical for all participant types (decision: yes — the gates change based on autonomy level, the machine does not)

## Layer B — Task Decomposition Engine

The decomposition engine takes a validated outcome schema and produces a directed acyclic graph (DAG) of executable tasks. Each task is typed, sized, and annotated with the capabilities required to complete it. In lifecycle terms, this is the step that generates an execution plan when a contract enters ACTIVE state.

### Purpose

Convert buyer-facing outcomes into machine-routable work units with explicit dependencies, parallelization opportunities, and human/AI suitability annotations.

### Technical Specification

| Attribute | Specification |
| --- | --- |
| Decomposition model | LLM-powered planner using a frontier reasoning model (e.g., Claude Opus, GPT-4.5) for initial decomposition, with learned heuristics from historical decomposition patterns. The Planner-Worker pattern is now dominant in production: use a capable model for planning and route execution to cheaper, specialized models or human workers. |
| Output format | DAG represented as an adjacency list of task nodes. Each node contains: task_id, task_type (enum: ai_only, human_only, either, hybrid), required_capabilities[] (skill tags matching Layer C profiles), estimated_duration, estimated_cost, depends_on[] (task_ids), parallelizable (boolean), and confidence (0-1). |
| Dependency graph | Explicit edges between tasks. The engine must detect circular dependencies and reject them. Support for soft dependencies (preferred ordering) and hard dependencies (strict sequencing). |
| Parallelization rules | Tasks with no mutual dependencies are marked parallel. The engine calculates critical path length and identifies bottleneck tasks. Resource constraints (e.g., 'only 2 concurrent human reviewers') are modeled as capacity limits. |
| Human/AI task typing | Each task gets a suitability score for AI execution (0-1) and human execution (0-1) based on: task complexity, error tolerance, judgment requirement, regulatory constraint, and historical success rates from Layer C. |
| Granularity control | Configurable decomposition depth. Default: decompose until each task is completable in under 35 minutes (the empirically observed degradation threshold for AI agents). Buyer can override for coarser or finer granularity. |
| Learning loop | Every completed job feeds decomposition patterns back. Over time, the engine learns that 'produce a podcast package' for a specific domain reliably decomposes into a known subgraph, reducing planning latency and improving cost estimates. |
| Replanning | If a task fails or a confidence threshold drops during execution, the engine can replan the remaining subgraph without restarting completed work. This requires the DAG to be mutable at runtime with version tracking. |

### State of the Art Reference

Current agent frameworks (LangGraph, CrewAI, Autogen) implement basic task decomposition via graph-based planning that exposes dependencies. Amazon's production agentic systems measure planning scores (successful subtask assignment to subagents) and collaboration success rates. Research shows that task duration for autonomous agents is doubling every 7 months, but failure rate quadruples when task duration doubles — making decomposition granularity a critical reliability lever.

The 35-minute degradation threshold is well-documented: every agent experiences performance drops after approximately 35 minutes of continuous operation. This should be the default ceiling for individual task duration in your decomposition engine.

### Key Technical Decisions

- Whether to use a single frontier model for planning or a specialized fine-tuned decomposition model (recommendation: start with frontier model + few-shot examples from your growing job history, move to fine-tuned model once you have 10K+ completed decompositions)

- How to handle novel outcome types with no historical decomposition data (recommendation: LLM generates candidate decomposition, human operator validates before first execution, pattern is stored for future reuse)

- Cost of replanning vs. cost of continuing with a suboptimal plan (recommendation: replan when confidence drops below 0.6 on any critical-path task)

## Layer C — Capability and Routing Index

The capability index is the labor graph — a continuously updated registry of every worker node (human, AI agent, or hybrid unit) with structured profiles, performance history, and cost/speed/quality scores. Web search is the primary discovery mechanism for populating this index.

Every participant in the system — human, AI agent, or external platform — has an identity record that establishes who or what they are and under what terms they operate. Identity records carry the participant's trust level, autonomy setting, delegation chain (who authorized this participant to act), communication preferences, and risk profile. The protocol is type-agnostic: an AI agent has an identity record just like a human does, and trust is earned the same way through performance history.

### Purpose

Maintain a live, scored inventory of available labor that the routing engine can query in real time to match tasks to the best available worker.

### Technical Specification

| Attribute | Specification |
| --- | --- |
| Worker node schema | Each node has: node_id, node_type (human, ai_agent, hybrid_unit, workflow), capabilities[] (structured skill tags with proficiency scores), availability (schedule or API endpoint), cost_model (per_task, per_hour, per_token, outcome_share), and metadata (source, discovery_date, verification_status). |
| Identity and delegation | Each participant has an identity record with: type (human, agent, platform), trust_level (unverified through government-verified), autonomy_setting (advisor, facilitator, agent, delegate), delegation_chain (who authorized this participant to act), and risk_profile (max auto-commit value, restricted categories, approval rules). Delegation is first-class — the full chain from the original human to the current actor is tracked. |
| Capability taxonomy | Hierarchical skill taxonomy with at least 3 levels (domain > function > specialization). Example: 'marketing > content_writing > long_form_seo'. Skills are not self-reported — they are inferred from completed work and verified through test tasks. Capabilities include modality support (phone, video, text, in-person, web-automation) and constraint annotations (e.g., 'ESL — simple English preferred', 'scheduling handled by proxy'). |
| Performance history | Per-node, per-skill historical performance stored as time-series: completion_rate, quality_score, speed_vs_estimate, cost_vs_estimate, escalation_rate, and error_categories. Windowed aggregates (7d, 30d, 90d, all-time) for routing decisions. |
| Cost/speed/quality surface | For each node-skill pair, maintain a 3D efficiency surface: at what cost and speed does this worker deliver what quality level? This surface is what the routing engine optimizes against when matching tasks. |
| Web search crawl pipeline | Automated discovery of human freelancers and AI agent services via web search. Pipeline: (1) search for workers by skill/domain, (2) extract structured profile data, (3) create candidate node, (4) run verification task, (5) promote to active index. Crawl cadence: continuous for high-demand skills, weekly for long-tail. |
| Matching algorithm | Multi-objective optimization: given a task's required_capabilities, time_constraint, and budget, find the Pareto-optimal set of candidate workers ranked by expected quality. Use a learned scoring function trained on historical task-worker-outcome triples from Layer E. Matching returns ranked candidates with confidence scores and uncertainty flags — not just 'can they do it' but 'can they do it given these constraints, and what might go wrong?' |
| Index freshness | Human availability windows updated via calendar integration or manual status. AI agent availability checked via health endpoint ping. Stale nodes (no activity in 90 days) are demoted in ranking but not removed. |
| Hybrid units | First-class support for composite worker nodes: one human operator + one AI workflow + historical performance as a unit. This is the key differentiator from freelancer platforms (which profile individuals) and agent stores (which profile tools). |
| External platform adapters | External platforms (Fiverr, Upwork, TaskRabbit) register as participants with capabilities derived from their service catalogs. The adapter translates between the protocol's capability model and the platform's categories, ratings, and pricing structures. |

### State of the Art Reference

No production system today maintains a unified labor index spanning human freelancers and AI agents with shared reputation. Freelancer platforms (Upwork, Fiverr) profile humans only. Agent frameworks (LangChain, CrewAI) manage agent registries but without human workers. The MCP ecosystem provides standardized tool integration via 17,000+ servers, but MCP is a tool protocol, not a labor protocol — it describes what a tool can do, not how well a worker performs or what outcome quality to expect.

Oracle's production AI agents use role-based logic with pre-trained agents for specific finance and supply chain roles, with built-in auditability. This validates the concept of typed, profiled worker nodes but within a closed enterprise system rather than an open marketplace.

### Key Technical Decisions

- Whether the capability taxonomy is predefined or emergent from job data (recommendation: start with a curated seed taxonomy of 200-500 skills, expand automatically as new job types appear)

- How to cold-start reputation for newly discovered workers (recommendation: verification task + initial low-confidence score that converges after 5-10 completed jobs)

- How to handle AI agent versioning — when a model updates, does its performance history reset? (recommendation: soft reset — decay historical scores by 50%, rebuild from new completions)

## Layer D — Execution, Evaluation, and Handoff Protocol

The execution layer is the runtime that actually performs work. It manages task lifecycle, evaluates output quality against acceptance criteria, handles AI-to-human and human-to-AI transitions, and provides the real-time signals that feed Layers E and F.

### Purpose

Execute task DAGs reliably, evaluate every output against the outcome schema, and manage handoffs between worker types without losing context or quality.

### Technical Specification

| Attribute | Specification |
| --- | --- |
| State machine | Each task moves through: queued → assigned → in_progress → evaluating → (passed | failed | needs_review) → complete. Each transition is timestamped and logged. The DAG-level state machine tracks: decomposed → routing → executing → evaluating → (fulfilled | escalated | failed). |
| Evaluation engine | Every task output is evaluated against the acceptance criteria from Layer A. Three evaluation modes: (1) Automated: LLM-as-judge using a separate evaluator model (not the same model that performed the task) with structured rubrics. (2) Metric-based: programmatic checks against quantitative thresholds. (3) Human QA: routed to a human reviewer when automated confidence is below threshold. |
| LLM-as-judge implementation | Use a frontier model (e.g., Claude Opus) as the evaluator, distinct from execution models. Provide the evaluator with: the original acceptance criteria, the task output, and a structured scoring rubric. Output: pass/fail decision, quality score (0-1), and specific deficiency notes for retry guidance. |
| Handoff triggers | Five conditions trigger a handoff between participants: (1) capability boundary — current assignee can't do the next step, (2) confidence drop — assignee's confidence falls below threshold, (3) autonomy gate — next action exceeds the user's risk tolerance, (4) delegation request — participant explicitly delegates to another, (5) platform boundary — work must happen on an external platform. Every handoff produces a record capturing who handed off to whom, why, what context was transferred, and critically, what context was lost in the transfer. |
| Context preservation | On handoff, the full task context is serialized: original task spec, all intermediate outputs, evaluation results, and conversation/reasoning traces. Context window management uses summarization for long-running tasks (addressing the documented 35-minute degradation problem). |
| Retry and fallback | On task failure: (1) retry with same worker up to retry_limit, (2) reroute to next-best worker from Layer C, (3) decompose into finer subtasks and retry, (4) escalate to human. Each retry path is logged for pattern analysis. |
| Progress tracking | Real-time event stream (WebSocket or SSE) emitting: task state changes, completion percentages (based on DAG critical path), quality signals from evaluation, and cost accumulation. This feeds Layer F's buyer control surface. |
| Timeout and deadlines | Each task has a max_duration from the outcome schema. Soft timeout at 80% triggers a warning. Hard timeout triggers automatic rerouting or escalation. DAG-level deadline monitoring ensures the overall SLA is on track. |

### Autonomy Levels

Autonomy is configured at the identity layer (Layer C) and enforced at every state transition in the contract state machine and task execution. It governs how much authority AI agents have at each step — from 'show me options, I'll decide everything' (Advisor) through 'handle it, just keep me posted' (Delegate).

The effective approval threshold is risk-modified: `approval_required = risk_score(action) > risk_tolerance(autonomy_level)`. A low-value task at Delegate level auto-executes; a high-value commitment at the same level still requires confirmation. Risk scoring dimensions include monetary value, irreversibility, category sensitivity, participant trust, and historical dispute rates for similar work.

This means the same state machine serves all participant types and all autonomy levels. The machine is invariant; the gates are configurable. This is a deliberate architectural choice — it keeps the execution runtime simple and pushes policy decisions into the identity and configuration layer.

### Participant Interaction Patterns

The protocol supports three primary patterns: **human ↔ AI agent** (the most common near-term pattern — a human expresses a goal, an AI agent manages contracts on their behalf), **agent ↔ agent** (an AI agent subcontracts work to a specialized agent, with delegation depth limits and budget allocation from the parent contract), and **agent ↔ external platform** (an AI agent acts on Fiverr, Upwork, or similar platforms via adapters that translate between protocol contracts and platform-native formats).

### State of the Art Reference

Amazon's production agentic systems evaluate agents across planning scores, communication scores, and collaboration success rates, with human-in-the-loop review for edge cases. LLM-as-judge is now standard practice for automated quality assessment, with frameworks like AlpacaEval and LangBench providing benchmarks. The state of agent engineering report (1,300+ respondents, late 2025) found that 89% of production agent deployments implement observability, while only 52% use structured evals — indicating evaluation is a competitive advantage, not table stakes.

Bounded autonomy is the dominant production pattern: agents handle routine execution but escalation paths to humans are explicit. Oracle's intelligent exception handling exemplifies this — instead of failing when an edge case appears, the system gathers all relevant context and routes to a human.

### Key Technical Decisions

- Whether to use the same model for execution and evaluation (recommendation: never — use a separate, typically stronger model as evaluator to avoid self-confirmation bias)

- How to set confidence thresholds for handoff triggers (recommendation: start conservative at 0.7, tune per task type based on historical human override rates from Layer E)

- How to handle partial completions when a worker fails mid-task (recommendation: serialize intermediate state, allow next worker to resume rather than restart)

- How to implement risk scoring for autonomy gates (recommendation: define input dimensions now — monetary value, irreversibility, category sensitivity, participant trust, dispute history, novelty — but learn the weights from real transaction data rather than hand-tuning)

## Layer E — Trust and Reputation Layer

The trust and reputation layer is the verification engine and data asset that converts raw execution history into defensible routing intelligence. It has two functions: trust (verifying that work was done correctly) and reputation (scoring worker performance over time). The feedback loop from this layer back into Layer C is what turns a directory into a moat.

### Purpose

Verify every unit of work, build structured performance scores per worker node, and feed reputation data back into routing decisions so that every completed job makes the system smarter.

### Technical Specification

| Attribute | Specification |
| --- | --- |
| Verification tiers | Three tiers, selected per contract based on value and risk: (1) self-report — provider claims completion, used for low-risk high-trust work, (2) evidence-based — deliverables checked against acceptance criteria, the standard for most contracts, (3) outcome-verified — measurable result confirmed by the system, used for high-value results-based work. Who verifies depends on context: AI for objective criteria, human for subjective quality, community for reputation-based vouching, external platform for platform-native completion signals. |
| Audit trail | Immutable, append-only log of every action in the system. Each entry: timestamp, actor (human_id or agent_id), action_type, input_hash, output_hash, evaluation_result, and parent_task_id. Stored in a tamper-evident structure (e.g., Merkle tree or append-only database with cryptographic chaining). |
| Provenance graph | For every completed outcome, a full provenance graph showing: which worker performed which task, what tools were used, what inputs were consumed, what outputs were produced, and what evaluation scores were assigned. This is the 'receipt' the buyer can inspect. |
| QA checks | Automated quality gates applied post-evaluation: consistency checks (does the output match the schema?), plagiarism/originality checks (for content tasks), factual accuracy checks (for research tasks), and format compliance checks. Results feed into the worker's quality_score. |
| Reputation scoring model | Multi-dimensional score per worker node, per skill: (1) completion_rate (% of assigned tasks completed successfully), (2) quality_score (rolling average of evaluation scores), (3) speed_score (actual vs. estimated duration), (4) cost_efficiency (actual vs. estimated cost), (5) escalation_rate (how often this worker's output needs human review), (6) reliability (variance of the above metrics — low variance = predictable worker). |
| Scoring mechanics | Bayesian updating: start with prior from verification task, update with each completed job. Recent performance weighted more heavily (exponential decay with 30-day half-life). Minimum 5 completed jobs before a score is used for high-value routing. Separate scores per skill — a worker excellent at transcription may be mediocre at summarization. |
| Dispute resolution | When verification fails, the contract enters a disputed state. Evidence is compiled (deliverables, acceptance criteria, communication history, handoff records) and resolution scales with contract value: AI mediation for low-value disputes, human mediator for medium-value, formal arbitration for high-value, and deference to platform dispute processes for external platform contracts. Performance impact is recorded on both parties' capability profiles. |
| Feedback loop to Layer C | After each job, updated reputation scores are written back to the worker node in Layer C. The routing algorithm in Layer C uses these scores as primary ranking features. This is the core flywheel: more jobs → richer reputation data → better routing → better outcomes → more buyer trust → more jobs. |
| Trust signals for buyers | Buyer-facing trust indicators derived from the reputation layer: worker verification status, number of completed jobs of this type, average quality score, and a 'confidence band' for expected outcome quality. These surface in Layer F. |

### State of the Art Reference

Production agent systems are increasingly treating quality as the primary barrier to scale — 32% of respondents in a late-2025 survey cited quality as the top obstacle to agent deployment, above cost. This validates the thesis that the reputation layer is essential infrastructure, not a nice-to-have. Current evaluation frameworks (AlpacaEval, GAIA, LangBench) provide benchmarks for single-agent quality but do not address cross-worker reputation or historical performance tracking in a marketplace context.

The hybrid reputation unit (one operator + one workflow + one agent stack + historical performance data) is a novel concept with no direct production analog. Freelancer platforms track human reputation. Agent benchmarks track model capability. No system currently tracks the performance of a human-AI composite as a single scoreable entity. This is a key technical innovation to build.

### Key Technical Decisions

- How to weight different reputation dimensions in routing (recommendation: learn the weights from buyer satisfaction data rather than hand-tuning — use a simple regression model: buyer_satisfaction = f(quality, speed, cost, reliability))

- How to handle reputation gaming (recommendation: statistical anomaly detection on score trajectories, plus periodic random QA audits on high-reputation workers)

- Whether reputation is public or private (recommendation: aggregated scores visible to buyers, raw data visible only to the platform and the worker)

## Layer F — Buyer Control Surface

The buyer control surface is the interface through which buyers interact with the system. It is not a moat — it is a product layer. But it is essential for trust, adoption, and differentiation. The design principle is a cockpit, not a dashboard: the buyer can steer, not just observe.

The autonomy level configured in the buyer's identity record directly governs the behavior of this layer — a buyer at Advisor level sees every decision point, while a buyer at Delegate level sees only progress summaries and exception alerts.

### Purpose

Give buyers visibility into work progress, approval authority over critical steps, and the ability to intervene or redirect without needing to understand the underlying labor composition.

### Technical Specification

| Attribute | Specification |
| --- | --- |
| Live progress view | Real-time visualization of the DAG execution state. Shows: which tasks are complete, in progress, or queued; current quality scores; time and cost tracking against SLA; and the critical path to completion. Powered by the WebSocket/SSE event stream from Layer D. |
| Approval checkpoints | Configurable gates where execution pauses until buyer approves. Default gates: (1) after decomposition (buyer reviews the task plan before execution begins), (2) at major milestones (e.g., after the first draft of a deliverable), (3) before final delivery. Buyers can add or remove gates. Gate frequency is driven by autonomy level — Advisor mode triggers at every transition, Delegate mode only at high-risk transitions. |
| Override and redirect | Buyer can: (1) reject a task output and request rework with specific feedback, (2) reassign a task to a different worker type (e.g., 'use a human for this step'), (3) modify the remaining plan (add/remove/reorder tasks), (4) abort the job with partial delivery. All overrides are logged and feed into Layer E. |
| Abstraction level | The default view shows outcome-level progress (e.g., '72% complete, 3 of 4 milestones passed, on track for SLA'). Buyer can drill down into task-level detail if desired, but never needs to. The system should feel like ordering a service, not managing a project. |
| Notifications | Event-driven alerts for: milestone completion, quality issues requiring attention, SLA risk (projected to miss deadline or budget), approval gates waiting for input, and job completion. Delivered via webhook, email, or in-app depending on buyer preference. |
| Audit access | Buyer can request the full provenance graph from Layer E for any completed job. This includes who did what, evaluation scores, and the decision trail. Exportable as a structured report. |
| Technical implementation | React/Next.js frontend consuming a real-time event API. Server-Sent Events for progress streaming. REST API for control actions (approve, reject, redirect, abort). GraphQL for flexible querying of job state and history. |
| Mobile considerations | Approval gates and notifications must work on mobile. The progress view should be responsive. Override actions are desktop-only in v1 to avoid accidental interventions on small screens. |

### State of the Art Reference

The UX pattern for buyer-facing AI work management is still nascent. Most agent interfaces today are either chat-based (conversational) or dashboard-based (monitoring). The 'cockpit' pattern — where the buyer has real-time visibility and lightweight control without micromanagement — is emerging in tools like Devin (for code tasks) and some vertical AI platforms, but has not been generalized to a multi-domain outcome marketplace.

The transition from 'fast AI' (instant responses) to 'slow AI' (responses taking minutes or hours) requires fundamentally different UX patterns. Progress indicators, partial result previews, and asynchronous notification flows become critical.

## Cross-Layer Integration Map

The layers are not independent — they form a tightly coupled feedback system. The following describes the critical data flows between layers.

### Primary Data Flows

| Flow | Description |
| --- | --- |
| A → B | Outcome schema feeds into the decomposition engine as the input specification. When a contract enters ACTIVE state, the decomposition engine generates an execution plan. The acceptance criteria from A become the evaluation rubric used in D. |
| B → C | Task DAG with required_capabilities[] queries the routing index for candidate workers. |
| C → D | Matched worker assignments flow into the execution runtime for task dispatch. |
| D → E | Every task completion event (with evaluation scores, timing, and cost data) flows into the trust and reputation layer for scoring. |
| E → C (feedback loop) | Updated reputation scores are written back to worker nodes in the routing index, making future routing decisions more accurate. This is the core compounding mechanism. |
| D → F | Real-time progress events stream to the buyer control surface. |
| F → D | Buyer control actions (approve, reject, redirect) flow back into the execution runtime to modify task state. |
| A + E → B (learning) | Historical decomposition patterns (from A) and outcome quality data (from E) train the decomposition engine to produce better task plans over time. |

## Infrastructure Requirements

- Event bus (Kafka or equivalent) for real-time inter-layer communication

- Time-series database for performance metrics and reputation scoring (InfluxDB, TimescaleDB)

- Graph database for the capability index and provenance graphs (Neo4j or equivalent)

- Append-only audit log with cryptographic integrity (purpose-built or PostgreSQL with logical replication)

- Object storage for task artifacts and intermediate outputs

- WebSocket/SSE infrastructure for real-time buyer-facing event streaming

- LLM API access to frontier models for planning (Layer B), execution (Layer D), and evaluation (Layer D)

- Web search API access for labor discovery pipeline (Layer C)

- Contract state machine runtime (document store with event sourcing for state transitions)

- Platform adapter framework for external marketplace integration (Fiverr, Upwork, etc.)

## Privacy and Data Governance

The system stores sensitive data: identity records, delegation chains, communication histories, handoff logs, and performance metrics. This must be handled responsibly — especially given the protocol explicitly serves vulnerable populations.

Core principles: data minimization (handoff records transfer only what the receiving participant needs), right to deletion (participants can request deletion of their identity record; terminal-state contracts retain anonymized performance data for capability profile integrity), delegation transparency (when an AI acts on behalf of a human, the other party is informed of the delegation chain), and cross-border considerations (data residency requirements vary by jurisdiction).

## Moat Accumulation Model

The Programmable Labor Network's defensibility comes from three layers compounding together over time:

**Layer A (Outcome Schema):** Every new outcome type you fulfill adds a validated schema to your library. Over time, you accumulate a comprehensive taxonomy of purchasable outcomes with proven acceptance criteria. Competitors starting from scratch must rediscover these patterns.

**Layer C (Capability Index):** Every worker you discover, profile, and route work to adds a node to your labor graph. Over time, you know which workers deliver what quality at what cost for which task types. This is proprietary operational data that cannot be replicated without running equivalent volume.

**Layer E (Trust + Reputation):** Every completed job generates evaluation data that updates worker scores and decomposition heuristics. The feedback loop from E back to C means that your routing decisions improve with every transaction. A competitor with the same models, same tools, and same workers would still route work worse because they lack the performance history.

The compounding formula: more jobs → richer reputation data → better routing → better outcomes → more buyer trust → more jobs. This is a data network effect, not a scale effect. It gets stronger with variety (more outcome types) as well as volume.

## What Is Not a Moat

- The buyer interface (Layer F) — this is a product surface, not a defensible asset. It can be replicated.

- The execution runtime (Layer D) — this is infrastructure that must be reliable but is not proprietary.

- Access to frontier models (Layer D) — model access is commoditizing. Your moat is in the data that tells you how to use the models, not the models themselves.

- The protocol specification itself — the protocol is designed to become an open standard. The moat is in the data accumulated through operating the protocol, not in the protocol design.