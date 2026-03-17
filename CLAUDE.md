# Aquarius Work Protocol — Claude Guidelines

## Overview

Protocol definition repo for AWP — the operating system for agent-powered services.
This is a TypeScript library, not a deployed service.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run test` | Run tests (Vitest) |
| `npm run build` | Build TypeScript |
| `npm run lint` | Type-check |

## Structure

- `docs/` — Specs, ADRs, scenarios, investor narrative
- `src/schemas/` — JSON Schema definitions for protocol entities
- `src/types/` — TypeScript type definitions
- `src/state-machine/` — Contract state machine with autonomy gates
- `tests/` — Protocol validation tests

## Key Docs

- Design spec: `docs/specs/2026-03-16-awp-protocol-design.md`
- Decision records: `docs/decisions/`
- Persona scenarios: `docs/scenarios/`
