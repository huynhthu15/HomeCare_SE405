---
name: homecare-review
description: HomeCare-specific code review checklist (anti-bypass, ownership/IDOR, state machine, transactions/outbox, migrations, module boundaries, tests). Use when reviewing a diff, branch or PR in this repo, before opening a PR, or when asked to "review my code". Complements generic review skills with the rules this project's architecture depends on.
---

# HomeCare review checklist

Review the diff (`git diff main...HEAD` unless told otherwise). For each finding give: file:line, severity (**blocker / major / minor / nit**), what breaks, and the concrete fix. Report blockers first. Do not pad with praise.

## 1. Trust boundary (blockers)

- [ ] Does any endpoint accept **price, amount, total, discount, status, role, userId/customerId/technicianId** from the client? It must be derived server-side.
- [ ] Is every read/write of user-owned data filtered by `@CurrentUser()` (ownership)? Look for `findUnique({ where: { id } })` on user data without an owner condition → IDOR.
- [ ] New routes: protected by default? Any `@Public()` justified? Privileged routes have `@Roles(...)`?
- [ ] zod schemas `.strict()`; no `any`-typed bodies; params validated (`ParseUUIDPipe`).
- [ ] Payment callbacks: signature verified **before** use, amount and txnRef compared to DB, idempotent on replay, raw event logged.
- [ ] Location updates: only from the technician assigned to an active booking.

## 2. Consistency (blockers / major)

- [ ] State changes go through the module's state table, never `update({ data: { status } })` ad hoc.
- [ ] State change + history + audit + outbox event in **one** `$transaction`.
- [ ] Concurrency: optimistic lock (`version`) or row lock (`FOR UPDATE`) where two actors can race (cancel vs accept, double IPN).
- [ ] Event handlers idempotent (at-least-once delivery).
- [ ] Money-creating POSTs require `Idempotency-Key`.

## 3. Architecture (major)

- [ ] No deep imports into another module (ESLint should catch it — check `pnpm lint` output).
- [ ] No queries on another module's tables; no `include` of another module's relations.
- [ ] Shared contracts (zod schemas, enums, error codes, socket events) live in `packages/shared`.
- [ ] Architecture change → ADR + `system-design.md` diagrams updated.

## 4. Data & migrations (major)

- [ ] Migration backward compatible with the running version (no rename/drop of a column still read by current code).
- [ ] Indexes for new query patterns (`where` + `orderBy`), uniqueness enforced by the DB, not only in code.
- [ ] Old migrations untouched.

## 5. Errors, logs, security hygiene (major / minor)

- [ ] `AppException` + `ErrorCode`; no stack traces or SQL errors returned to clients.
- [ ] No secrets, tokens or passwords in logs, responses or commits.
- [ ] No swallowed errors (`catch {}` that hides failures) except deliberate best-effort paths that log.

## 6. Tests (major)

- [ ] Unit tests for pure logic; e2e for each new endpoint **including refusals** (401/403/404-IDOR/400/409).
- [ ] Tests assert on `code`, not on Vietnamese messages.

## 7. Frontend (minor)

- [ ] Access token never persisted to localStorage/sessionStorage.
- [ ] API errors shown via `ApiError.message`; branching on `ApiError.code`.
- [ ] Client-side role checks are UX only — server enforces.

Finish with a one-line verdict: **Approve**, **Approve with nits**, or **Request changes** (list blocker ids).
