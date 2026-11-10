# HomeCare Super App

HomeCare is a single React application for customer services and technician workflows. All frontend modules are bundled and served by one Vite app; the Node.js backend remains a separate API service.

## Features

- Customer and technician sign-in from one portal.
- Customer dashboard with cleaning, repair, appliance, booking, tracking, payment, and profile features.
- Technician workspace for jobs, status updates, location, and reports.
- User-scoped data stored by the backend in `backend/data/db.json`.

## Structure

```text
homecare-superapp/
├─ src/
│  ├─ portal/       # Shared sign-in and role selection
│  ├─ customer/     # Customer dashboard and navigation
│  └─ features/     # Auth and business feature modules
├─ public/          # Static assets
└─ backend/         # API server and JSON data store
```

## Requirements

- Node.js 20+
- npm

## Install

Install the frontend and backend dependencies once:

```bash
npm install
cd backend
npm install
```

## Run

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the single frontend app in another terminal from the repository root:

```bash
npm run dev
```

Open <http://127.0.0.1:3020>. The API defaults to `http://localhost:4000`; override it with `VITE_API_URL` when needed.

## Sample Accounts

| Role | Account | Password |
| --- | --- | --- |
| Customer | `khang.nguyen@example.com` | `123456` |
| Customer | `linh.tran@example.com` | `123456` |
| Sample admin | `admin@homecare.test` | `123456` |
| Technician | `TECH-088` | `123456` |

## Build and Check

Build the complete frontend:

```bash
npm run build
```

Check the backend server syntax:

```bash
cd backend
node --check src/server.js
```

## Backend API

The backend runs independently on port `4000` and stores data in `backend/data/db.json`. It provides authentication, technician workspace, dashboard, services, devices, reminders, bookings, payments, and profile APIs. Service and application options are served by `/booking-options`, `/repair-options`, `/profile-options`, `/payment-gateways`, and `/technicians`; backend defaults are maintained in `backend/src/store.js` and migrated into existing databases when missing.
