# ADR-007: Reputation Architecture — Bayesian Scoring with Decay

**Date:** 2026-03-17
**Status:** Accepted
**Participants:** Peeyush (founder), Claude (AI collaborator)

## Context

Layer E (Trust and Reputation) is one of the three compounding moat layers in the Programmable Labor Network. Every completed job updates a worker's reputation; those scores feed directly into Layer C routing decisions. The design of the reputation model therefore determines both the quality of routing and the defensibility of the moat.

Several approaches were considered:

### Option A: Simple Star Rating

Workers receive a 1–5 star rating per job. The platform average is the reputation score.

**Pros:** Universally understood. Minimal implementation complexity.
**Cons:** Aggregates poorly — a 4.8 from 3 jobs is not the same as a 4.8 from 3,000. Susceptible to gaming. Single dimension doesn't capture speed, cost efficiency, or escalation rate separately. No mechanism for handling stale data.

### Option B: Cumulative Average

Track raw counts (jobs completed, quality scores, etc.) and compute rolling averages.

**Pros:** More stable than star ratings at volume.
**Cons:** Still fails on cold start (no way to express uncertainty for a new worker). Old data is weighted equally to recent data — a worker who was excellent 3 years ago but has degraded is indistinguishable from one who is currently excellent. Doesn't handle skill-level granularity.

### Option C: Bayesian Updating with Exponential Decay

Maintain a prior distribution per worker per skill. Update the posterior with each new job outcome. Apply exponential decay so that older evidence loses influence over time. Express the result as a score with an explicit confidence band.

**Pros:** Handles cold start honestly (prior encodes "we don't know yet"). Recency-weighted (worker performance at 6 months ago matters less than last week). Skill-specific (a worker can be excellent at tax preparation and mediocre at payroll — these are tracked independently). Confidence band is visible to buyers.
**Cons:** More complex to implement and explain. Requires careful calibration of the decay rate and minimum job threshold.

## Decision

**Option C: Multi-dimensional Bayesian scoring with exponential decay.**

### Score Dimensions

Each worker carries a separate score per skill, not a single overall rating. Each skill score is a composite of six dimensions:

| Dimension | What it measures |
|-----------|-----------------|
| Completion rate | Fraction of accepted jobs completed without abandonment |
| Quality score | Rolling average of evaluation outcomes (LLM-as-judge + human QA) |
| Speed score | Actual duration vs. estimated duration at job acceptance |
| Cost efficiency | Actual cost vs. estimated cost |
| Escalation rate | Fraction of jobs that required human escalation beyond the buyer's autonomy setting |
| Reliability | Variance in the above — a worker who is consistently good is preferable to one who is sometimes excellent and sometimes poor |

### Bayesian Updating

The initial prior for a new worker is set from the highest-confidence source available:
- Web crawl only: uninformative prior (high uncertainty)
- Platform adapter profile: weakly informative prior (moderate uncertainty, discounted per ADR-006)
- Manual onboarding with verified credentials: moderately informative prior

Each completed PLN job updates the posterior. The update weight is proportional to job complexity and evaluation confidence — a complex tax return with a high-confidence LLM evaluation updates the score more than a simple task with a borderline evaluation.

### Exponential Decay

All evidence decays with a **30-day half-life**. A job completed 30 days ago contributes half the weight of a job completed today; a job from 90 days ago contributes one-eighth.

This means:
- A worker who was excellent last year but has been inactive scores with high uncertainty, not high confidence
- A worker who had a bad period 6 months ago but has recovered is not penalized forever
- Routing continuously reflects current capability, not historical reputation

### Minimum Job Threshold

A worker's score is not used for high-value routing until they have completed at least **5 PLN jobs**. Before that threshold, the routing algorithm treats them as a lower-confidence candidate and applies a handicap in the matching optimization. This prevents gaming by new entrants and ensures that high-stakes contracts are routed to workers with demonstrated track records.

Alex's scenario shows this in practice: her imported Upwork score of 0.78 is used for initial routing, but she isn't eligible for premium contract routing until she clears 5 PLN completions. After her first job completes (0.78 → 0.81), she is two jobs closer to the threshold where her actual PLN performance drives routing at full weight.

### Confidence Bands

Every reputation score is expressed as a point estimate with a confidence band — e.g., quality score 0.88 [0.82, 0.93]. The band narrows as more evidence accumulates and widens when evidence is stale or sparse.

The buyer-facing Layer F surface shows simplified trust indicators (verification status, completed job count, average quality, confidence level). The full confidence band is available on drill-down. For Dorothy (Delegate mode), the system makes the routing decision silently and shows only the result. For Ahmed (Facilitator mode), the matched worker's trust indicators are shown at the MATCHING → PROPOSAL gate where he approves or rejects.

### Dispute Resolution

When a buyer disputes a completed job, the outcome can be: `refund`, `redo`, `partial_credit`, or `dismissed`. The dispute outcome feeds back into the worker's reputation update — a sustained `refund` is a strong negative signal; a `dismissed` dispute (frivolous) has no effect on the worker's score and is logged against the buyer. The dispute log is part of the immutable audit trail.

### Feedback Loop to Layer C

Reputation scores are written back to the worker nodes in Layer C (Capability + Routing Index) on each update. This is the feedback loop that makes the moat compound: better reputation data → better routing decisions → better job-worker matches → higher quality outcomes → richer evaluation data → better reputation data.

The graph database (Neo4j) that underlies Layer C stores both the worker nodes and the edges representing job history, evaluation outcomes, and reputation score evolution over time. This provenance graph is the most defensible part of the data asset — it captures not just the current score but the full trajectory of how each worker's performance has evolved.

### Building Block: Hybrid Reputation Unit

This architecture implements the **Hybrid Reputation Unit** — one of PLN's seven building blocks. The key innovation is scoring a human-AI composite as a single performant entity. Freelancer platforms score humans. AI benchmarks score models. Nobody scores the combination — one operator plus one AI workflow plus their joint performance on a specific task type within a decomposed job. The Bayesian scoring system tracks these composites per-skill, per-task-type, with confidence bands that tighten over time. This is a novel concept with no production analog to build on.

The **Provenance Graph** building block is also rooted here — the cryptographically chained audit trail that records who did what, with what tools, at what quality, for every completed job.

## Rationale

The investment fund analogy from ADR-003 applies here too. A good fund manager does not evaluate a portfolio position on a single quarter's performance. They look at track record, recent trend, consistency, and how the position behaves under different conditions. Bayesian scoring with decay implements exactly this logic for worker performance.

The moat implications are significant. A competitor who launches a new labor marketplace starts with every worker at an uninformative prior. After three years of Aquarius routing data, our priors are calibrated against thousands of real job outcomes. That calibration cannot be purchased or reverse-engineered — it is earned job by job. This accumulated reputation data is part of what we call the "language of getting work done through others" — the defensible asset at the core of PLN.
