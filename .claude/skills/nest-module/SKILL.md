---
name: nest-module
description: How to add or extend a business module in the HomeCare NestJS modular monolith (apps/api/src/modules). Use when creating a module such as booking, payments, tracking, adding endpoints/services/events to one, or wiring cross-module calls. Encodes folder layout, public index.ts, guards, validation, transactions, outbox, audit and test conventions. The identity module is the reference implementation.
---

# Adding a NestJS module the HomeCare way

Reference implementation: `apps/api/src/modules/identity/` — copy its shape.

## Layout

```
apps/api/src/modules/<name>/
  index.ts                 # PUBLIC API — the only file other modules may import
  <name>.module.ts
  <name>.controller.ts     # thin: parse input, call service, return DTO
  <name>.service.ts        # business rules, transactions, ownership checks
  <name>.state.ts          # (if the module has a lifecycle) transition table, pure + unit-tested
  dto/<name>.dto.ts        # createZodDto(schemaFromShared)
  <name>.service.spec.ts   # unit tests next to the code
apps/api/prisma/schema/<name>.prisma   # owned by the module owner
apps/api/test/<name>.e2e-spec.ts       # real Postgres + Redis
packages/shared/src/<name>.ts          # zod schemas + types the clients also use
```

Then add the module to `imports` in `apps/api/src/app.module.ts` (and to `worker.module.ts` if it has event handlers or jobs).

## Rules (lint-enforced where possible)

1. **Boundaries.** Import other modules only via `'../<other>'` (their `index.ts`). `common/` and `infra/` never import modules. ESLint fails otherwise.
2. **Never query another module's tables.** Call its exported service, or react to its events.
3. **Auth by default.** Every route requires a JWT (global `JwtAuthGuard`). Use `@Public()` deliberately, `@Roles('ADMIN')` for privileged routes, and take the caller from `@CurrentUser()` — **never** a user id from body/query.
4. **Ownership in the service.** Every read/write of user-owned data filters by the caller: `where: { id, customerId: user.id }`. Return `NOT_FOUND` (not `FORBIDDEN`) for other people's resources so ids cannot be probed.
5. **Validation.** `class XDto extends createZodDto(schema)`; schemas use `.strict()`. The global `ZodValidationPipe` rejects unknown fields.
6. **Server decides money and state.** Client sends ids; prices come from catalog rows; status changes go through `<name>.state.ts`.
7. **Errors.** Throw `AppException` with an `ErrorCode` from `packages/shared/src/errors.ts` (add new codes there). Messages are Vietnamese, codes are stable.
8. **Transactions + outbox + audit.** A state change, its audit row and its domain event commit together:
   ```ts
   await this.prisma.$transaction(async (tx) => {
     const booking = await tx.booking.update({
       where: { id, version },
       data: { status: next, version: { increment: 1 } },
     });
     await tx.bookingStatusHistory.create({
       data: { bookingId: id, from, to: next, actorId: user.id, actorRole: user.role },
     });
     await this.audit.record(
       { action: 'booking.cancelled', entityType: 'booking', entityId: id, actorId: user.id },
       tx,
     );
     await this.outbox.enqueue(tx, {
       type: 'booking.status_changed',
       aggregateType: 'booking',
       aggregateId: id,
       payload: { bookingId: id, from, to: next },
     });
   });
   ```
9. **Event handlers** (`@OnEvent('payments.payment_succeeded')`) live in the consuming module, run in the worker, and must be **idempotent** (check current state first; delivery is at-least-once).
10. **Idempotency.** POST endpoints that create money-related resources require an `Idempotency-Key` header (table `idempotency_keys`).
11. **Metrics.** Add a business counter in `common/metrics/metrics.ts` style for key outcomes (`bookings_created_total`...).

## Tests you must write

- Unit: pure logic (state table, price calculation, ETA).
- E2E: happy path **and** the refusals — 401 without token, 403 wrong role, 404 for someone else's resource (IDOR), 400 for unknown fields, 409 for duplicate/conflicting state. See `apps/api/test/auth.e2e-spec.ts`.

## Migrations

`pnpm db:migrate --name <change>` creates a migration from the schema. For things Prisma can't express (exclusion constraints, partial indexes) use `pnpm --filter @homecare/api exec prisma migrate dev --create-only` and edit the SQL. Migrations must be backward compatible with the currently deployed code (expand → migrate → contract). Never edit a migration that is already on `main`.
