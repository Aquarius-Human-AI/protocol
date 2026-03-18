# Layer E — Trust and Reputation: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Approved for implementation
**Dependencies:** SPEC-LAYER-A.md, SPEC-LAYER-C.md, SPEC-LAYER-D.md, ADR-006, ADR-007

---

## 1. Purpose

Layer E converts raw execution history into defensible routing intelligence. It has two functions:

1. **Trust**: Verify that work was done correctly, maintain an immutable audit trail, and produce provenance records
2. **Reputation**: Score worker performance over time using Bayesian updating, feed scores back into Layer C routing decisions

Layer E is a **moat layer** — every completed job enriches the reputation data. The feedback loop from E → C is the core compounding mechanism: more jobs → richer reputation → better routing → better outcomes → more buyer trust → more jobs.

---

## 2. Scope

### In Scope (v1)

- **Bayesian scoring engine**: Full Bayesian scoring (Beta distributions for rates, Normal for continuous scores), 6 dimensions per worker per skill, composite weighted average, confidence bands from posterior
- **LLM-driven scoring decisions**: Skill normalization across free-form tags, update weight determination (job complexity/evaluation confidence), dispute impact severity
- **External review ingestion**: Consume reviews collected by Layer C crawler, cross-source identity resolution (LLM + shared signals like phone/address/URL), configurable inclusion in Bayesian scoring with LLM-determined weights
- **Feedback loop**: Async write-back to Layer C, event carries full 6-dimension scores + composite
- **Audit trail**: Append-only Cosmos DB with hash chaining, authoritative immutable record
- **Provenance**: Structured JSON document per contract in Cosmos DB (Apache Gremlin ready for future graph queries)
- **Anti-gaming**: LLM-based anomaly detection on score trajectories
- **Buyer reputation**: Data collection only (dispute frequency, behavior patterns)
- **Trust signals**: Aggregated scores for buyers, simplified view for workers
- **Periodic recalculation**: Scheduled recalculation + on new data point arrival

### Deferred (see DEFERRED.md)

- QA checks (plagiarism/originality, factual accuracy, format compliance)
- Score contesting by workers
- Exponential decay (30-day half-life)
- Learned routing weights from buyer satisfaction data
- Community-based vouching for verification

---

## 3. Data Models

All models use Pydantic v2 `BaseModel` with strict typing.

### 3.1 Enums

```python
class ScoreDimension(str, Enum):
    COMPLETION_RATE = "completion_rate"     # Fraction of accepted tasks completed
    QUALITY_SCORE = "quality_score"         # Rolling evaluation outcomes
    SPEED_SCORE = "speed_score"             # Actual vs. estimated duration
    COST_EFFICIENCY = "cost_efficiency"     # Actual vs. estimated cost
    ESCALATION_RATE = "escalation_rate"     # Fraction requiring human escalation
    RELIABILITY = "reliability"             # Variance in the above — low variance = predictable

class ReviewSource(str, Enum):
    AWP_COMPLETION = "awp_completion"       # Direct AWP task evaluation
    GOOGLE_REVIEWS = "google_reviews"
    YELP = "yelp"
    LINKEDIN = "linkedin"
    UPWORK = "upwork"
    FIVERR = "fiverr"
    TRUSTPILOT = "trustpilot"
    OTHER = "other"

class AuditActionType(str, Enum):
    TASK_ASSIGNED = "task_assigned"
    TASK_STARTED = "task_started"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    EVALUATION_COMPLETED = "evaluation_completed"
    HANDOFF_OCCURRED = "handoff_occurred"
    DISPUTE_RAISED = "dispute_raised"
    DISPUTE_RESOLVED = "dispute_resolved"
    REPUTATION_UPDATED = "reputation_updated"
    REVIEW_INGESTED = "review_ingested"
    ANOMALY_DETECTED = "anomaly_detected"
    CONTRACT_STATE_CHANGED = "contract_state_changed"
```

### 3.2 BayesianScore

Individual score for one dimension of one skill.

```python
class BayesianScore(BaseModel):
    dimension: ScoreDimension
    # For rate dimensions (completion_rate, escalation_rate): Beta distribution
    # For continuous dimensions (quality, speed, cost_efficiency, reliability): Normal distribution
    distribution_type: str                   # "beta" or "normal"
    # Beta distribution parameters (for rate dimensions)
    alpha: float = 1.0                       # Successes + prior
    beta_param: float = 1.0                  # Failures + prior (named to avoid shadowing)
    # Normal distribution parameters (for continuous dimensions)
    mean: float = 0.5                        # Posterior mean
    variance: float = 0.25                   # Posterior variance (high = uncertain)
    # Derived values
    point_estimate: float = 0.5              # MAP or posterior mean
    confidence_low: float = 0.0              # Lower bound of 90% credible interval
    confidence_high: float = 1.0             # Upper bound of 90% credible interval
    observation_count: int = 0               # Number of data points
    last_updated_at: datetime | None = None
```

### 3.3 SkillReputation

All 6 dimensions for a single skill.

```python
class SkillReputation(BaseModel):
    skill: str                               # Free-form skill tag (canonical form after LLM normalization)
    original_tags: list[str] = []            # All raw tags that map to this canonical skill
    scores: dict[ScoreDimension, BayesianScore]  # One BayesianScore per dimension
    composite_score: float = 0.5             # Weighted average of all dimensions
    composite_confidence_low: float = 0.0
    composite_confidence_high: float = 1.0
    total_observations: int = 0              # Total data points across all dimensions
    meets_routing_threshold: bool = False    # True if >= 5 AWP completions for this skill
    last_updated_at: datetime | None = None
```

### 3.4 WorkerReputation

Full reputation profile for a worker.

```python
class WorkerReputation(BaseModel):
    id: str                                  # uuid4
    identity_id: str                         # Reference to IdentityRecord in Layer C
    capability_card_id: str                  # Reference to CapabilityCard in Layer C
    skill_reputations: list[SkillReputation] = []
    overall_composite: float = 0.5           # Weighted average across all skills
    overall_confidence_low: float = 0.0
    overall_confidence_high: float = 1.0
    total_awp_completions: int = 0
    total_disputes: int = 0
    total_disputes_sustained: int = 0        # Disputes where the worker was at fault
    external_reviews: list[ExternalReview] = []
    anomaly_flags: list[AnomalyFlag] = []
    created_at: datetime
    updated_at: datetime
```

### 3.5 BuyerReputation

Data collection only for v1 — not used for routing or matching decisions.

```python
class BuyerReputation(BaseModel):
    id: str                                  # uuid4
    identity_id: str                         # Reference to buyer's IdentityRecord
    total_contracts: int = 0
    total_disputes_raised: int = 0
    disputes_dismissed: int = 0              # Frivolous disputes
    disputes_sustained: int = 0              # Legitimate disputes
    average_satisfaction_given: float | None = None
    behavior_notes: list[str] = []           # LLM-generated observations about buyer behavior
    created_at: datetime
    updated_at: datetime
```

### 3.6 ExternalReview

A review collected from an external source and linked to a worker identity.

```python
class ExternalReview(BaseModel):
    id: str                                  # uuid4
    source: ReviewSource
    source_url: str | None = None
    reviewer_name: str | None = None
    rating: float | None = None              # Normalized to 0.0-1.0
    text: str | None = None
    date: datetime | None = None
    identity_resolution_confidence: float    # 0.0-1.0, how confident we are this review matches the worker
    identity_resolution_method: str          # "llm", "phone_match", "address_match", "url_match", etc.
    scoring_weight: float = 0.0             # LLM-determined weight for Bayesian scoring (0 = excluded)
    included_in_scoring: bool = False       # Whether this review is configured to feed into Bayesian scores
    ingested_at: datetime
```

### 3.7 AnomalyFlag

```python
class AnomalyFlag(BaseModel):
    id: str                                  # uuid4
    worker_identity_id: str
    skill: str | None = None                 # Specific skill affected, or None for overall
    anomaly_type: str                        # e.g., "rapid_score_increase", "unusual_completion_pattern", "review_spike"
    description: str                         # LLM-generated explanation
    severity: str                            # "low", "medium", "high"
    detected_at: datetime
    resolved: bool = False
    resolution_notes: str | None = None
```

### 3.8 ReputationUpdate

Record of a single update to a worker's reputation (the atomic unit of scoring).

```python
class ReputationUpdate(BaseModel):
    id: str                                  # uuid4
    worker_identity_id: str
    capability_card_id: str
    skill: str                               # Canonical skill tag
    source_type: str                         # "awp_task", "dispute_resolution", "external_review"
    source_id: str                           # task_id, dispute_id, or review_id
    # Raw input data
    task_quality_score: float | None = None
    task_completed: bool | None = None
    actual_duration_minutes: float | None = None
    estimated_duration_minutes: float | None = None
    actual_cost_usd: float | None = None
    estimated_cost_usd: float | None = None
    required_escalation: bool | None = None
    # LLM-determined weights
    complexity_weight: float = 1.0           # How much this observation should move the posterior
    evaluation_confidence: float = 1.0       # Confidence in the evaluation that produced this data
    # Output
    dimensions_updated: list[ScoreDimension] = []
    previous_composite: float | None = None
    new_composite: float | None = None
    timestamp: datetime
```

---

## 4. Audit Trail

### 4.1 Design

The audit trail is the authoritative, immutable record of all significant actions in the system. It is separate from Layer D's operational event store. Layer E's audit trail provides cryptographic integrity via hash chaining for both regulatory compliance and buyer transparency.

### 4.2 Audit Entry

```python
class AuditEntry(BaseModel):
    id: str                                  # uuid4
    sequence_number: int                     # Monotonically increasing, system-wide
    action_type: AuditActionType
    actor_id: str                            # Identity ID of human or agent that performed the action
    actor_type: str                          # "human", "agent", "system"
    contract_id: str | None = None
    task_id: str | None = None
    # Content
    input_hash: str | None = None            # SHA-256 of input data
    output_hash: str | None = None           # SHA-256 of output data
    evaluation_result: dict[str, Any] | None = None
    details: dict[str, Any] = {}             # Action-specific details
    # Hash chain
    previous_hash: str                       # SHA-256 hash of the previous entry
    entry_hash: str                          # SHA-256 hash of this entry (computed from all fields + previous_hash)
    timestamp: datetime
```

### 4.3 Hash Chaining

```python
import hashlib
import json

def compute_entry_hash(entry: AuditEntry, previous_hash: str) -> str:
    """Compute the hash for an audit entry, chaining to the previous entry."""
    payload = {
        "id": entry.id,
        "sequence_number": entry.sequence_number,
        "action_type": entry.action_type.value,
        "actor_id": entry.actor_id,
        "contract_id": entry.contract_id,
        "task_id": entry.task_id,
        "input_hash": entry.input_hash,
        "output_hash": entry.output_hash,
        "timestamp": entry.timestamp.isoformat(),
        "previous_hash": previous_hash,
    }
    canonical = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(canonical.encode()).hexdigest()

def verify_chain(entries: list[AuditEntry]) -> bool:
    """Verify the integrity of the audit chain."""
    for i, entry in enumerate(entries):
        if i == 0:
            expected_previous = "genesis"
        else:
            expected_previous = entries[i - 1].entry_hash
        if entry.previous_hash != expected_previous:
            return False
        recomputed = compute_entry_hash(entry, entry.previous_hash)
        if entry.entry_hash != recomputed:
            return False
    return True
```

### 4.4 What Gets Audited

All events from Layer D's execution + Layer E's own scoring actions flow into the audit trail. The audit trail is the **single source of truth** for immutable history.

| Action Type | Source | Audited Data |
|---|---|---|
| `task_assigned` | Layer D | task_id, provider_id, matching score |
| `task_started` | Layer D | task_id, started_at |
| `task_completed` | Layer D | task_id, artifacts hash, duration, cost |
| `task_failed` | Layer D | task_id, reason, retry count |
| `evaluation_completed` | Layer D | task_id, evaluation result, quality score |
| `handoff_occurred` | Layer D | task_id, from/to identity, reason |
| `dispute_raised` | Layer D | contract_id, reason, evidence hashes |
| `dispute_resolved` | Layer D | contract_id, outcome, reasoning |
| `reputation_updated` | Layer E | worker_id, skill, previous/new scores |
| `review_ingested` | Layer E | worker_id, source, review hash |
| `anomaly_detected` | Layer E | worker_id, anomaly type, severity |
| `contract_state_changed` | Layer A | contract_id, from/to state |

---

## 5. Provenance

### 5.1 Provenance Document

A structured JSON document per completed contract that serves as the buyer-inspectable "receipt."

```python
class ProvenanceRecord(BaseModel):
    id: str                                  # uuid4
    contract_id: str
    outcome_id: str
    # Task-level provenance
    tasks: list[TaskProvenance]
    # Aggregate
    total_tasks: int
    total_workers_involved: int
    total_duration_minutes: float
    total_cost_usd: float
    overall_quality_score: float
    # Timeline
    contract_activated_at: datetime
    contract_completed_at: datetime
    # Integrity
    audit_entry_range: tuple[int, int]       # First and last audit sequence numbers for this contract
    provenance_hash: str                     # SHA-256 of the full provenance document
    created_at: datetime

class TaskProvenance(BaseModel):
    task_id: str
    task_name: str
    worker_identity_id: str
    worker_display_name: str
    worker_node_type: str                    # human, ai_agent, hybrid_unit
    tools_used: list[str] = []               # For AI tasks: which tools/agents were invoked
    input_artifact_hashes: list[str] = []    # SHA-256 of inputs consumed
    output_artifact_hashes: list[str] = []   # SHA-256 of outputs produced
    evaluation_score: float
    evaluation_passed: bool
    duration_minutes: float
    cost_usd: float
    handoffs: list[dict[str, str]] = []      # Simplified handoff records
    started_at: datetime
    completed_at: datetime
```

### 5.2 Storage

Provenance documents are stored in Cosmos DB. The schema is designed to be compatible with Apache Gremlin if graph queries are needed in the future — each `TaskProvenance` can be converted to graph edges (worker → performed → task, task → produced → artifact, etc.).

---

## 6. Bayesian Scoring Engine

### 6.1 Distribution Types

| Dimension | Distribution | Parameters | Rationale |
|---|---|---|---|
| `completion_rate` | Beta(α, β) | α = completions + 1, β = failures + 1 | Natural model for binary outcome rates |
| `quality_score` | Normal(μ, σ²) | μ = posterior mean, σ² = posterior variance | Continuous score, 0.0-1.0 |
| `speed_score` | Normal(μ, σ²) | μ = posterior mean of (estimated/actual), σ² | Ratio, >1 means faster than estimated |
| `cost_efficiency` | Normal(μ, σ²) | μ = posterior mean of (estimated/actual), σ² | Ratio, >1 means cheaper than estimated |
| `escalation_rate` | Beta(α, β) | α = non-escalated + 1, β = escalated + 1 | Binary outcome rate (inverted: higher = fewer escalations) |
| `reliability` | Normal(μ, σ²) | μ = 1 - normalized_variance, σ² | Derived from variance of other dimensions |

### 6.2 Prior Initialization

Priors are set based on the worker's discovery source (per ADR-006):

```python
class PriorConfig(BaseModel):
    """Prior distribution parameters by source type."""
    source: str
    # Beta priors (for rate dimensions)
    beta_alpha: float
    beta_beta: float
    # Normal priors (for continuous dimensions)
    normal_mean: float
    normal_variance: float

PRIOR_CONFIGS = {
    "web_crawl": PriorConfig(
        source="web_crawl",
        beta_alpha=1.0, beta_beta=1.0,           # Uninformative (uniform)
        normal_mean=0.5, normal_variance=0.25,    # High uncertainty
    ),
    "platform_import": PriorConfig(
        source="platform_import",
        beta_alpha=3.0, beta_beta=1.5,            # Weakly informative (biased positive)
        normal_mean=0.6, normal_variance=0.1,     # Moderate uncertainty
    ),
    "manual_onboarding": PriorConfig(
        source="manual_onboarding",
        beta_alpha=2.0, beta_beta=1.0,            # Weakly informative
        normal_mean=0.55, normal_variance=0.15,   # Moderate uncertainty
    ),
}
```

### 6.3 Bayesian Update

```python
def update_beta(score: BayesianScore, success: bool, weight: float = 1.0) -> BayesianScore:
    """Update a Beta distribution with a new binary observation."""
    if success:
        score.alpha += weight
    else:
        score.beta_param += weight
    score.observation_count += 1
    # Recompute derived values
    score.point_estimate = score.alpha / (score.alpha + score.beta_param)
    # 90% credible interval via Beta quantiles
    score.confidence_low = beta_ppf(0.05, score.alpha, score.beta_param)
    score.confidence_high = beta_ppf(0.95, score.alpha, score.beta_param)
    score.last_updated_at = datetime.utcnow()
    return score

def update_normal(score: BayesianScore, observation: float, weight: float = 1.0) -> BayesianScore:
    """Update a Normal distribution with a new continuous observation."""
    # Bayesian update for Normal with known precision
    prior_precision = 1.0 / score.variance
    obs_precision = weight  # Higher weight = more precise observation
    posterior_precision = prior_precision + obs_precision
    posterior_mean = (prior_precision * score.mean + obs_precision * observation) / posterior_precision
    posterior_variance = 1.0 / posterior_precision

    score.mean = posterior_mean
    score.variance = posterior_variance
    score.observation_count += 1
    score.point_estimate = posterior_mean
    # 90% credible interval
    std = math.sqrt(posterior_variance)
    score.confidence_low = max(0.0, posterior_mean - 1.645 * std)
    score.confidence_high = min(1.0, posterior_mean + 1.645 * std)
    score.last_updated_at = datetime.utcnow()
    return score
```

### 6.4 Composite Score Calculation

```python
# Default weights — configurable via environment variables
DIMENSION_WEIGHTS = {
    ScoreDimension.COMPLETION_RATE: float(os.getenv("WEIGHT_COMPLETION_RATE", "0.20")),
    ScoreDimension.QUALITY_SCORE: float(os.getenv("WEIGHT_QUALITY_SCORE", "0.30")),
    ScoreDimension.SPEED_SCORE: float(os.getenv("WEIGHT_SPEED_SCORE", "0.15")),
    ScoreDimension.COST_EFFICIENCY: float(os.getenv("WEIGHT_COST_EFFICIENCY", "0.15")),
    ScoreDimension.ESCALATION_RATE: float(os.getenv("WEIGHT_ESCALATION_RATE", "0.10")),
    ScoreDimension.RELIABILITY: float(os.getenv("WEIGHT_RELIABILITY", "0.10")),
}

def compute_composite(skill_rep: SkillReputation) -> float:
    """Compute weighted composite score from all dimensions."""
    weighted_sum = 0.0
    total_weight = 0.0
    for dim, weight in DIMENSION_WEIGHTS.items():
        if dim in skill_rep.scores:
            weighted_sum += skill_rep.scores[dim].point_estimate * weight
            total_weight += weight
    return weighted_sum / total_weight if total_weight > 0 else 0.5
```

---

## 7. LLM-Driven Scoring Agents

### 7.1 Skill Normalization Agent

Maps free-form capability tags to canonical skill names for consistent scoring.

```python
skill_normalizer_agent = Agent(
    name="skill_normalizer",
    instructions=SKILL_NORMALIZER_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.1),
    output_type=SkillNormalizationResult,
)

class SkillNormalizationResult(BaseModel):
    canonical_skill: str                     # The normalized skill name
    original_tags: list[str]                 # Input tags that map to this skill
    reasoning: str                           # Why these tags are the same skill
    confidence: float                        # 0.0-1.0
```

**Skill Normalizer Prompt (Key Behaviors):**
- Group semantically equivalent free-form tags into a single canonical name
- "residential_gutter_cleaning" and "roof_gutter_maintenance" → "gutter_cleaning"
- Be specific enough to preserve meaningful distinctions ("tax_preparation_small_business" vs. "tax_preparation_corporate")
- Return a confidence score — low confidence means the tags might represent different skills

### 7.2 Update Weight Agent

Determines how much a single observation should move the Bayesian posterior.

```python
update_weight_agent = Agent(
    name="update_weight_assessor",
    instructions=UPDATE_WEIGHT_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.1),
    output_type=UpdateWeightResult,
)

class UpdateWeightResult(BaseModel):
    complexity_weight: float                 # 0.1-3.0 — how complex was this job
    evaluation_confidence: float             # 0.1-1.0 — how reliable is the evaluation
    combined_weight: float                   # complexity × evaluation_confidence
    reasoning: str
```

**Update Weight Prompt (Key Behaviors):**
- Assess job complexity from: estimated cost, number of acceptance criteria, task duration, domain difficulty
- Assess evaluation confidence from: evaluator's quality score, criterion type (threshold is high confidence, llm_evaluation is moderate, human_judgment is high)
- A complex tax return with high-confidence evaluation: weight ~2.5
- A trivial file rename with borderline evaluation: weight ~0.3
- Weight range: 0.1 (minimal impact) to 3.0 (high impact)

### 7.3 Dispute Impact Agent

Determines how a dispute resolution affects the worker's reputation.

```python
dispute_impact_agent = Agent(
    name="dispute_impact_assessor",
    instructions=DISPUTE_IMPACT_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.2),
    output_type=DisputeImpactResult,
)

class DisputeImpactResult(BaseModel):
    worker_impact: dict[ScoreDimension, float]   # Impact per dimension (-1.0 to 0.0 for negative, 0.0 for no impact)
    buyer_impact: dict[str, Any]                  # Notes for buyer reputation
    reasoning: str
```

**Dispute Impact Prompt (Key Behaviors):**
- `refund` → strong negative on quality and completion rate
- `redo` → moderate negative on quality, no impact on completion rate (they're redoing it)
- `partial_credit` → mild negative on quality, proportional to what was missing
- `dismissed` → no impact on worker; note frivolous dispute on buyer record
- Consider context: was the failure due to worker negligence, unclear requirements, or external factors?

### 7.4 External Review Weight Agent

Determines how much weight an external review should carry in Bayesian scoring.

```python
review_weight_agent = Agent(
    name="review_weight_assessor",
    instructions=REVIEW_WEIGHT_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.2),
    output_type=ReviewWeightResult,
)

class ReviewWeightResult(BaseModel):
    scoring_weight: float                    # 0.0-1.0
    quality_signal: float | None = None      # Extracted quality score (0.0-1.0)
    dimensions_affected: list[ScoreDimension]
    reasoning: str
```

**Review Weight Prompt (Key Behaviors):**
- Structured platform reviews (Upwork, Fiverr) → higher weight (0.5-0.8)
- Google/Yelp reviews → moderate weight (0.2-0.5)
- Anonymous or unverified reviews → low weight (0.05-0.2)
- Consider identity resolution confidence: if we're only 60% sure this review matches the worker, cap the weight at 0.3
- Extract quality signals from review text ("great work, on time" → positive quality + speed)

### 7.5 Anomaly Detection Agent

Detects suspicious patterns in score trajectories.

```python
anomaly_detector_agent = Agent(
    name="anomaly_detector",
    instructions=ANOMALY_DETECTION_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.2),
    tools=[
        get_score_history,           # Retrieve historical scores for a worker
        get_recent_completions,      # Recent task completions and evaluations
        get_review_history,          # External review ingestion history
    ],
    output_type=AnomalyDetectionResult,
)

class AnomalyDetectionResult(BaseModel):
    anomalies_found: list[AnomalyFlag]
    workers_checked: int
    summary: str
```

**Anomaly Detection Prompt (Key Behaviors):**
- Flag rapid score increases (e.g., 0.5 → 0.9 in one week) — possible gaming
- Flag unusual completion patterns (e.g., 20 tasks completed in one day for a human worker)
- Flag review spikes from external sources
- Flag consistently perfect scores (no real worker is 1.0 on everything)
- Severity levels: low (note it), medium (flag for manual review), high (restrict routing until resolved)

---

## 8. External Review Ingestion

### 8.1 Flow

Reviews are collected by Layer C's crawler agent during demand-driven discovery. Layer E processes them:

1. Layer C crawler discovers a worker and collects external reviews alongside the capability card
2. Reviews are passed to Layer E via `review.collected` event
3. Layer E performs cross-source identity resolution:
   a. **Shared signals**: Phone number, address, URL, business name match against existing identity records
   b. **LLM matching**: For ambiguous cases, the LLM compares review metadata (name, location, service description) against known workers
4. Review weight agent determines the scoring weight
5. If `included_in_scoring` is configured for this source, the review feeds into the Bayesian update
6. Review stored on the `WorkerReputation.external_reviews` list
7. Audit trail entry recorded

### 8.2 Identity Resolution

```python
class IdentityResolutionResult(BaseModel):
    matched_identity_id: str | None          # None if no match found
    confidence: float                        # 0.0-1.0
    method: str                              # "phone_match", "address_match", "url_match", "llm", "combined"
    reasoning: str

identity_resolver_agent = Agent(
    name="identity_resolver",
    instructions=IDENTITY_RESOLUTION_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.1),
    tools=[
        search_identities_by_phone,
        search_identities_by_address,
        search_identities_by_url,
        search_identities_by_name,
    ],
    output_type=IdentityResolutionResult,
)
```

### 8.3 Configurable Review Sources

```python
# Which external review sources feed into Bayesian scoring
REVIEW_SOURCES_IN_SCORING = os.getenv(
    "REVIEW_SOURCES_IN_SCORING",
    "awp_completion,upwork,fiverr"  # Comma-separated
).split(",")
```

Sources not in this list are stored but don't affect scores. This is configurable to allow gradual expansion as confidence in source quality grows.

---

## 9. Feedback Loop to Layer C

### 9.1 Async Write-Back

After any reputation update, Layer E emits a `reputation.updated` event carrying the full scoring data. Layer C listens and updates the capability card's `PerformanceScores`.

```python
class ReputationUpdatedEvent(BaseModel):
    event_type: Literal["reputation.updated"] = "reputation.updated"
    identity_id: str
    capability_card_id: str
    # Full 6-dimension scores
    completion_rate: float
    completion_rate_confidence: tuple[float, float]
    quality_score: float
    quality_score_confidence: tuple[float, float]
    speed_score: float
    speed_score_confidence: tuple[float, float]
    cost_efficiency: float
    cost_efficiency_confidence: tuple[float, float]
    escalation_rate: float
    escalation_rate_confidence: tuple[float, float]
    reliability: float
    reliability_confidence: tuple[float, float]
    # Composite
    composite_score: float
    composite_confidence: tuple[float, float]
    # Metadata
    total_awp_completions: int
    meets_routing_threshold: bool            # >= 5 AWP completions
    anomaly_flags_active: int
    timestamp: datetime
```

### 9.2 Layer C Update

Layer C receives this event and updates the `PerformanceScores` on the capability card:

```python
# Layer C updates these fields from the reputation event
performance.quality = event.quality_score
performance.speed = event.speed_score
performance.cost_efficiency = event.cost_efficiency
performance.completed_jobs = event.total_awp_completions
performance.last_updated_at = event.timestamp
```

The full 6-dimension detail stays in Layer E. Layer C's `PerformanceScores` carries the summary used for matching.

---

## 10. Trust Signals

### 10.1 Buyer-Facing (via Layer F)

Aggregated, simplified trust indicators:

```python
class TrustSignal(BaseModel):
    worker_identity_id: str
    display_name: str
    verification_status: str                 # "unverified", "verified", "claimed"
    completed_jobs_this_skill: int
    average_quality_score: float             # Point estimate
    confidence_level: str                    # "low" (<5 jobs), "medium" (5-20), "high" (20+)
    composite_score: float
    anomaly_flags: int                       # Number of active anomaly flags (0 = clean)
```

### 10.2 Worker-Facing (Simplified View)

Workers see a simplified representation of their scores:

```python
class WorkerScoreView(BaseModel):
    overall_rating: float                    # Composite, displayed as e.g., "4.2 out of 5"
    total_completed_jobs: int
    skill_ratings: list[SkillRatingView]
    recent_feedback: list[str]               # Recent deficiency notes or positive feedback

class SkillRatingView(BaseModel):
    skill: str
    rating: float                            # Normalized to 5-star scale for familiarity
    jobs_completed: int
    trend: str                               # "improving", "stable", "declining"
```

Workers cannot contest scores in v1.

---

## 11. Periodic Recalculation

### 11.1 Schedule

Reputation scores are recalculated:
- **On new data**: Immediately when a task evaluation completes, dispute resolves, or external review is ingested
- **Periodically**: Scheduled batch job (configurable interval, default: daily) recalculates all active worker scores

### 11.2 Periodic Recalculation Job

```python
RECALCULATION_INTERVAL_HOURS = int(os.getenv("RECALCULATION_INTERVAL_HOURS", "24"))
```

The periodic job:
1. Fetches all workers with reputation records
2. Recalculates composite scores (re-weights dimensions with current weight config)
3. Runs reliability dimension update (recalculates variance of other dimensions)
4. Runs anomaly detection on workers with recent activity
5. Emits `reputation.updated` events for any workers whose scores changed
6. Logs recalculation to audit trail

---

## 12. Events

### 12.1 Inbound Events (Layer E Listens)

| Topic | Event | Action |
|---|---|---|
| `pln.execution` | `task.evaluation_complete` | Update worker reputation for the completed task |
| `pln.disputes` | `dispute.resolved` | Apply dispute impact to worker (and buyer) reputation |
| `pln.workers` | `review.collected` | Ingest external review, resolve identity, assess weight |
| `pln.contracts` | `contract.state_changed` | Record in audit trail |
| `pln.layer_f.feedback` | `task.feedback_submitted` | Buyer free-text feedback, fed into update_weight_agent |

### 12.2 Outbound Events (Layer E Emits)

| Topic | Event | Trigger |
|---|---|---|
| `pln.reputation` | `reputation.updated` | Worker score updated (carries full 6 dimensions + composite) |
| `pln.reputation` | `anomaly.detected` | Anomaly flagged on a worker's score trajectory |

### 12.3 Event Topics

| Topic | Events |
|---|---|
| `pln.reputation` | `reputation.updated`, `anomaly.detected` |

---

## 13. Error Handling

| Failure | Behavior |
|---|---|
| Skill normalization LLM fails | Use raw tag as canonical skill. Log. Retry on next recalculation. |
| Update weight LLM fails | Use default weight of 1.0. Log. |
| Dispute impact LLM fails | Defer dispute impact to next recalculation. Log. |
| Review weight LLM fails | Store review with weight 0.0 (excluded from scoring). Retry on next recalculation. |
| Identity resolution fails | Store review as unmatched. Retry on next recalculation with more context. |
| Anomaly detection fails | Skip anomaly check for this cycle. Log. |
| Audit trail hash chain broken | CRITICAL alert. Halt new entries until chain integrity is investigated. |
| Cosmos DB write fails | Retry with exponential backoff. If persistent, queue updates for later. |
| Layer C feedback event fails | Retry. Layer C continues with stale scores until event succeeds. |

---

## 14. Configuration

| Variable | Default | Description |
|---|---|---|
| `WEIGHT_COMPLETION_RATE` | `0.20` | Composite weight for completion rate dimension |
| `WEIGHT_QUALITY_SCORE` | `0.30` | Composite weight for quality score dimension |
| `WEIGHT_SPEED_SCORE` | `0.15` | Composite weight for speed dimension |
| `WEIGHT_COST_EFFICIENCY` | `0.15` | Composite weight for cost efficiency dimension |
| `WEIGHT_ESCALATION_RATE` | `0.10` | Composite weight for escalation rate dimension |
| `WEIGHT_RELIABILITY` | `0.10` | Composite weight for reliability dimension |
| `MIN_JOBS_ROUTING_THRESHOLD` | `5` | Minimum AWP completions for high-value routing |
| `RECALCULATION_INTERVAL_HOURS` | `24` | Hours between periodic recalculation |
| `REVIEW_SOURCES_IN_SCORING` | `awp_completion,upwork,fiverr` | External review sources included in Bayesian scoring |
| `IDENTITY_RESOLUTION_MIN_CONFIDENCE` | `0.7` | Minimum confidence to link a review to a worker |
| `AZURE_OPENAI_KEY` | (required) | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | (required) | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` | Model deployment name |
| `COSMOS_DB_ENDPOINT` | (required) | Azure Cosmos DB endpoint |
| `COSMOS_DB_KEY` | (required) | Azure Cosmos DB key |

---

## 15. File Structure

```
packages/reputation/
├── __init__.py
├── models.py                  # All Pydantic models (Section 3)
├── scoring.py                 # Bayesian scoring engine, update functions, composite calculation
├── priors.py                  # Prior initialization by source type
├── audit.py                   # Audit trail, hash chaining, chain verification
├── provenance.py              # Provenance document generation
├── agents/
│   ├── __init__.py
│   ├── skill_normalizer.py    # Skill normalization agent
│   ├── update_weight.py       # Update weight assessment agent
│   ├── dispute_impact.py      # Dispute impact assessment agent
│   ├── review_weight.py       # External review weight agent
│   ├── anomaly_detector.py    # Anomaly detection agent
│   └── identity_resolver.py   # Cross-source identity resolution agent
├── reviews.py                 # External review ingestion, identity resolution orchestration
├── feedback.py                # E → C feedback loop, reputation.updated event emission
├── recalculation.py           # Periodic recalculation job
├── trust_signals.py           # Buyer-facing and worker-facing score views
├── events.py                  # Event models + emission helpers
├── listener.py                # Kafka consumer for task evaluations, disputes, reviews
└── tests/
    ├── __init__.py
    ├── test_models.py             # Model construction, validation
    ├── test_scoring.py            # Bayesian update math (Beta + Normal), composite calculation
    ├── test_priors.py             # Prior initialization by source type
    ├── test_audit.py              # Hash chaining, chain verification, integrity checks
    ├── test_provenance.py         # Provenance document generation
    ├── test_skill_normalizer.py   # Skill normalization (mocked LLM)
    ├── test_update_weight.py      # Update weight assessment (mocked LLM)
    ├── test_dispute_impact.py     # Dispute impact (mocked LLM)
    ├── test_review_weight.py      # Review weight assessment (mocked LLM)
    ├── test_anomaly_detector.py   # Anomaly detection (mocked LLM)
    ├── test_identity_resolver.py  # Identity resolution (mocked LLM + mocked DB)
    ├── test_reviews.py            # Review ingestion flow
    ├── test_feedback.py           # E → C event emission, data mapping
    ├── test_recalculation.py      # Periodic recalculation job
    └── test_listener.py           # Event-driven triggers
```

---

## 16. Testing Strategy

All tests use pytest + pytest-asyncio. LLM calls and Cosmos DB are mocked.

### 16.1 Scoring Tests (`test_scoring.py`)

Pure algorithmic tests — no mocks needed:
- Beta update: success increases point estimate, failure decreases it
- Normal update: observation pulls posterior toward observation value
- Weight effect: higher weight moves posterior more
- Confidence bands narrow with more observations
- Confidence bands are wide with few observations (cold start)
- Composite calculation: weighted average matches expected values
- Prior initialization by source type produces expected uncertainty levels

### 16.2 Audit Tests (`test_audit.py`)

- Hash chain: sequential entries link correctly
- Chain verification: valid chain passes, tampered entry detected
- Genesis entry has `previous_hash = "genesis"`
- All action types produce valid audit entries

### 16.3 Provenance Tests (`test_provenance.py`)

- Provenance document generated for completed contract
- All tasks represented with correct worker attribution
- Artifact hashes computed correctly
- Provenance hash is deterministic

### 16.4 LLM Agent Tests (mocked)

- **Skill normalizer**: Groups similar tags, preserves distinct skills
- **Update weight**: Complex jobs get higher weight, simple jobs lower
- **Dispute impact**: Refund = strong negative, dismissed = no impact
- **Review weight**: Structured platform reviews weighted higher than anonymous
- **Anomaly detector**: Rapid score increase flagged, stable trajectory not flagged
- **Identity resolver**: Phone match = high confidence, name-only = low confidence

### 16.5 Review Ingestion Tests (`test_reviews.py`)

- Review linked to correct worker via shared signals
- Review linked via LLM when no shared signals
- Unmatched review stored with no identity link
- Review weight applied correctly to Bayesian update
- Excluded review sources not affecting scores

### 16.6 Feedback Tests (`test_feedback.py`)

- `reputation.updated` event carries all 6 dimensions + composite
- Event emitted after task evaluation
- Event emitted after dispute resolution
- Event emitted after periodic recalculation

---

## 17. Key Design Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Full Bayesian scoring (Beta/Normal) not EWMA | Natural confidence bands, honest cold-start handling, mathematically principled |
| 2 | LLM-driven update weights, dispute impact, and review weighting | Avoids over-engineering rule-based logic; captures nuance; consistent with LLM-first architecture |
| 3 | LLM-based skill normalization for free-form tags | Layer C uses free-form tags; reputation must aggregate across semantically equivalent tags without a premature taxonomy |
| 4 | No decay for v1 | Simplicity; decay adds complexity and requires careful calibration. Add when data volume makes stale scores a measurable problem. |
| 5 | Audit trail separate from Layer D event store | Layer D events are operational; Layer E audit trail is the authoritative immutable record with cryptographic integrity |
| 6 | Hash chaining, not Merkle tree | Simpler implementation, still tamper-evident. Merkle tree is a v2 optimization if proof-of-inclusion queries are needed. |
| 7 | Async feedback to Layer C | Layer C doesn't block on score updates; uses latest available score. Avoids tight coupling. |
| 8 | External reviews configurable per-source | Gradual trust expansion; start with high-quality sources, add more as confidence in source quality grows |
| 9 | LLM-based anomaly detection, not statistical process control | Consistent with architecture; captures contextual anomalies that statistical rules miss |
| 10 | Buyer reputation is data collection only for v1 | Need data before we can meaningfully score buyers; avoid premature buyer penalties |
| 11 | Workers see simplified 5-star view, no score contesting | Simplified UX for v1; contesting requires arbitration logic |
| 12 | Provenance in Cosmos DB, Apache Gremlin ready | Graph queries deferred but schema is compatible; no premature infrastructure |
| 13 | Full 6 dimensions + composite in feedback event | Layer C can update immediately without querying back to Layer E |

---

## 18. Open Questions (Resolve During Implementation)

1. **Beta distribution library**: Use `scipy.stats.beta` for PPF calculations, or implement lightweight Beta quantile approximation to avoid the scipy dependency?
2. **Anomaly detection frequency**: Run on every score update, or only during periodic recalculation? Per-update catches anomalies faster but is more expensive.
3. **Apache Gremlin timing**: When does provenance complexity justify graph queries? Track provenance query patterns to decide.
4. **Review source expansion**: Start with `awp_completion, upwork, fiverr`. When to add Google Reviews, Yelp, LinkedIn? Depends on identity resolution accuracy for those sources.
5. **Composite weight tuning**: Default weights (quality=0.30, completion=0.20, etc.) are reasonable starting points. Should be re-evaluated after 1K+ completions with buyer satisfaction data.
