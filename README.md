# HomeCare — nền tảng dịch vụ chăm sóc nhà

Đồ án SE405 — nhóm 4 người. Khách hàng đặt dịch vụ vệ sinh/sửa chữa/bảo trì, thanh toán qua cổng mô phỏng VNPay và theo dõi kỹ thuật viên **theo thời gian thực**; kỹ thuật viên làm việc trên app di động; quản trị viên điều hành qua web console.

**Kiến trúc:** NestJS modular monolith · PostgreSQL + Prisma · Redis · Nginx load balancer (nhiều replica) · React + TypeScript · Expo · Docker · GitHub Actions CI/CD · Prometheus/Grafana.
Chi tiết: [docs/architecture/system-design.md](docs/architecture/system-design.md) · Quyết định kiến trúc: [docs/adr](docs/adr) · Phân công: [docs/team.md](docs/team.md) · Dùng lại giao diện cũ: [docs/frontend-migration.md](docs/frontend-migration.md)

## Cấu trúc repo — BE ở đâu, FE ở đâu

```
HomeCare_SE405/
├─ apps/
│  ├─ api/              ← BACKEND (NestJS)
│  │  ├─ src/main.ts            điểm khởi động server
│  │  ├─ src/app.module.ts      nơi ghép các module
│  │  ├─ src/modules/<module>/  code nghiệp vụ, mỗi module một thư mục (hiện có: identity)
│  │  ├─ src/common/            phần dùng chung: cấu hình, log, xử lý lỗi, health, audit, outbox
│  │  ├─ prisma/schema/         thiết kế database, mỗi module một file
│  │  └─ test/                  test e2e
│  └─ web/              ← FRONTEND (React)
│     └─ src/
│        ├─ main.tsx, App.tsx   khởi động + định tuyến trang
│        ├─ pages/              các trang
│        ├─ layouts/            khung giao diện (sidebar, header)
│        └─ lib/api-client.ts   chỗ frontend gọi backend
├─ packages/shared/     ← quy ước dữ liệu chung BE–FE (schema form, mã lỗi, enum)
├─ infra/               ← Docker: database, Redis, Nginx load balancer, Grafana
├─ tests/load/          ← script đo tải (k6)
├─ .github/             ← CI/CD chạy trên GitHub
├─ docs/                ← tài liệu thiết kế, ADR, phân công, hướng dẫn
├─ legacy/              ← giao diện + server cũ (JS), nguồn để chuyển màn hình sang app mới
└─ .claude/             ← cấu hình Claude Code cho nhóm, không phải code của app
```

**Đọc code từ đâu?** Đi theo luồng đăng nhập, đúng thứ tự một request chạy qua:

1. `apps/web/src/pages/LoginPage.tsx` — form người dùng nhập
2. `apps/web/src/lib/api-client.ts` — gửi `POST /api/v1/auth/login`
3. `apps/api/src/modules/identity/auth.controller.ts` — backend nhận request
4. `apps/api/src/modules/identity/auth.service.ts` — kiểm tra mật khẩu, tạo phiên
5. `apps/api/src/modules/identity/token.service.ts` — tạo token
6. `apps/api/prisma/schema/identity.prisma` — bảng `users`, `sessions`

Mọi module sau này (booking, payments…) đều viết theo đúng khung này.

## Yêu cầu

- Node.js ≥ 22 (khuyên dùng 24) và pnpm 10: `corepack enable` (hoặc `npm i -g pnpm@10`)
- Docker Desktop

## Chạy lần đầu

```bash
pnpm install
pnpm infra:up                     # Postgres, Redis, Mailpit, MinIO
cp .env.example apps/api/.env     # PowerShell: Copy-Item .env.example apps/api/.env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

- Web: <http://127.0.0.1:3020>
- API + Swagger: <http://localhost:4000/api/docs>
- Mailpit (email dev): <http://localhost:8025>

### Tài khoản mẫu (mật khẩu chung: `Homecare@123`)

| Vai trò       | Đăng nhập bằng                                      |
| ------------- | --------------------------------------------------- |
| Quản trị      | `admin@homecare.test`                               |
| Khách hàng    | `khang.nguyen@example.com`, `linh.tran@example.com` |
| Kỹ thuật viên | `TECH-088`, `TECH-018`, `TECH-027`, `TECH-041`      |

## Quy trình nhánh

```
feat/* fix/* ──PR──▶ dev (staging) ──release PR──▶ main (production)
```

Tách nhánh từ `dev` và mở PR vào `dev`. `main` chỉ nhận release PR từ `dev` hoặc `hotfix/*`. Chi tiết: [docs/team.md](docs/team.md#quy-trình-làm-việc), [ADR-0007](docs/adr/0007-branching-strategy.md).

## Kiểm tra chất lượng

```bash
pnpm lint
pnpm typecheck
pnpm test          # unit
pnpm test:e2e      # e2e trên Postgres/Redis thật (DB homecare_test), cần infra:up
```

## Chạy như production (load balancer + nhiều replica)

```bash
pnpm stack:up      # http://localhost:8080 — Nginx + 3 replica API + worker
pnpm obs:up        # Prometheus :9090, Grafana :3001 (dashboard "HomeCare API — overview")
docker compose -f infra/docker-compose.yml -f infra/docker-compose.stack.yml --profile stack up -d --scale api=5
k6 run tests/load/auth-smoke.js
```

Mỗi response có header `x-served-by` cho biết replica nào đã xử lý.

## Làm việc với Claude Code

Repo đã khai báo sẵn plugin trong `.claude/settings.json`. Khi mở repo và chọn tin cậy thư mục, Claude Code sẽ hỏi cài các plugin sau:

- **superpowers** — quy trình brainstorm → plan → TDD → review
- **agent-skills** — spec, API design, security, CI/CD, ADR
- **feature-dev**, **pr-review-toolkit**, **security-guidance**, **commit-commands**, **typescript-lsp**, **frontend-design** — plugin chính thức của Anthropic
- **c4-architecture**, **database-design**, **backend-api-security**, **payment-processing**, **cicd-automation**, **observability-monitoring** — từ wshobson/agents
- **document-skills** — viết báo cáo đồ án (docx, pptx, pdf)

Ngoài ra repo có skill và agent riêng của dự án trong `.claude/skills` và `.claude/agents`. Quy trình làm việc chi tiết nằm trong [CLAUDE.md](CLAUDE.md).

Plugin `typescript-lsp` cần cài thêm language server:

```bash
npm i -g typescript-language-server typescript
```

## Code cũ

Prototype JS ban đầu được giữ trong [`legacy/`](legacy). Thư mục này không còn được chạy, nhưng **giao diện trong `legacy/web/src` sẽ được dùng lại**: chuyển sang `apps/web` và nối với API mới theo [docs/frontend-migration.md](docs/frontend-migration.md). Xóa `legacy/` sau khi đã chuyển xong mọi màn hình.
