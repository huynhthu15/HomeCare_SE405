# HomeCare — guide for Claude Code (shared by the whole team)

On-demand home services platform (cleaning, repair, appliance care). SE405 capstone, 4 developers.
Customers use the web app, technicians the Expo mobile app, admins the web operations console.

## Stack & layout

pnpm monorepo (Node ≥ 22, pnpm 10 via corepack):

| Path                              | What                                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/api`                        | NestJS 11 modular monolith. Roles: `api` (HTTP/WS, behind Nginx) and `worker` (outbox relay, jobs) — same image |
| `apps/api/prisma/schema/*.prisma` | Prisma 7 schema, **one file per module** (owner in header)                                                      |
| `apps/web`                        | React 19 + Vite + Tailwind 4 + TanStack Query + react-router 7                                                  |
| `apps/technician`                 | Expo app (to be created by TV4)                                                                                 |
| `apps/payment-sandbox`            | Mock VNPay gateway (to be created by TV3, see ADR-0003)                                                         |
| `packages/shared`                 | zod schemas, enums, error codes, socket events — the contract between server and clients                        |
| `infra/`                          | docker compose (dev deps; full LB stack), Nginx, Prometheus/Grafana                                             |
| `docs/`                           | `architecture/system-design.md`, `adr/`, `specs/`, `team.md`                                                    |
| `legacy/`                         | Old JS prototype — **read-only reference** for porting screens. Never import from it.                           |

## Commands

```bash
pnpm install                 # also builds packages/shared
pnpm infra:up                # Postgres, Redis, Mailpit, MinIO (Docker)
cp .env.example apps/api/.env
pnpm db:migrate              # apply/create migrations (dev)
pnpm db:seed                 # sample data; password for every seed account: Homecare@123
pnpm dev                     # api :4000 (Swagger /api/docs) + web :3020 (proxies /api)
pnpm lint | pnpm typecheck | pnpm test | pnpm test:e2e   # e2e needs infra:up, uses DB homecare_test
pnpm stack:up                # Nginx LB :8080 + 3 API replicas + worker (production-like)
pnpm obs:up                  # + Prometheus :9090, Grafana :3001
```

## Architecture rules (do not break these)

1. **Module boundaries.** Business code lives in `apps/api/src/modules/<module>/`. Other modules import it **only via its `index.ts`**; `common/` + `infra/` (shared kernel) never import modules. ESLint enforces this. Never query another module's tables — call its service or consume its events.
2. **Server is the source of truth.** Clients send ids, never prices/amounts/status/owner ids. Prices are computed from catalog rows; status changes go through the module's state table (`<module>.state.ts`).
3. **Auth by default.** Global guards: Throttler → JwtAuthGuard → RolesGuard. Use `@Public()` only deliberately, `@Roles(...)` for privileged routes, `@CurrentUser()` for the caller. Every query on user-owned data filters by owner (IDOR).
4. **Validation.** zod schemas (`.strict()`) in `packages/shared`, used via `createZodDto`. Errors: throw `AppException` with an `ErrorCode`; clients branch on `code`.
5. **Consistency.** State change + history + `AuditService.record(..., tx)` + `OutboxService.enqueue(tx, ...)` in one `prisma.$transaction`. Event handlers are idempotent (at-least-once). Money-creating POSTs need `Idempotency-Key`.
6. **Stateless replicas.** No in-memory state that must be shared (sessions, rate limits, socket rooms): use Postgres/Redis. Socket.IO uses the Redis adapter, clients `transports: ['websocket']`.
7. **Migrations** are backward compatible (expand → migrate → contract); never edit a merged migration.
8. **Secrets** never in code, logs or commits. `.env` is git-ignored; production refuses dev secrets.

Reference implementation for all of the above: `apps/api/src/modules/identity` + `apps/api/test/auth.e2e-spec.ts`.

## Conventions

- Code, identifiers, commits: English. UI text, user-facing error messages, docs: Vietnamese.
- Branches `feat/<module>-<topic>`; Conventional Commits; PR template checklist must be satisfied.
- Money = `Int` VND. Ids = UUID v7. Times = `timestamptz`.
- Web: access token in memory only (`apps/web/src/lib/api-client.ts`); never localStorage.

## Team ownership (details: docs/team.md)

TV1 identity/profile/admin · TV2 catalog/booking/dispatch · TV3 payments/sandbox · TV4 technician app/tracking/notifications. Shared kernel changes need two reviewers.

## How to work here (installed plugins + project skills)

| Phase                | Use                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Clarify idea         | `superpowers:brainstorming`, `agent-skills:interview-me`                                                      |
| Spec / design        | project skill `homecare-feature-workflow`, agent `homecare-architect`, `c4-architecture`, `database-design`   |
| Plan                 | `superpowers:writing-plans`, `agent-skills:planning-and-task-breakdown`                                       |
| Build                | project skill `nest-module`, `superpowers:test-driven-development`, `frontend-design`, `payment-processing`   |
| Debug                | `superpowers:systematic-debugging`                                                                            |
| Verify               | `superpowers:verification-before-completion` — show command output before claiming done                       |
| Review               | agent `homecare-reviewer` (+ skill `homecare-review`), `pr-review-toolkit`, `agent-skills` `security-auditor` |
| Ship                 | `commit-commands` (`/commit`), `cicd-automation`, `observability-monitoring`                                  |
| Thesis report/slides | `document-skills` (docx, pptx, pdf)                                                                           |

When a phase has a project skill and a plugin skill, the **project skill wins** (it encodes our rules).
