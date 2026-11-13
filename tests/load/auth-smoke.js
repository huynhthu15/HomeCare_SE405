// k6 load test for the load-balanced stack (pnpm stack:up). Run:
//   k6 run tests/load/auth-smoke.js
//   k6 run -e BASE_URL=http://localhost:8080 -e VUS=50 tests/load/auth-smoke.js
// Shows: throughput, p95 latency, and how requests spread across replicas (x-served-by).
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const servedBy = new Counter('served_by');

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300'],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ identifier: 'khang.nguyen@example.com', password: 'Homecare@123' }),
    { headers: { 'Content-Type': 'application/json', 'x-client-type': 'mobile' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return { token: res.json('accessToken') };
}

export default function (data) {
  const res = http.get(`${BASE}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${data.token}` },
  });
  check(res, { 'me 200': (r) => r.status === 200 });
  servedBy.add(1, { replica: res.headers['X-Served-By'] || 'unknown' });
}
