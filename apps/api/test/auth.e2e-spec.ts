import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { AuthResponse } from '@homecare/shared';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { PasswordService } from '../src/modules/identity/password.service';

const API = '/api/v1';
const PASSWORD = 'Secret123';
const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('Identity (e2e)', () => {
  let app: NestExpressApplication;
  let http: Server;
  let prisma: PrismaService;
  let adminToken: string;

  const registerMobile = async (email = `user-${unique()}@example.com`) => {
    const res = await request(http)
      .post(`${API}/auth/register`)
      .set('x-client-type', 'mobile')
      .send({ fullName: 'Người Dùng Test', email, password: PASSWORD })
      .expect(201);
    return res.body as AuthResponse;
  };

  const loginMobile = async (identifier: string, password = PASSWORD) =>
    request(http)
      .post(`${API}/auth/login`)
      .set('x-client-type', 'mobile')
      .send({ identifier, password });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app);
    await app.init();
    http = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    const adminEmail = `admin-${unique()}@homecare.test`;
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: 'Admin Test',
        role: 'ADMIN',
        passwordHash: await app.get(PasswordService).hash(PASSWORD),
      },
    });
    adminToken = ((await loginMobile(adminEmail)).body as AuthResponse).accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes liveness and readiness probes for the load balancer', async () => {
    await request(http).get('/health/live').expect(200);
    const ready = await request(http).get('/health/ready').expect(200);
    expect(ready.body.info).toMatchObject({ database: { status: 'up' }, redis: { status: 'up' } });
  });

  it('rejects anonymous access with the shared error shape', async () => {
    const res = await request(http).get(`${API}/auth/me`).expect(401);
    expect(res.body).toMatchObject({ statusCode: 401, code: 'UNAUTHENTICATED' });
    expect(res.body.requestId).toEqual(expect.any(String));
    await request(http).get(`${API}/auth/me`).set('Authorization', 'Bearer not-a-jwt').expect(401);
  });

  it('registers a customer and returns a working access token', async () => {
    const body = await registerMobile();
    expect(body.user.role).toBe('CUSTOMER');
    expect(body.refreshToken).toEqual(expect.any(String));
    const me = await request(http)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(me.body.id).toBe(body.user.id);
  });

  it('gives web clients the refresh token only as an httpOnly SameSite=Strict cookie', async () => {
    const res = await request(http)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Web User', email: `web-${unique()}@example.com`, password: PASSWORD })
      .expect(201);
    expect(res.body.refreshToken).toBeUndefined();
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toMatch(/hc_rt=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);

    const rt = /hc_rt=([^;]+)/.exec(cookie)![1];
    const refreshed = await request(http)
      .post(`${API}/auth/refresh`)
      .set('Cookie', `hc_rt=${rt}`)
      .expect(200);
    expect(refreshed.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects a duplicate email', async () => {
    const email = `dup-${unique()}@example.com`;
    await registerMobile(email);
    const res = await request(http)
      .post(`${API}/auth/register`)
      .send({ fullName: 'Dup', email, password: PASSWORD })
      .expect(409);
    expect(res.body.code).toBe('AUTH_EMAIL_TAKEN');
  });

  it('rejects unknown fields (no mass assignment, e.g. self-promoting to ADMIN)', async () => {
    const res = await request(http)
      .post(`${API}/auth/register`)
      .send({
        fullName: 'Hacker',
        email: `h-${unique()}@example.com`,
        password: PASSWORD,
        role: 'ADMIN',
      })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.details).toEqual(expect.any(Array));
  });

  it('locks out an identifier after 5 wrong passwords, even for the right one', async () => {
    const { user } = await registerMobile();
    for (let i = 0; i < 5; i += 1) {
      const res = await loginMobile(user.email!, 'WrongPass1');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_INVALID_CREDENTIALS');
    }
    const locked = await loginMobile(user.email!);
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe('RATE_LIMITED');
  });

  it('rotates refresh tokens and kills the session when an old token is replayed', async () => {
    const first = await registerMobile();
    const rotate = (refreshToken: string) =>
      request(http)
        .post(`${API}/auth/refresh`)
        .set('x-client-type', 'mobile')
        .send({ refreshToken });

    const second = await rotate(first.refreshToken!).expect(200);
    const rt2 = (second.body as AuthResponse).refreshToken!;
    expect(rt2).not.toEqual(first.refreshToken);

    const replay = await rotate(first.refreshToken!).expect(401);
    expect(replay.body.code).toBe('AUTH_REFRESH_REUSED');

    // The thief's replay revoked everything: the legitimate newer token and access token die too
    const afterTheft = await rotate(rt2).expect(401);
    expect(afterTheft.body.code).toBe('AUTH_REFRESH_INVALID');
    await request(http)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${(second.body as AuthResponse).accessToken}`)
      .expect(401);
  });

  it('logout revokes the access token immediately (on every replica, via Redis)', async () => {
    const { accessToken } = await registerMobile();
    await request(http)
      .post(`${API}/auth/logout`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);
    await request(http)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('keeps customers out of admin routes', async () => {
    const { accessToken } = await registerMobile();
    const res = await request(http)
      .get(`${API}/admin/users`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
    expect(res.body.code).toBe('FORBIDDEN');

    const list = await request(http)
      .get(`${API}/admin/users?role=CUSTOMER&pageSize=5`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(list.body.items.length).toBeGreaterThan(0);
    expect(list.body.items[0]).not.toHaveProperty('passwordHash');
  });

  it('locking an account ends its sessions and blocks new logins', async () => {
    const victim = await registerMobile();
    await request(http)
      .patch(`${API}/admin/users/${victim.user.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'LOCKED', reason: 'Nghi ngờ gian lận' })
      .expect(200);

    await request(http)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${victim.accessToken}`)
      .expect(401);
    const login = await loginMobile(victim.user.email!);
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('AUTH_ACCOUNT_LOCKED');
  });

  it('writes a domain event to the outbox in the same transaction as the registration', async () => {
    const { user } = await registerMobile();
    const event = await prisma.outboxEvent.findFirst({
      where: { aggregateId: user.id, type: 'identity.user_registered' },
    });
    expect(event).not.toBeNull();
    const audit = await prisma.auditLog.findFirst({
      where: { entityId: user.id, action: 'auth.registered' },
    });
    expect(audit).not.toBeNull();
  });
});
