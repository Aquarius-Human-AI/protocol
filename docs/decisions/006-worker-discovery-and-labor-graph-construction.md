# ADR-006: Worker Discovery and Labor Graph Construction

**Date:** 2026-03-17
**Status:** Accepted
**Participants:** Andrew (founder), Claude (AI collaborator)

## Context

For the Programmable Labor Network to route work to the optimal blend of labor, it needs a comprehensive and continuously updated index of available workers — human and AI, inside and outside Aquarius. This raises a foundational question: how does a new worker enter the labor graph?

Three approaches were considered:

### Option A: Manual Onboarding Only

Workers create an account, fill out a profile, and declare their capabilities. The index contains only workers who have actively opted in.

**Pros:** Clean consent model. Every worker has explicitly joined. No data quality issues from inferred profiles.
**Cons:** Cold start problem is severe — the index starts empty. Growth depends entirely on supply-side marketing. Misses the large universe of capable workers who don't know Aquarius exists.

### Option B: Platform Adapter Integration

Aquarius integrates with existing platforms (Upwork, Fiverr, LinkedIn, etc.) via their APIs. Workers on those platforms are imported as Capability Cards with confidence scores discounted to reflect the platform context difference.

**Pros:** Immediate access to a large existing supply. Established reputation signals. Workers can be onboarded passively.
**Cons:** API access is fragile — platform terms of service change, APIs get deprecated. Import creates platform dependency. Doesn't solve for workers who aren't on any indexed platform (Harold, Rosa).

### Option C: Web Search Crawl as Primary Discovery

A crawler pipeline continuously discovers workers by searching the web — professional websites, LinkedIn profiles, business directories, community boards, local service listings. Discovered workers are profiled, capability cards are generated, and confidence scores are set based on evidence quality. Workers are demoted (not removed) when data goes stale.

**Pros:** Discovers workers who have never heard of Aquarius. Covers the full spectrum from freelance professionals to community service providers. Builds a proprietary dataset that isn't contingent on third-party API access. Compounds over time.
**Cons:** Consent model is more complex — workers are profiled before they opt in. Data quality varies. Requires active maintenance of the crawler pipeline.

## Decision

**Option C (web crawl) as primary discovery, with Option B (platform adapters) as a confidence signal, and Option A (manual onboarding) as the path to full participation.**

The three mechanisms operate as layers of the same system:

1. **Web crawl discovers** — any capable worker with a web presence can appear in the index. Confidence is low until verified.
2. **Platform adapters enrich** — an Upwork profile or LinkedIn endorsement raises confidence on specific skills. Scores are discounted to reflect platform context difference (Alex's Upwork score of 0.98 becomes 0.78 on AWP — same underlying capability, but no AWP track record yet).
3. **AWP completions verify** — every completed job on AWP is the highest-confidence signal. A worker who completes 5 jobs moves from candidate to verified; their score now drives high-value routing.

### Confidence Discounting for Imported Profiles

When a worker profile is constructed from external sources, the confidence score is discounted relative to the source quality:

| Source | Confidence Discount | Rationale |
|--------|--------------------|-----------|
| Web crawl only | 0.3–0.5 | Unverified claim; no track record |
| Platform adapter (e.g. Upwork) | 0.75–0.85 | Verified on another platform, but context differs |
| AWP completions (< 5 jobs) | 0.80–0.90 | Direct signal but insufficient sample |
| AWP completions (5+ jobs) | Score-driven | Full Bayesian reputation in effect (see ADR-007) |

Alex's scenario illustrates the transition: her imported Upwork score starts at 0.78 on AWP. After her first AWP contract completes successfully, it ticks to 0.81. The system is honest about the uncertainty; the score improves as evidence accumulates.

### Stale Node Management

Workers discovered by crawl who have never interacted with AWP are marked as `unverified`. Stale nodes are demoted in routing priority but never deleted — a worker who was active 18 months ago may become active again, and their historical profile is a valuable prior. Demotion is implemented as a recency weight in the routing algorithm, not a hard exclusion.

### Privacy and Consent

Discovered workers are not contacted, messaged, or billed without their consent. The crawl populates the index with what is publicly available. Workers are contacted only when:
- A buyer's matching query returns them as a candidate
- Aquarius extends an invitation to claim their profile and formally join

Claiming a profile unlocks direct messaging, payout configuration, and the ability to manage availability. Unclaimed profiles can still be matched and contacted via disclosed outreach — the buyer sees the confidence score and knows the worker has not yet joined AWP.

### Labor Graph as Moat

This is why worker discovery is an architectural decision and not just an operational one. The labor graph — built through crawl, enriched by platform adapters, verified by AWP completions — is the compounding data moat described in ADR-004. A new entrant cannot replicate three years of routing data, reputation scores, and capability refinement by standing up a web crawler. The crawler is the starting mechanism; the accumulation is the asset.

## Rationale

Harold illustrates why web crawl matters. He is a master mechanic with 47 years of experience, providing rare diagnostic services for rural Wisconsin residents. He has no Upwork profile. He has never applied to a marketplace. He has a basic website his grandson set up. Without web crawl, he is invisible to the network. With it, he can be discovered, invited to claim his profile, and start accumulating reputation — even if he never touches the interface himself (Jake handles it).

Rosa illustrates why confidence discounting matters. Her benefits navigation work happens through community organizations, word of mouth, and informal channels. There is no platform to import from. Her AWP profile starts from scratch, with $0 contracts counting as fully valid reputation-building completions. The moat compounds from the first job.
