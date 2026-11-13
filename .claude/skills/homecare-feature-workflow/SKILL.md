---
name: homecare-feature-workflow
description: The HomeCare team's end-to-end workflow for building any feature — spec, design, plan, TDD implementation, review, PR. Use when starting a new feature, endpoint, screen or module in this repo, when asked "how should I build X here", or when picking up a task from docs/team.md. Routes each phase to the right installed plugin skill/agent.
---

# HomeCare feature workflow

Four people build in parallel on one modular monolith. This workflow keeps every feature consistent and reviewable. Follow the phases in order; do not skip the gates.

## Phase 1 — Understand & specify (gate: spec approved by the owner)

1. Read `CLAUDE.md`, `docs/team.md` (who owns what) and the module section in `docs/architecture/system-design.md`.
2. If the idea is fuzzy, use `superpowers:brainstorming` (or `agent-skills:interview-me`) with the human first.
3. Write `docs/specs/<feature>.md` from `docs/specs/_template.md`. `docs/specs/identity.md` is a complete example.
   Mandatory sections: API contract (with error `code`s), data changes, **anti-bypass rules**, events, tests.
4. If the feature changes architecture (new module, new infra, cross-module contract), also add `docs/adr/NNNN-<title>.md` and update the Mermaid diagrams in `system-design.md`. The `homecare-architect` agent can draft both.

## Phase 2 — Plan (gate: plan reviewed)

- Use `superpowers:writing-plans` (or `agent-skills:planning-and-task-breakdown`) to split into small tasks, each ending in a passing test.
- Order of work for a backend feature: shared zod schema in `packages/shared` → Prisma schema + migration → service + unit tests → controller + e2e tests → web/mobile screen.

## Phase 3 — Implement with TDD

- Use `superpowers:test-driven-development`: write the failing test first.
- Build the API part following the `nest-module` skill (folder layout, public `index.ts`, guards, outbox, audit).
- For DB design questions use the `database-design` plugin agents (`database-architect`, skill `postgresql-table-design`).
- For UI use `frontend-design`; reuse the visual language of `legacy/web/src/...` screens.
- Payments work: `payment-processing` plugin (patterns) + ADR-0003 (our VNPay-like protocol).
- Realtime/infra work: `observability-monitoring`, `cicd-automation` plugins.

## Phase 4 — Verify (gate: all green locally)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
```

Use `superpowers:verification-before-completion`: run the commands, read the output, never claim "done" without evidence.

## Phase 5 — Review & PR

1. Run the `homecare-reviewer` agent on your diff (project checklist: anti-bypass, ownership, state machine, migrations).
2. Optionally `pr-review-toolkit` agents: `silent-failure-hunter` (swallowed errors), `type-design-analyzer`, `pr-test-analyzer`.
3. Security-sensitive changes (auth, payments, uploads): also the `agent-skills` `security-auditor` agent.
4. Commit with Conventional Commits (`/commit` from commit-commands), open the PR with the template, request review from another member (two for shared kernel).
