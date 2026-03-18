# Deferred Items — All Layers

Items identified during specification that are out of scope for v1 but should be built in future iterations.

---

## Layer A — Outcome Schema

### A1. Nested/Hierarchical Outcomes

**What**: Parent outcomes decompose into child outcomes, each with their own contracts. A `parent_outcome_id` field is included in the v1 model, but tree traversal, failure propagation, and progress rollup logic are not built.

**Why deferred**: Flat outcomes with contracts are sufficient for v1. Hierarchy adds complexity to progress tracking, failure semantics, and the buyer UI.

**Prerequisites**: Stable single-level outcome flow, buyer UI that can render tree structures.

**Trigger to build**: When buyers consistently need multi-level goal hierarchies (e.g., "renovate my house" → rooms → tasks per room).

### A2. Amendment Versioning with Structured Diffs

**What**: When a contract is amended post-ACTIVE, produce a structured diff showing exactly which fields changed between versions, with semantic meaning (not just JSON diff).

**Why deferred**: v1 tracks `version` number and `amended_fields` list on the event. Full structured diffs require a diff engine and UI to render them.

**Prerequisites**: Contract amendment flow operational, buyer UI for reviewing changes.

**Trigger to build**: When disputes arise from ambiguous amendments and parties need precise change tracking.

### A3. Template Library / Similarity Search at Intake

**What**: As the system processes more jobs, validated outcome schemas (acceptance criteria that worked, SLAs that held, confidence estimates that proved accurate) are stored and reused as starting templates for future similar requests.

**Why deferred**: Compounding happens via offline training batches, not runtime template matching. Execution speed is prioritized — no similarity search during intake.

**Prerequisites**: Sufficient volume of completed outcomes (1K+), embedding or classification pipeline for matching, evaluation of template quality.

**Trigger to build**: When intake conversation length is a bottleneck and templates could meaningfully reduce negotiation time.

### A4. Multi-Currency Support

**What**: Support currencies beyond USD. The SLA and pricing models would use a structured Money type (amount + currency code) instead of `float` in USD.

**Why deferred**: USD-only is sufficient for v1 launch market.

**Prerequisites**: Currency conversion service, decision on whether prices are stored in original currency or normalized to USD.

**Trigger to build**: When expanding to non-USD markets.

### A5. LLM Evaluation Prompt Authoring in Schema

**What**: For `llm_evaluation` acceptance criteria, store the evaluation prompt or rubric in the schema itself rather than leaving it entirely to Layer E.

**Why deferred**: Decoupling schema from LLM capability is the right v1 choice. Layer E owns evaluation methodology.

**Prerequisites**: Stable evaluation patterns in Layer E, understanding of which criteria types benefit from schema-embedded prompts.

**Trigger to build**: When Layer E evaluation quality is inconsistent and tighter coupling between criteria definition and evaluation logic would help.

### A6. Composability — Outcome Children Array with Dependency Ordering

**What**: The spec mentions a `children[]` array with dependency ordering for composable outcomes. v1 has `parent_outcome_id` but no dependency ordering between sibling outcomes.

**Why deferred**: Same as A1 — flat structure is sufficient for v1.

**Prerequisites**: Nested outcomes (A1).

**Trigger to build**: When sibling outcomes have meaningful ordering constraints (e.g., "transcribe audio" must complete before "write show notes").

---

## Layer B — Task Decomposition Engine

### B1. Learning Loop (Offline Training)

**What**: Every completed job feeds decomposition patterns back into the planner. Over time, the engine learns that "produce a podcast package" for a specific domain reliably decomposes into a known subgraph, reducing planning latency and improving cost estimates.

**Why deferred**: Requires 10K+ completed decompositions to be meaningful. No training data exists at launch.

**Prerequisites**: Production job volume, DAG version history stored in database (v1 stores this), pipeline for extracting training examples from completed DAGs.

**Trigger to build**: When the system has processed 1K+ jobs and decomposition quality or latency becomes a measurable bottleneck.

### B2. Fine-Tuned Decomposition Model

**What**: Replace the frontier model (gpt-5.2) with a specialized fine-tuned model for task decomposition, trained on historical DAG patterns from the platform.

**Why deferred**: Requires the learning loop (B1) plus sufficient volume and diversity of completed decompositions (recommendation: 10K+).

**Prerequisites**: Learning loop operational, evaluation framework to compare fine-tuned vs. frontier model quality.

**Trigger to build**: When frontier model costs become significant OR decomposition quality plateaus with few-shot prompting.

### B3. Resource Constraint Modeling

**What**: Model capacity limits in the DAG (e.g., "only 2 concurrent human reviewers") as constraints that affect scheduling. The spec mentions this as part of parallelization rules.

**Why deferred**: Resource constraints are dynamic (availability changes in real time) and are better resolved at execution time by Layer D, which has access to Layer C's real-time availability data.

**Prerequisites**: Layer C real-time availability API, Layer D scheduler with constraint satisfaction.

**Trigger to build**: When scheduling conflicts (e.g., over-committing scarce human workers) become a measurable problem in production.

### B4. Novel Outcome Type Validation

**What**: For outcome types the system has never seen before, the LLM-generated decomposition should be validated by a human operator before first execution. The validated pattern is then stored for future reuse.

**Why deferred**: Requires an operator review UI and a pattern storage/retrieval system that doesn't exist yet.

**Prerequisites**: Operator tooling (could be part of Layer F admin surface), pattern database.

**Trigger to build**: When the system starts receiving outcome types outside its training distribution and decomposition quality drops for novel requests.

### B5. Separate Suitability Classification Pass

**What**: Instead of the planner LLM producing both the DAG structure and the human/AI suitability scores in a single call, use a second, lighter model for suitability classification.

**Why deferred**: Single-call approach is pragmatic for v1. Separation only justified if suitability scoring quality is measurably poor.

**Prerequisites**: Evaluation framework comparing single-call vs. two-pass quality, availability of a lighter model deployment on Azure.

**Trigger to build**: When suitability mismatches (e.g., routing a task to AI that should have gone to a human) become a measurable source of task failures.

### B6. Decomposition Depth Override by Buyer

**What**: Allow the buyer to request coarser or finer decomposition granularity (e.g., "I want fewer, bigger tasks" or "break this down as finely as possible").

**Why deferred**: The default 35-minute AI ceiling and planner judgment handle most cases. Buyer override adds complexity to the intake flow and planner prompt.

**Prerequisites**: UI for expressing granularity preference, propagation from Layer A intake to Layer B planner context.

**Trigger to build**: When buyer feedback indicates the default granularity is consistently wrong for certain outcome types.

---

## Layer C — Capability and Routing Index

### C1. Global DAG Optimization

**What**: When Layer B produces a DAG with multiple tasks, optimize worker assignment across all tasks simultaneously rather than per-task. E.g., if task 3 and task 7 both need "content_writing," assigning them to the same worker might be cheaper/faster.

**Why deferred**: Combinatorial optimization across 50 tasks × N candidates is complex. Per-task matching is sufficient for v1 and simpler to debug.

**Prerequisites**: Stable per-task matching pipeline, optimization library integration, evaluation framework to measure global vs. per-task quality.

**Trigger to build**: When per-task matching produces measurably suboptimal assignments (e.g., same buyer paying for 5 different content writers when one could handle all tasks).

### C2. Fine-Tuned Scoring Function from Layer E Data

**What**: Train a learned scoring function on historical task-worker-outcome triples from Layer E, replacing the LLM reasoning agent's judgment with a faster, cheaper model for routine matches.

**Why deferred**: Requires sufficient volume of completed task-worker-outcome triples to train on. The LLM reasoning agent handles v1.

**Prerequisites**: Layer E operational with enough completed jobs (1K+), evaluation framework comparing learned scorer vs. LLM reasoning agent.

**Trigger to build**: When matching latency or cost becomes a bottleneck AND sufficient training data exists.

### C3. Platform Adapter Implementations

**What**: Actual integrations with Fiverr, Upwork, TaskRabbit, LinkedIn, and other platforms. The adapter interface is defined in v1 but no implementations ship.

**Why deferred**: Legal complexity (terms of service, scraping policies), API access negotiations, and the computer tool read-only interface needs infrastructure buildout.

**Prerequisites**: Legal review of platform ToS, computer tool VM infrastructure, platform-specific profile mapping.

**Trigger to build**: When the web crawl discovery pipeline is insufficient for a high-demand skill category and a specific platform has concentrated supply.

### C4. Graph Database for Provenance

**What**: Graph database (Neo4j or cost-optimized alternative) for storing provenance graphs, relationship queries ("workers who frequently collaborate"), and the E → C feedback loop visualization.

**Why deferred**: Cosmos DB NoSQL handles v1 storage needs. Graph queries are a Layer E concern and can be built when provenance tracking is implemented.

**Prerequisites**: Layer E operational, clear provenance query patterns identified, cost analysis of graph DB options.

**Trigger to build**: When provenance queries become important for dispute resolution or buyer transparency.

### C5. Capability Taxonomy

**What**: Hierarchical skill taxonomy with at least 3 levels (domain > function > specialization). v1 uses free-form tags matched via LLM.

**Why deferred**: Premature taxonomy constrains discovery. Free-form tags allow the vocabulary to emerge from actual job data.

**Prerequisites**: Sufficient volume of completed jobs (5K+), clustering analysis of free-form tags to identify natural hierarchy.

**Trigger to build**: When LLM-based tag matching becomes unreliable or slow due to vocabulary inconsistency, and enough data exists to build a high-quality taxonomy.

### C6. Learned Routing Weights from Buyer Satisfaction

**What**: Learn the weights for how quality, speed, cost, and reliability map to buyer satisfaction, using a regression model trained on buyer feedback data.

**Why deferred**: Requires buyer satisfaction data from completed jobs. The LLM reasoning agent uses prompt-encoded heuristics for v1.

**Prerequisites**: Buyer satisfaction tracking in Layer E/F, sufficient volume of rated completions.

**Trigger to build**: When the heuristic weights produce measurably suboptimal matches and enough buyer feedback data exists to train a model.

---

## Layer D — Execution, Evaluation, and Handoff Protocol

### D1. Human QA Workers for Evaluation

**What**: Route tasks with `human_judgment` acceptance criteria to dedicated QA workers (not the buyer) for professional evaluation. QA workers are sourced from Layer C and compensated.

**Why deferred**: For v1, the buyer performs QA on `human_judgment` criteria. Dedicated QA workers require a QA workforce, payment model, and routing logic.

**Prerequisites**: Layer C populated with QA-capable workers, payment model for QA work, UI for QA review workflow.

**Trigger to build**: When buyer QA becomes a bottleneck (buyers are slow to review, or buyers lack expertise to evaluate certain task types).

### D2. Multi-Dimensional Learned Risk Scoring

**What**: Replace LLM-based risk scoring with a learned model trained on real transaction data. Input dimensions: monetary value, irreversibility, category sensitivity, participant trust, dispute history, novelty. Output: calibrated risk score.

**Why deferred**: LLM-first risk scoring is sufficient for v1 and captures nuance. Learned weights require sufficient transaction volume with dispute/escalation outcomes.

**Prerequisites**: Transaction volume (1K+ contracts with resolution outcomes), evaluation framework comparing LLM vs. learned scorer.

**Trigger to build**: When LLM risk scoring becomes a latency or cost bottleneck, or when scoring inconsistency is measurably affecting buyer trust.

### D3. Agent-to-External-Platform Execution

**What**: AI agents execute tasks on external platforms (Fiverr, Upwork, etc.) via platform adapters, translating between AWP contracts and platform-native formats.

**Why deferred**: Requires platform adapter implementations (deferred in Layer C), and raises complex questions about identity, payment, and liability across platforms.

**Prerequisites**: Layer C platform adapter implementations (C3), legal framework for cross-platform execution, platform-specific agent training.

**Trigger to build**: When buyer demand for cross-platform execution is validated and platform adapters are operational.

### D4. Task-Type-Specific Evaluators

**What**: Replace the single generic evaluator agent with specialized evaluators per task type (e.g., a code review evaluator, a content quality evaluator, a design evaluator), each with domain-specific tools and rubrics.

**Why deferred**: Single evaluator is simpler and sufficient for v1. Specialization only justified when evaluation quality is measurably poor for specific task types.

**Prerequisites**: Evaluation quality tracking per task type, sufficient volume to identify which types need specialized evaluation.

**Trigger to build**: When the generic evaluator consistently misjudges quality for specific task types (e.g., code tasks, design tasks).

### D5. In-Flight Re-Decomposition

**What**: Layer D directly decomposes a failing task into finer subtasks during execution, without delegating back to Layer B. This would be step 3 of a 4-step retry cascade.

**Why deferred**: Simpler to delegate replanning to Layer B, which already has the planner agent and DAG validation. In-flight decomposition would duplicate planning logic in the execution layer.

**Prerequisites**: Evidence that the Layer B replan round-trip is too slow for time-sensitive failures.

**Trigger to build**: When the latency of Layer B replanning causes SLA breaches during execution.

---

## Layer E — Trust and Reputation

### E1. Automated QA Checks (Plagiarism, Factual Accuracy, Format Compliance)

**What**: Automated quality checks that run before or alongside LLM evaluation — plagiarism detection, factual accuracy verification, format/schema compliance validation. These would be function tools available to the evaluator or as pre-evaluation gates.

**Why deferred**: The single evaluator agent with LLM judgment handles v1. Specialized QA tools require third-party integrations (plagiarism APIs), knowledge bases (factual verification), and format-specific parsers.

**Prerequisites**: Evaluator agent operational, identified task types where automated QA would catch issues the LLM misses.

**Trigger to build**: When evaluation quality is measurably poor for specific quality dimensions (e.g., plagiarized content passing LLM review, factual errors in research deliverables).

### E2. Score Contesting by Workers

**What**: Allow workers to contest their reputation scores by submitting evidence (e.g., context for a low rating, proof of extenuating circumstances). Contested scores enter a review queue processed by an LLM agent or human moderator.

**Why deferred**: v1 focuses on score accuracy from the platform's perspective. Contesting adds a moderation workflow, appeal queue, and policy decisions about what constitutes valid grounds for contesting.

**Prerequisites**: Sufficient worker volume, moderation tooling, clear contest policy.

**Trigger to build**: When workers report that scores are unfair or inaccurate and the platform needs a trust-building mechanism for the supply side.

### E3. Exponential Decay on Reputation Scores

**What**: Apply time-weighted decay to reputation scores so that recent performance matters more than historical performance. 30-day half-life for standard scores, 90-day half-life for dispute-related scores.

**Why deferred**: Adds complexity to the scoring engine. v1 treats all data points equally. Decay is only valuable when workers have enough history that old scores could mislead.

**Prerequisites**: Sufficient per-worker transaction volume (10+ completed jobs for meaningful decay), evaluation of decay impact on routing quality.

**Trigger to build**: When workers with long histories have scores that don't reflect their current performance level (e.g., a worker who was great 6 months ago but has declined recently).

### E4. Learned Routing Weights from Reputation Data

**What**: Train a model on historical reputation-to-outcome data to learn optimal weights for the 6 reputation dimensions when predicting task success. Replace the configurable static weights with learned weights.

**Why deferred**: Requires sufficient volume of completed task-worker-outcome triples. The configurable env-var weights handle v1.

**Prerequisites**: Layer E operational with 1K+ scored completions, evaluation framework comparing learned vs. static weights.

**Trigger to build**: When the static dimension weights produce measurably suboptimal composite scores and enough data exists to train a regression model.

### E5. Community-Based Vouching

**What**: Allow verified workers to vouch for other workers' capabilities, creating a trust graph where established workers can accelerate the verification of new entrants. Vouching would be a weighted signal in the reputation model.

**Why deferred**: Requires a trust graph model, vouching UI, and careful design to prevent gaming (e.g., vouching rings). The web crawl + AWP completions path handles v1 verification.

**Prerequisites**: Active worker community (100+ verified workers), trust graph storage (could extend Neo4j/Gremlin provenance graph), anti-gaming heuristics.

**Trigger to build**: When new worker onboarding is slow due to the cold-start problem and established workers could meaningfully accelerate trust-building.

---

## Layer F — Buyer & Worker Control Surface

### F1. SMS/Email Notification Channels

**What**: Extend notifications beyond in-app to include SMS (via Twilio or Azure Communication Services) and email (via SendGrid or Azure Communication Services). Notification routing would be configurable per buyer: critical → SMS + email + in-app, important → email + in-app, informational → in-app only.

**Why deferred**: In-app notifications are sufficient for v1. Multi-channel notification adds integration complexity, cost per message, and preference management UI.

**Prerequisites**: Notification preference UI, integration with SMS/email provider, unsubscribe/opt-out compliance.

**Trigger to build**: When buyers miss critical approval gates because they're not actively in the app, causing execution delays.

### F2. Admin/Operator Tooling

**What**: An admin surface for AWP operators to monitor system health, manage disputes that escalate beyond AI resolution, review flagged workers, and oversee platform-wide metrics (active contracts, matching latency, evaluation quality).

**Why deferred**: v1 focuses on the buyer and worker experience. Operator tooling can use direct database queries and Cosmos DB Data Explorer initially.

**Prerequisites**: Operational volume requiring dedicated tooling, defined operator roles and permissions.

**Trigger to build**: When platform volume exceeds what can be monitored via ad-hoc queries and manual Cosmos DB inspection.

### F3. Delegation Chains in UI

**What**: Support delegation chains in the UI — Jake managing outcomes on Harold's behalf, Dorothy's grandson acting as her proxy. This requires scoped permissions (Jake can approve plans but not cancel contracts), delegation invitations, and an audit trail of who acted on whose behalf.

**Why deferred**: v1 uses a single identity per account. The buyer can informally act on anyone's behalf without the system modeling the delegation. Formal delegation adds permission scoping, invitation flows, and audit complexity.

**Prerequisites**: Layer C delegation chain model (already specified in SPEC-LAYER-C), UI for managing delegates, permission scoping rules.

**Trigger to build**: When buyers explicitly request the ability to formally delegate control to others with scoped permissions.

### F4. Worker Marketplace / Task Browsing

**What**: Allow workers to browse available tasks and express interest, rather than only being system-assigned. This would add a marketplace view where workers see tasks matching their capabilities and can "apply" or "bid."

**Why deferred**: v1 matching is fully system-driven via Layer C. Worker bidding adds complexity to the matching pipeline and changes the UX model from "you're assigned" to "you compete."

**Prerequisites**: Layer C matching pipeline modification to incorporate worker-initiated bids, bid evaluation logic, UI for browsing and filtering available tasks.

**Trigger to build**: When worker utilization is low and system-driven matching is not surfacing enough work to willing providers.

### F5. Native Mobile Apps

**What**: iOS and Android native apps (or React Native) for buyers and workers who need a mobile-optimized experience beyond responsive web.

**Why deferred**: Responsive web covers mobile for v1. Native apps add development cost, app store management, and push notification infrastructure.

**Prerequisites**: Stable web app feature set, validated demand for native-specific features (push notifications, offline mode, camera integration for deliverable photos).

**Trigger to build**: When mobile usage exceeds 40% of traffic and responsive web limitations (no push, no offline) are causing measurable drop-off.

### F6. Buyer Reputation Display

**What**: Show buyer reputation to workers when they receive task assignments, so workers can assess whether a buyer is reliable (pays on time, provides clear requirements, fair dispute resolution).

**Why deferred**: Layer E collects buyer reputation data in v1 but does not surface it. Displaying buyer scores to workers changes the power dynamic and requires careful design.

**Prerequisites**: Sufficient buyer transaction volume (50+ completed contracts), Layer E buyer scoring operational, design for how buyer scores affect worker acceptance decisions.

**Trigger to build**: When worker task decline rates are high and workers report uncertainty about buyer reliability as a factor.
