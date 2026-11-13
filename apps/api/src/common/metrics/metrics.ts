import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { NextFunction, Request, Response } from 'express';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import { Public } from '../http/public.decorator';

/**
 * Prometheus metrics (scraped by infra/observability/prometheus.yml).
 * In the stack, Nginx does NOT expose /metrics publicly — Prometheus scrapes each replica directly.
 */
export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

/** Business counter example — modules add their own (bookings_created_total, payments_succeeded_total...) */
export const authEvents = new Counter({
  name: 'auth_events_total',
  help: 'Authentication events by outcome',
  labelNames: ['event'] as const,
  registers: [metricsRegistry],
});

/** Express middleware: measures every request; route label uses the matched pattern (no ids). */
export function httpMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ? `${req.baseUrl}${String(req.route.path)}` : 'unmatched';
    if (route === '/metrics') return;
    end({ method: req.method, route, status: String(res.statusCode) });
  });
  next();
}

@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', metricsRegistry.contentType)
  scrape(): Promise<string> {
    return metricsRegistry.metrics();
  }
}
