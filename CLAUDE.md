# Aquarius PLN — Claude Guidelines

## Overview

Protocol definition repo for PLN (Programmable Labor Network) — the scoping, decomposition, coordination, trust, and routing layer for the human + AI services economy.
This is a TypeScript library, not a deployed service.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | Run tests (Vitest) |
| `npm run build` | Build TypeScript |
| `npm run lint` | Type-check |

## Structure

- `docs/` — Specs, ADRs, scenarios, investor narrative
- `docs/specs/` — Layer implementation specs (A through F + Governance)
- `docs/pln-memo.md` — Investor memo (source of truth for narrative)
- `src/schemas/` — JSON Schema definitions for protocol entities
- `src/types/` — TypeScript type definitions
- `src/state-machine/` — Contract state machine with autonomy gates
- `tests/` — Protocol validation tests

## Key Docs

- Investor memo: `docs/pln-memo.md`
- Layer specs: `docs/specs/SPEC-LAYER-*.md`
- Decision records: `docs/decisions/`
- Persona scenarios: `docs/scenarios/`
- Deferred items: `docs/specs/DEFERRED.md`
