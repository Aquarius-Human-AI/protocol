# Layer C — Capability and Routing Index: Implementation Spec

**Version:** 1.0
**Date:** 2026-03-18
**Status:** Approved for implementation
**Dependencies:** SPEC-LAYER-A.md, SPEC-LAYER-B.md, ADR-003, ADR-006, ADR-007

---

## 1. Purpose

Layer C maintains the labor graph — a continuously updated registry of every participant (human, AI agent, or hybrid unit) with structured identity records, capability profiles, and performance scores. It discovers new workers via demand-driven web search, profiles them, and routes tasks to the best available provider via a multi-stage matching pipeline.

Layer C is a **moat layer** — every worker discovered, profiled, and routed adds a node to the labor graph. Over time, the system knows which workers deliver what quality at what cost for which task types. This data cannot be replicated without running equivalent volume.

---

## 2. Scope

### In Scope (v1)

- **Identity model**: `IdentityRecord` for all participants (buyers + providers), trust levels, delegation chains (max depth 20), risk profiles, external identity provider interface (KYC, KYA)
- **Capability model**: `CapabilityCard` with free-form skills, proficiency scores, modality, constraints, cost model, availability
- **Storage**: Azure Cosmos DB NoSQL + separate vector index for capability card embeddings
- **Ingest pipeline**: Demand-driven crawler agent (WebSearchTool + lightweight scraping tools), capability card construction, async embedding generation (Qwen on Azure Foundry)
- **Computer tool interface**: Read-only access to gated platforms (Fiverr, Upwork, etc.) via virtual machine with human-like identity — read only, no write operations
- **Retrieval layer**: Hard filters (service commerce dimensions) + vector similarity search on Cosmos DB
- **Matching pipeline**: Retrieval → Cohere Rerank Fast (Azure Foundry) → LLM reasoning agent for final top-N ranking with full context
- **Per-task matching**: Triggers when a task enters READY state (dependencies resolved), returns top-N candidates (default 5)
- **Task-level state machine**: PENDING → READY → MATCHING → MATCHED → ASSIGNED (extends Layer B's task model)
- **Negotiation gate**: Only for tasks above configurable cost/risk threshold (autonomy-dependent). Low-cost/risk tasks auto-assign.
- **Contract provider model**: No lead signatory. AWP owns the contract. Each task has an independent provider. AWP ensures contract completion to the buyer.
- **External platform adapter interface**: Defined but no actual integrations
- **Events**: Listens for task state changes, emits matching events

### Deferred (see DEFERRED.md)

- Global DAG optimization (assign across all tasks simultaneously)
- Fine-tuned scoring function trained on Layer E historical data
- Platform adapter implementations (Fiverr, Upwork, TaskRabbit)
- Graph database for provenance (Layer E concern, optimize for cost)
- Capability taxonomy (free-form until high-quality taxonomy is learned)
- Learned routing weights from buyer satisfaction data

---

## 3. Data Models

All models use Pydantic v2 `BaseModel` with strict typing.

### 3.1 Identity Enums

```python
class ParticipantType(str, Enum):
    HUMAN = "human"
    AGENT = "agent"
    PLATFORM = "platform"

class TrustLevel(str, Enum):
    UNVERIFIED = "unverified"                  # Web crawl only, no interaction
    EMAIL_VERIFIED = "email_verified"          # Email confirmed
    PLATFORM_VERIFIED = "platform_verified"    # Verified account on external platform
    IDENTITY_VERIFIED = "identity_verified"    # KYC / government ID verified
    CREDENTIAL_VERIFIED = "credential_verified"  # Professional license or certification verified

class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"        # Discovered, not yet verified
    PENDING = "pending"              # Verification in progress
    VERIFIED = "verified"            # Passed verification
    CLAIMED = "claimed"              # Worker has claimed their profile
    SUSPENDED = "suspended"          # Temporarily suspended
```

### 3.2 Worker Node Enums

```python
class NodeType(str, Enum):
    HUMAN = "human"
    AI_AGENT = "ai_agent"
    HYBRID_UNIT = "hybrid_unit"      # Human + AI composite; human takes precedence
    WORKFLOW = "workflow"             # Automated pipeline, no human component

class CostModel(str, Enum):
    PER_TASK = "per_task"
    PER_HOUR = "per_hour"
    PER_TOKEN = "per_token"
    OUTCOME_SHARE = "outcome_share"

class Modality(str, Enum):
    PHONE = "phone"
    VIDEO = "video"
    TEXT = "text"
    IN_PERSON = "in_person"
    WEB_AUTOMATION = "web_automation"

class TaskMatchState(str, Enum):
    PENDING = "pending"              # Task created, dependencies not resolved
    READY = "ready"                  # Dependencies resolved, ready for matching
    MATCHING = "matching"            # Layer C is searching for candidates
    MATCHED = "matched"              # Candidates found, awaiting assignment
    ASSIGNED = "assigned"            # Provider assigned, ready for execution
    IN_PROGRESS = "in_progress"      # Execution started (Layer D)
    COMPLETE = "complete"
    FAILED = "failed"
    SKIPPED = "skipped"
```

### 3.3 DelegationLink

```python
class DelegationLink(BaseModel):
    delegator_id: str                # Identity ID of the person/entity granting authority
    delegate_id: str                 # Identity ID of the delegate
    permissions: list[str]           # What the delegate can do (e.g., "manage_availability", "approve_contracts", "route_tasks")
    max_auto_commit_usd: float | None = None  # Budget ceiling for auto-approval
    restricted_categories: list[str] = []      # Categories the delegate cannot act on
    granted_at: datetime
    expires_at: datetime | None = None
```

### 3.4 RiskProfile

```python
class RiskProfile(BaseModel):
    max_auto_commit_usd: float | None = None   # Maximum value for auto-approved actions
    restricted_categories: list[str] = []       # Categories requiring manual approval
    approval_rules: list[str] = []              # Natural language rules for edge cases
    accountability_notes: str | None = None     # For humans: can this person be held accountable?
                                                 # For agents: is this the same entity that earned the reputation?
```

### 3.5 IdentityRecord

```python
class IdentityRecord(BaseModel):
    id: str                                      # uuid4
    participant_type: ParticipantType             # human, agent, platform
    display_name: str
    trust_level: TrustLevel = TrustLevel.UNVERIFIED
    autonomy_level: AutonomyLevel | None = None  # Set by user; buyers always have this
    delegation_chain: list[DelegationLink] = []   # Full chain from original human to current actor
    risk_profile: RiskProfile = RiskProfile()
    communication_preferences: dict[str, Any] = {}  # Preferred channels, language, timezone
    contact_info: dict[str, Any] = {}             # Email, phone, social profiles
    external_identity_refs: list[dict[str, str]] = []  # References to external identity providers (KYC, KYA)
    metadata: dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def validate_delegation_depth(self) -> Self:
        max_depth = int(os.getenv("MAX_DELEGATION_DEPTH", "20"))
        if len(self.delegation_chain) > max_depth:
            raise ValueError(f"Delegation chain exceeds maximum depth of {max_depth}")
        return self
```

### 3.6 Capability

A single skill entry on a capability card.

```python
class Capability(BaseModel):
    skill: str                                   # Free-form skill tag (e.g., "residential_gutter_cleaning")
    proficiency: float = 0.0                     # 0.0-1.0, updated by Layer E
    modalities: list[Modality] = []              # How this skill is delivered
    constraints: list[str] = []                  # Free-form constraints (e.g., "ESL — simple English preferred")
    verified: bool = False                       # Has this skill been verified through AWP work?
    source: str | None = None                    # Where this capability was discovered (web_crawl, platform_import, self_reported, awp_verified)
    confidence: float = 0.0                      # Confidence in this capability claim (per ADR-006 discounting)

    @model_validator(mode="after")
    def validate_scores(self) -> Self:
        for field_name in ("proficiency", "confidence"):
            val = getattr(self, field_name)
            if not 0.0 <= val <= 1.0:
                raise ValueError(f"{field_name} must be between 0.0 and 1.0")
        return self
```

### 3.7 Availability

```python
class Availability(BaseModel):
    is_available: bool = True
    schedule: dict[str, Any] | None = None       # Calendar-based availability (human workers)
    api_endpoint: str | None = None              # Health endpoint for AI agents
    service_area: list[str] = []                 # Geographic areas served (for in-person work)
    timezone: str | None = None
    last_active_at: datetime | None = None
```

### 3.8 PerformanceScores

Three independent scores per worker, updated by Layer E feedback loop. These are aggregate scores across all skills — skill-specific scores live in Layer E's time-series data.

```python
class PerformanceScores(BaseModel):
    quality: float = 0.0                         # 0.0-1.0, rolling average of evaluation outcomes
    speed: float = 0.0                           # 0.0-1.0, actual vs. estimated duration
    cost_efficiency: float = 0.0                 # 0.0-1.0, actual vs. estimated cost
    completed_jobs: int = 0                      # Total AWP completions
    last_updated_at: datetime | None = None

    @model_validator(mode="after")
    def validate_scores(self) -> Self:
        for field_name in ("quality", "speed", "cost_efficiency"):
            val = getattr(self, field_name)
            if not 0.0 <= val <= 1.0:
                raise ValueError(f"{field_name} must be between 0.0 and 1.0")
        return self
```

### 3.9 CapabilityCard

The core worker profile — what a worker can do, how they deliver, and how well they perform.

```python
class CapabilityCard(BaseModel):
    id: str                                      # uuid4
    identity_id: str                             # Reference to IdentityRecord
    node_type: NodeType                          # human, ai_agent, hybrid_unit, workflow
    description: str                             # Free-form description of the worker's capabilities
    capabilities: list[Capability]               # Skill entries with proficiency and confidence
    cost_model: CostModel = CostModel.PER_TASK
    typical_rate: float | None = None            # Typical rate in USD (for estimation)
    availability: Availability = Availability()
    performance: PerformanceScores = PerformanceScores()
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED
    source: str | None = None                    # Discovery source (web_crawl, platform_import, manual_onboarding)
    source_url: str | None = None                # Original URL where this worker was discovered
    hybrid_refs: HybridRefs | None = None        # Only for hybrid_unit nodes
    tags: list[str] = []
    metadata: dict[str, Any] = {}
    embedding_id: str | None = None              # Reference to the vector embedding in Cosmos DB
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="after")
    def validate_capabilities_not_empty(self) -> Self:
        if not self.capabilities:
            raise ValueError("Capability card must have at least one capability")
        return self
```

### 3.10 HybridRefs

For hybrid units only — references to the component human and AI nodes.

```python
class HybridRefs(BaseModel):
    human_identity_id: str                       # The human takes precedence and responsibility
    ai_capability_card_id: str                   # The AI component
    notes: str | None = None                     # How the unit operates (e.g., "AI handles scheduling, human handles diagnosis")
```

**Hybrid unit rules:**
- The human takes precedence and responsibility for the hybrid unit
- If the human works solo outside the hybrid, they are a **separate** identity + capability card
- If the human leaves the hybrid, the hybrid becomes an AI-only unit (new capability card with `node_type=ai_agent`)
- Reputation is tracked on the hybrid unit as a whole, not on the components

### 3.11 Confidence Discounting (per ADR-006)

```python
CONFIDENCE_DISCOUNT = {
    "web_crawl": (0.3, 0.5),           # Unverified claim
    "platform_import": (0.75, 0.85),   # Verified on another platform
    "awp_partial": (0.80, 0.90),       # < 5 AWP jobs
    "awp_verified": None,               # 5+ jobs: score-driven, no discount
}

def apply_confidence_discount(source: str, raw_score: float) -> float:
    """Apply confidence discount based on source quality."""
    discount_range = CONFIDENCE_DISCOUNT.get(source)
    if discount_range is None:
        return raw_score  # Full confidence
    low, high = discount_range
    return raw_score * ((low + high) / 2)
```

---

## 4. Storage Architecture

### 4.1 Azure Cosmos DB NoSQL

Primary store for identity records and capability cards.

| Collection | Documents | Partition Key |
|---|---|---|
| `identities` | `IdentityRecord` | `id` |
| `capability_cards` | `CapabilityCard` | `identity_id` |
| `matching_results` | Per-task matching results (candidates, scores, reasoning) | `task_id` |

### 4.2 Vector Index

Separate vector index on Cosmos DB for capability card embeddings.

- **Embedding model**: Qwen (deployed on Azure Foundry)
- **What gets embedded**: Full capability card including free-form `description`, all `capabilities[].skill` entries, `modalities`, `constraints`, and `tags`. Concatenated into a single text representation.
- **Embedding generation**: Async job triggered when a capability card is created or updated. Not inline — the card is usable for hard-filter queries immediately, vector similarity becomes available after embedding completes.
- **Embedding dimensions**: Per Qwen model specification (typically 1536 or higher)

```python
def capability_card_to_embedding_text(card: CapabilityCard) -> str:
    """Convert a capability card to text for embedding."""
    parts = [
        f"Worker type: {card.node_type.value}",
        f"Description: {card.description}",
    ]
    for cap in card.capabilities:
        skill_text = f"Skill: {cap.skill} (proficiency: {cap.proficiency})"
        if cap.modalities:
            skill_text += f" via {', '.join(m.value for m in cap.modalities)}"
        if cap.constraints:
            skill_text += f" constraints: {', '.join(cap.constraints)}"
        parts.append(skill_text)
    if card.availability.service_area:
        parts.append(f"Service area: {', '.join(card.availability.service_area)}")
    if card.tags:
        parts.append(f"Tags: {', '.join(card.tags)}")
    return "\n".join(parts)
```

### 4.3 Staleness Management

Stale nodes (no activity in 90 days) are demoted in routing ranking via a recency weight, never deleted. Demotion is applied as a multiplicative factor in the retrieval scoring:

```python
STALENESS_THRESHOLD_DAYS = int(os.getenv("STALENESS_THRESHOLD_DAYS", "90"))

def recency_weight(last_active_at: datetime | None) -> float:
    """Compute recency weight for routing demotion."""
    if last_active_at is None:
        return 0.5  # Never active on AWP — moderate demotion
    days_inactive = (datetime.utcnow() - last_active_at).days
    if days_inactive <= STALENESS_THRESHOLD_DAYS:
        return 1.0
    # Exponential decay beyond threshold
    return max(0.1, math.exp(-0.01 * (days_inactive - STALENESS_THRESHOLD_DAYS)))
```

---

## 5. Ingest Pipeline (Discovery + Profiling)

### 5.1 Design

The ingest pipeline is demand-driven — it discovers workers in response to actual task demand, not speculatively. Periodically, the system reviews work submitted in the last week within a particular location/skill domain and triggers crawls for underserved capabilities.

```python
crawler_agent = Agent(
    name="worker_discovery",
    instructions=CRAWLER_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.3),
    tools=[
        WebSearchTool(),           # OpenAI Agents SDK web search
        scrape_url,                # Lightweight metadata scraping tool
        create_capability_card,    # Produces structured CapabilityCard
        enrich_contact_info,       # Extracts contact details from web pages
        check_gated_platform,      # Computer tool interface for read-only gated platform access
    ],
    output_type=DiscoveryResult,
)
```

### 5.2 Crawler System Prompt (Key Behaviors)

- **Demand-driven**: Search for workers matching the specific skill/domain/location need
- **Optimize for accuracy over coverage**: Better to produce 3 high-quality capability cards than 10 low-quality ones
- **Use WebSearchTool first**: Find relevant URLs, business listings, professional profiles
- **Use lightweight scraping for structured data**: Extract metadata, pricing signals, contact info from specific URLs
- **Use computer tool ONLY for gated platforms**: Fiverr, Upwork, LinkedIn — read-only access via virtual machine with human-like identity. **Never write, post, message, or transact on gated platforms.**
- **Fill in gaps with inference**: If a gutter cleaning service website shows "serving Austin since 2005" but doesn't list specific skills, infer capabilities from the service description
- **Apply confidence discounting**: Set capability confidence based on source quality per ADR-006

### 5.3 DiscoveryResult

```python
class DiscoveryResult(BaseModel):
    capability_cards: list[CapabilityCard]
    identity_records: list[IdentityRecord]
    discovery_summary: str                    # Human-readable summary of what was found
    search_queries_used: list[str]            # What searches were performed
    sources_consulted: list[str]              # URLs visited
    cards_created: int
    cards_updated: int                        # If a re-crawl found existing workers
```

### 5.4 Ingest Flow

1. Trigger: demand signal (new tasks with unmatched capabilities) or periodic schedule (weekly for active skill/location combos)
2. Crawler agent searches the web for workers matching the demand signal
3. For each discovered worker:
   a. Check if an existing capability card matches (by name, URL, or contact info deduplication)
   b. If new: create `IdentityRecord` (unverified) + `CapabilityCard`
   c. If existing: update capability card with new data, preserve existing AWP performance scores
4. Trigger async embedding generation for new/updated cards
5. Emit `worker.discovered` event for each new card
6. For gated platforms: use computer tool for read-only profile extraction, apply platform confidence discount

### 5.5 Gated Platform Access

```python
@function_tool
async def check_gated_platform(
    ctx: RunContextWrapper[CrawlerContext],
    platform: str,
    search_query: str,
) -> str:
    """Access a gated platform (Fiverr, Upwork, etc.) via computer tool for read-only profile extraction.

    Args:
        platform: The platform to access (e.g., "fiverr", "upwork", "linkedin")
        search_query: What to search for on the platform
    """
    # Uses computer tool interface to spin up a virtual machine
    # with human-like identity and IP for read-only browsing.
    # NEVER performs write operations (posting, messaging, transacting).
    ...
```

### 5.6 External Platform Adapter Interface

Defined for v1, implementations deferred.

```python
class PlatformAdapter(Protocol):
    """Interface for external platform integration."""

    platform_name: str

    async def search_workers(self, skill: str, location: str | None = None) -> list[dict]:
        """Search for workers on the external platform."""
        ...

    async def extract_profile(self, profile_url: str) -> CapabilityCard:
        """Extract a structured capability card from a platform profile."""
        ...

    def apply_confidence_discount(self, raw_score: float) -> float:
        """Apply platform-specific confidence discount per ADR-006."""
        ...
```

---

## 6. Retrieval Layer

### 6.1 Hard Filters

Applied before vector similarity search. These are service commerce dimensions that eliminate clearly irrelevant candidates.

| Filter | Field | Description |
|---|---|---|
| Node type | `node_type` | Match task's `task_type` to compatible node types (e.g., `human_only` → only `human` and `hybrid_unit`) |
| Availability | `availability.is_available` | Only available workers |
| Service area | `availability.service_area` | For in-person work: geographic match |
| Modality | `capabilities[].modalities` | Task requires phone? Filter to workers with phone modality |
| Cost ceiling | `typical_rate` | If task has a budget, exclude workers clearly above budget |
| Verification status | `verification_status` | Exclude `suspended` workers; optionally require `verified` or `claimed` for high-value tasks |
| Minimum completed jobs | `performance.completed_jobs` | For high-value tasks (configurable threshold), require minimum AWP completions per ADR-007 |
| Staleness | `availability.last_active_at` | Apply recency weight; optionally exclude workers stale beyond configurable threshold |

### 6.2 Vector Similarity Search

After hard filters, perform vector similarity search on the remaining candidates.

**Query embedding**: The task's `required_capabilities` + `description` concatenated and embedded using the same Qwen model.

```python
def task_to_embedding_text(task: TaskNode, contract: WorkContract) -> str:
    """Convert a task to text for embedding-based retrieval."""
    parts = [
        f"Task: {task.name}",
        f"Description: {task.description}",
        f"Required capabilities: {', '.join(task.required_capabilities)}",
        f"Domain: {contract.domain}",
    ]
    return "\n".join(parts)
```

**Similarity metric**: Cosine similarity. Return top `RETRIEVAL_TOP_K` (default: 50) candidates that pass both hard filters and similarity threshold.

```python
RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "50"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.5"))
```

---

## 7. Matching Pipeline

The matching pipeline takes retrieval results and produces a final ranked list of top-N candidates for a task. Three stages: retrieval (Section 6) → rerank → reasoning agent.

### 7.1 Architecture

```
Task enters READY state
        │
        ▼
┌─────────────────────┐
│  Stage 1: Retrieval  │  Hard filters + vector similarity
│  (Cosmos DB)         │  → ~50 candidates
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Stage 2: Rerank     │  Cohere Rerank Fast (Azure Foundry)
│                      │  → ~15 candidates
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Stage 3: Reasoning  │  LLM agent with full context
│  Agent               │  → Top-N ranked candidates (default: 5)
└──────────┬──────────┘
           │
           ▼
   MatchingResult
```

### 7.2 Stage 2: Cohere Rerank

Takes the ~50 candidates from retrieval and reranks them using Cohere Rerank Fast deployed on Azure Foundry.

```python
RERANK_TOP_K = int(os.getenv("RERANK_TOP_K", "15"))

async def rerank_candidates(
    task_text: str,
    candidates: list[CapabilityCard],
    top_k: int = RERANK_TOP_K,
) -> list[tuple[CapabilityCard, float]]:
    """Rerank candidates using Cohere Rerank Fast on Azure Foundry.

    Args:
        task_text: The task description + required capabilities as text
        candidates: Capability cards from retrieval
        top_k: Number of candidates to return

    Returns:
        List of (capability_card, rerank_score) tuples, sorted by score descending
    """
    ...
```

### 7.3 Stage 3: Reasoning Agent

An LLM agent makes the final routing decision with full context — task details, contract requirements, candidate profiles, performance scores, and availability.

```python
matching_agent = Agent(
    name="task_matcher",
    instructions=MATCHING_SYSTEM_PROMPT,
    model=make_model(),
    model_settings=ModelSettings(temperature=0.3),
    tools=[
        get_candidate_details,     # Fetch full capability card + identity for a candidate
        get_performance_history,   # Fetch recent performance data for a candidate
        check_availability,        # Real-time availability check
    ],
    output_type=MatchingResult,
)
```

### 7.4 Matching System Prompt (Key Behaviors)

- **Rank by expected outcome quality**, not just capability match. A worker with 0.85 quality score and perfect skill match is better than a worker with 0.95 quality score but tangential skills.
- **Flag uncertainty**: If no candidate has confidence > 0.7, flag the match as low-confidence. Include uncertainty flags in the result.
- **Consider the full picture**: Task budget, deadline, required modality, geographic constraints, worker availability, and performance history all factor in.
- **Explain the ranking**: Provide brief reasoning for why each candidate was ranked where they are. The buyer may see this for autonomy levels 1 & 2.
- **Respect the 5-job minimum**: Workers with < 5 AWP completions are lower-confidence candidates. Note this in the output.

### 7.5 MatchingResult

```python
class CandidateMatch(BaseModel):
    capability_card_id: str
    identity_id: str
    display_name: str
    match_score: float                           # 0.0-1.0 overall match score
    quality_score: float                         # From performance history
    speed_score: float
    cost_efficiency_score: float
    estimated_cost_usd: float | None = None      # Estimated cost for this specific task
    confidence: float                            # Confidence in this match
    uncertainty_flags: list[str] = []            # E.g., "fewer than 5 AWP jobs", "unverified skills"
    reasoning: str                               # Why this candidate was ranked here

class MatchingResult(BaseModel):
    task_id: str
    contract_id: str
    candidates: list[CandidateMatch]             # Ranked, best first
    candidates_considered: int                   # Total before reranking
    retrieval_count: int                         # After hard filters + vector search
    rerank_count: int                            # After Cohere rerank
    low_confidence: bool = False                 # True if no candidate > 0.7 confidence
    matching_summary: str                        # Human-readable summary for buyer
    timestamp: datetime
```

### 7.6 Negotiation Gate

After matching produces candidates, the assignment path depends on the task's cost/risk profile and the buyer's autonomy level.

```python
NEGOTIATION_COST_THRESHOLD_USD = float(os.getenv("NEGOTIATION_COST_THRESHOLD_USD", "100"))

def requires_negotiation(task: TaskNode, contract: WorkContract) -> bool:
    """Determine if a task requires negotiation before assignment."""
    # High cost tasks require negotiation
    if task.estimated_cost.max_usd > NEGOTIATION_COST_THRESHOLD_USD:
        return True
    # Autonomy levels 1 & 2 always see candidates
    if contract.autonomy_level in (AutonomyLevel.ADVISOR, AutonomyLevel.FACILITATOR):
        return True
    return False
```

**If negotiation required**: Task enters MATCHED state. Candidates are presented to the buyer (with matching summary and reasoning). Buyer approves assignment. Task moves to ASSIGNED.

**If no negotiation**: Top candidate is auto-assigned. Task moves directly from MATCHED to ASSIGNED. Buyer is notified (not blocked).

---

## 8. Task-Level State Machine

Layer B defines the initial task states (PENDING through COMPLETE/FAILED/SKIPPED). Layer C extends this with matching-specific states. The full task lifecycle:

```
PENDING → READY → MATCHING → MATCHED → ASSIGNED → IN_PROGRESS → EVALUATING → COMPLETE
                                                                                  ↓
                                                                               FAILED
```

### 8.1 State Transitions Owned by Layer C

| Transition | Trigger | Notes |
|---|---|---|
| READY → MATCHING | Task dependencies resolved, matching pipeline starts | Layer C listens for task READY events |
| MATCHING → MATCHED | Matching pipeline produces candidates | Candidates stored in `matching_results` collection |
| MATCHED → ASSIGNED | Buyer approves (negotiation) or auto-assigned (no negotiation) | Provider identity linked to task |
| MATCHING → FAILED | No candidates found after retry | Configurable retry with broadened criteria |

### 8.2 Contract State Interaction

The contract stays in ACTIVE state while individual tasks go through their matching/assignment cycle. The contract does not have MATCHING/PROPOSAL/NEGOTIATION states in the per-task model — those concepts are handled at the task level.

**Refinement from original spec**: The contract state machine transitions MATCHING → PROPOSAL → NEGOTIATION are **replaced** by task-level matching. The contract transitions directly from REQUIREMENTS → ACTIVE (after intake) and stays ACTIVE until all tasks complete or fail.

Updated contract state machine:

```
INTENT        → REQUIREMENTS, CANCELLED, EXPIRED
REQUIREMENTS  → ACTIVE, CANCELLED, EXPIRED
ACTIVE        → VERIFICATION, FAILED, CANCELLED
VERIFICATION  → COMPLETE, ACTIVE, DISPUTED
DISPUTED      → ACTIVE, FAILED, CANCELLED
COMPLETE      → (terminal)
CANCELLED     → (terminal)
EXPIRED       → (terminal)
FAILED        → (terminal)
```

The MATCHING, PROPOSAL, and NEGOTIATION states are removed from the contract level. The contract enters ACTIVE once the outcome schema is finalized and the execution plan is created/approved. Task-level matching handles provider assignment.

---

## 9. Identity Provider Interface

### 9.1 KYC (Know Your Customer) — Humans

```python
class KYCProvider(Protocol):
    """Interface for human identity verification."""

    provider_name: str

    async def verify_identity(self, identity_id: str, evidence: dict) -> VerificationResult:
        """Verify a human participant's identity."""
        ...

    async def check_status(self, verification_id: str) -> VerificationStatus:
        """Check the status of an ongoing verification."""
        ...

class VerificationResult(BaseModel):
    verified: bool
    trust_level: TrustLevel
    provider_ref: str                    # External reference ID
    evidence_summary: str | None = None
    expires_at: datetime | None = None
```

### 9.2 KYA (Know Your Agent) — AI Agents

```python
class KYAProvider(Protocol):
    """Interface for AI agent identity verification.

    Verifies: Is this the same agent entity that earned the reputation score?
    Checks: model version, deployment endpoint, operator identity, capability claims.
    """

    provider_name: str

    async def verify_agent(self, identity_id: str, agent_manifest: dict) -> VerificationResult:
        """Verify an AI agent's identity and capability claims."""
        ...

    async def check_version_drift(self, identity_id: str) -> VersionDriftResult:
        """Check if the agent's model has changed since last verification."""
        ...

class VersionDriftResult(BaseModel):
    drifted: bool
    previous_version: str | None = None
    current_version: str | None = None
    recommendation: str                   # "soft_reset", "full_reverify", "no_action"
```

**AI agent versioning**: When a model updates, historical performance scores are decayed by 50% (soft reset per tech spec recommendation). The agent must re-earn confidence through new completions. This is triggered by `check_version_drift` returning `drifted=True`.

---

## 10. Events

### 10.1 Inbound Events (Layer C Listens)

| Topic | Event | Action |
|---|---|---|
| `pln.execution_plans` | `execution_plan.approved` | Begin matching for READY tasks in the plan |
| `pln.tasks` | `task.ready` | Task dependencies resolved, trigger matching |
| `pln.reputation` | `reputation.updated` | Update performance scores on capability card |
| `pln.layer_f.provider_requests` | `provider.requested` | Buyer requested a specific provider for a task — boost in matching |
| `pln.layer_f.task_responses` | `task.declined` | Worker declined assignment, reroute to next candidate |
| `pln.layer_f.claims` | `profile.claimed` | Crawl-discovered worker claimed their profile — link identity + upgrade trust level |

### 10.2 Outbound Events (Layer C Emits)

```python
class WorkerDiscoveredEvent(BaseModel):
    event_type: Literal["worker.discovered"] = "worker.discovered"
    capability_card_id: str
    identity_id: str
    node_type: NodeType
    source: str                          # web_crawl, platform_import, manual_onboarding
    timestamp: datetime

class MatchingCandidatesFoundEvent(BaseModel):
    event_type: Literal["matching.candidates_found"] = "matching.candidates_found"
    task_id: str
    contract_id: str
    candidate_count: int
    top_candidate_score: float
    low_confidence: bool
    requires_negotiation: bool
    timestamp: datetime

class MatchingProviderAssignedEvent(BaseModel):
    event_type: Literal["matching.provider_assigned"] = "matching.provider_assigned"
    task_id: str
    contract_id: str
    capability_card_id: str
    identity_id: str
    assignment_method: str               # "auto_assigned" or "buyer_approved"
    match_score: float
    timestamp: datetime

class MatchingFailedEvent(BaseModel):
    event_type: Literal["matching.failed"] = "matching.failed"
    task_id: str
    contract_id: str
    reason: str
    candidates_considered: int
    timestamp: datetime

class ReviewCollectedEvent(BaseModel):
    """Emitted when the crawler discovers external reviews for a worker.
    Consumed by Layer E for identity resolution and reputation scoring."""
    event_type: Literal["review.collected"] = "review.collected"
    identity_id: str | None = None       # If already linked to an identity
    capability_card_id: str | None = None
    source: str                          # e.g., "google_reviews", "yelp", "upwork"
    source_url: str | None = None
    review_data: dict[str, Any]          # Raw review content (rating, text, date, reviewer)
    timestamp: datetime
```

### 10.3 Event Topics

| Topic | Events |
|---|---|
| `pln.workers` | `worker.discovered`, `review.collected` |
| `pln.matching` | `matching.candidates_found`, `matching.provider_assigned`, `matching.failed` |

---

## 11. Error Handling

### 11.1 Matching Failures

| Failure | Behavior |
|---|---|
| No candidates pass hard filters | Broaden filters (relax geographic constraint, lower minimum jobs, include stale workers). Retry once. If still empty, emit `matching.failed`. |
| No candidates above similarity threshold | Lower threshold by 0.1, retry. If still empty, emit `matching.failed`. |
| All candidates low-confidence (< 0.7) | Present candidates with uncertainty flags. For autonomy 3-4, assign top candidate with notification. For autonomy 1-2, require buyer approval. |
| Rerank service unavailable (Cohere) | Fallback: skip rerank, pass retrieval results directly to reasoning agent. Log degradation. |
| Reasoning agent fails | Retry once. If second attempt fails, fall back to rerank-only ranking (top-N from Stage 2). |
| Embedding service unavailable (Qwen) | Card is stored without embedding. Hard-filter-only matching available. Embedding generated when service recovers. |

### 11.2 Ingest Failures

| Failure | Behavior |
|---|---|
| Web search returns no results | Log, no action. Demand signal remains for next crawl cycle. |
| Scraping fails for a URL | Skip URL, continue with other results. Log failure. |
| Computer tool fails on gated platform | Skip platform, continue with web search results. Log failure. |
| Deduplication uncertain | Create new card with a `possible_duplicate` flag in metadata. Manual review in operator tooling. |

---

## 12. Configuration

| Variable | Default | Description |
|---|---|---|
| `MATCHING_TOP_N` | `5` | Number of candidates returned per task |
| `RETRIEVAL_TOP_K` | `50` | Candidates from retrieval stage |
| `RERANK_TOP_K` | `15` | Candidates passed to reasoning agent after rerank |
| `SIMILARITY_THRESHOLD` | `0.5` | Minimum cosine similarity for vector search |
| `NEGOTIATION_COST_THRESHOLD_USD` | `100` | Tasks above this cost require negotiation |
| `STALENESS_THRESHOLD_DAYS` | `90` | Days before a worker is considered stale |
| `MIN_JOBS_HIGH_VALUE` | `5` | Minimum AWP completions for high-value task routing (per ADR-007) |
| `MAX_DELEGATION_DEPTH` | `20` | Maximum depth of delegation chains |
| `CRAWLER_TEMPERATURE` | `0.3` | Temperature for the crawler agent |
| `MATCHER_TEMPERATURE` | `0.3` | Temperature for the matching reasoning agent |
| `AZURE_OPENAI_KEY` | (required) | Azure OpenAI API key |
| `AZURE_OPENAI_ENDPOINT` | (required) | Azure OpenAI endpoint |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` | Model deployment name |
| `COSMOS_DB_ENDPOINT` | (required) | Azure Cosmos DB endpoint |
| `COSMOS_DB_KEY` | (required) | Azure Cosmos DB key |
| `COHERE_RERANK_ENDPOINT` | (required) | Cohere Rerank Fast endpoint on Azure Foundry |
| `QWEN_EMBEDDING_ENDPOINT` | (required) | Qwen embedding model endpoint on Azure Foundry |

---

## 13. File Structure

```
packages/routing_index/
├── __init__.py
├── models.py                  # All Pydantic models (Sections 3.1-3.11)
├── identity.py                # IdentityRecord management, delegation chain validation
├── capability.py              # CapabilityCard CRUD, embedding text generation
├── crawler.py                 # Crawler agent, discovery pipeline, gated platform access
├── retrieval.py               # Hard filters + vector similarity search (Cosmos DB)
├── rerank.py                  # Cohere Rerank Fast integration (Azure Foundry)
├── matcher.py                 # Matching reasoning agent, full pipeline orchestration
├── embedding.py               # Async embedding generation (Qwen on Azure Foundry)
├── adapters.py                # PlatformAdapter interface + base classes
├── events.py                  # Event models + emission helpers
├── listener.py                # Kafka consumer for task.ready and reputation.updated events
└── tests/
    ├── __init__.py
    ├── test_models.py             # Model construction, validation, edge cases
    ├── test_identity.py           # Identity management, delegation chains, trust levels
    ├── test_capability.py         # Capability card CRUD, embedding text generation
    ├── test_crawler.py            # Crawler agent with mocked WebSearchTool
    ├── test_retrieval.py          # Hard filters, vector similarity (mocked Cosmos DB)
    ├── test_rerank.py             # Cohere rerank (mocked Azure Foundry)
    ├── test_matcher.py            # Full matching pipeline with mocked LLM
    ├── test_embedding.py          # Async embedding generation (mocked Qwen)
    └── test_listener.py           # Event-driven triggers
```

---

## 14. Testing Strategy

All tests use pytest + pytest-asyncio. LLM calls, Cosmos DB, Cohere, and Qwen are all mocked.

### 14.1 Model Tests (`test_models.py`)

- Construction of all models with valid data
- Rejection of invalid data (out-of-range scores, empty capabilities, delegation depth exceeded)
- Confidence discounting by source type
- Recency weight calculation
- HybridRefs validation
- Serialization round-trip

### 14.2 Identity Tests (`test_identity.py`)

- Identity creation for all participant types (human, agent, platform)
- Delegation chain construction and depth validation
- Trust level progression (unverified → email_verified → identity_verified)
- Risk profile validation

### 14.3 Capability Tests (`test_capability.py`)

- Capability card creation with various node types
- Embedding text generation (correct concatenation of fields)
- Hybrid unit creation with component references
- Verification status transitions

### 14.4 Crawler Tests (`test_crawler.py`)

- Mock WebSearchTool returns search results → capability cards produced
- Deduplication: existing worker found by URL → card updated, not duplicated
- Gated platform access (mocked computer tool)
- Empty search results → no cards created, demand signal logged
- Confidence discounting applied per source

### 14.5 Retrieval Tests (`test_retrieval.py`)

- Hard filters: node type, availability, service area, cost ceiling, verification status
- Vector similarity: returns candidates above threshold, ordered by score
- Combined filter + similarity
- Empty results after filtering
- Staleness demotion applied

### 14.6 Rerank Tests (`test_rerank.py`)

- Cohere rerank returns reordered candidates with scores
- Fallback when Cohere unavailable (pass-through)
- Top-K truncation

### 14.7 Matcher Tests (`test_matcher.py`)

- Full pipeline: retrieval → rerank → reasoning agent → MatchingResult
- Low-confidence flagging when all candidates < 0.7
- Negotiation gate: high-cost task requires negotiation, low-cost auto-assigns
- Autonomy level 1 & 2: always require buyer approval
- Autonomy level 3 & 4: auto-assign below threshold
- Matching failure: no candidates found → `matching.failed` event

### 14.8 Embedding Tests (`test_embedding.py`)

- Async embedding generation triggered on card creation
- Card usable for hard-filter queries before embedding completes
- Embedding updated on card update

### 14.9 Listener Tests (`test_listener.py`)

- `task.ready` event triggers matching pipeline
- `execution_plan.approved` triggers matching for all READY tasks
- `reputation.updated` updates performance scores on capability card

---

## 15. Key Design Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Separate IdentityRecord and CapabilityCard models | Identity may use external APIs; capability is always internal. Buyers have identity but no capability cards. |
| 2 | Cosmos DB NoSQL + separate vector index, not Neo4j | LLM-forward architecture; graph DB deferred for cost optimization |
| 3 | Three-stage matching: retrieval → rerank → reasoning agent | Balances cost (cheap retrieval) with quality (expensive LLM reasoning on small candidate set) |
| 4 | Demand-driven crawling, not speculative | Discovers workers in response to actual task demand; reduces waste and staleness |
| 5 | Free-form capability tags matched via LLM | No premature taxonomy; taxonomy learned from data over time |
| 6 | Per-task matching and assignment, no contract-level lead provider | Simplifies provider model; AWP owns the contract, each task has independent provider |
| 7 | Contract state machine simplified: MATCHING/PROPOSAL/NEGOTIATION removed from contract level | These concepts move to task level; contract goes REQUIREMENTS → ACTIVE directly |
| 8 | Qwen for embeddings, Cohere for rerank (Azure Foundry) | Best-in-class for each task; all deployed on Azure for operational consistency |
| 9 | Async embedding generation | Cards immediately usable for hard-filter queries; vector search available after async job completes |
| 10 | Computer tool for gated platforms, read-only only | Legal risk mitigation; human-like identity and IP for reading, never writing |
| 11 | KYA (Know Your Agent) interface defined | Forward-looking for agentic identity verification; no implementations required for v1 |
| 12 | Negotiation only for tasks above cost/risk threshold | Low-cost/risk tasks auto-assign for speed; high-value tasks get buyer oversight |
| 13 | Staleness demotion, never deletion | Historical profiles are valuable priors; a stale worker may reactivate |

---

## 16. Impact on Other Layer Specs

### 16.1 SPEC-LAYER-A.md Updates Required

The contract state machine must be updated to remove MATCHING, PROPOSAL, and NEGOTIATION states. The contract transitions directly from REQUIREMENTS → ACTIVE. The previous states:

```
# REMOVE from contract state machine:
MATCHING      → PROPOSAL, CANCELLED, EXPIRED
PROPOSAL      → NEGOTIATION, MATCHING, CANCELLED, EXPIRED
NEGOTIATION   → ACTIVE, MATCHING, CANCELLED, EXPIRED
```

Updated:
```
INTENT        → REQUIREMENTS, CANCELLED, EXPIRED
REQUIREMENTS  → ACTIVE, CANCELLED, EXPIRED
ACTIVE        → VERIFICATION, FAILED, CANCELLED
VERIFICATION  → COMPLETE, ACTIVE, DISPUTED
DISPUTED      → ACTIVE, FAILED, CANCELLED
```

The `WorkContract.participants.provider_id` field should be removed. Providers are tracked at the task level.

### 16.2 SPEC-LAYER-B.md Updates Required

The `TaskNode` model should include the `TaskMatchState` field and `assigned_provider_id`:

```python
class TaskNode(BaseModel):
    # ... existing fields ...
    match_state: TaskMatchState = TaskMatchState.PENDING
    assigned_provider_id: str | None = None      # Set by Layer C when task is ASSIGNED
    assigned_capability_card_id: str | None = None
```

---

## 17. Open Questions (Resolve During Implementation)

1. **Cosmos DB partitioning strategy**: Partition by `identity_id` works for capability cards but may need review for matching queries that span all workers in a service area.
2. **Embedding model selection**: Qwen is proposed; evaluate against Azure OpenAI embeddings and Cohere Embed for quality on capability card text.
3. **Computer tool implementation**: The virtual machine + human-like identity for gated platform access needs infrastructure design. Define boundaries clearly before implementation.
4. **KYA providers**: No production KYA services exist yet. Monitor the agentic identity space and implement when viable options emerge.
5. **Crawl frequency tuning**: "Work submitted in the last week" is the initial trigger. May need finer-grained demand signals as volume grows.
