import { randomUUID, timingSafeEqual } from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
  onLimited?: () => void;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export class FixedWindowRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly options: {
      maxRequests: number;
      now?: () => number;
      windowMs: number;
    },
  ) {}

  check(key: string): RateLimitDecision {
    const now = this.options.now?.() ?? Date.now();
    const current = this.buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : {
            count: 0,
            resetAt: now + this.options.windowMs,
          };

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    const remaining = Math.max(0, this.options.maxRequests - bucket.count);

    return {
      allowed: bucket.count <= this.options.maxRequests,
      remaining,
      resetAt: bucket.resetAt,
      retryAfterSeconds,
    };
  }
}

export function requestIdMiddleware(): RequestHandler {
  return (req, res, next) => {
    const requestId = headerValue(req, "x-request-id") ?? randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
  };
}

export function securityHeaders(): RequestHandler {
  return (_, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  };
}

export function createRateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  const limiter = new FixedWindowRateLimiter(options);

  return (req, res, next) => {
    const decision = limiter.check(clientKey(req));
    res.setHeader("X-RateLimit-Limit", String(options.maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(decision.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(decision.resetAt / 1000)));

    if (!decision.allowed) {
      options.onLimited?.();
      res.setHeader("Retry-After", String(decision.retryAfterSeconds));
      res.status(429).json({
        error: "Rate limit exceeded",
        requestId: req.requestId,
        retryAfterSeconds: decision.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}

export function requireAdminApiKey(env = process.env): RequestHandler {
  return (req, res, next) => {
    if (isAdminAuthorized(req, env)) {
      next();
      return;
    }

    res.status(401).json({
      error: "Admin API key required",
      requestId: req.requestId,
    });
  };
}

export function isAdminAuthorized(
  req: Pick<Request, "headers">,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const configuredKey = env.ADMIN_API_KEY;
  if (!configuredKey) {
    return false;
  }

  const suppliedKey = headerValue(req, "x-admin-api-key");
  if (!suppliedKey) {
    return false;
  }

  return safeCompare(configuredKey, suppliedKey);
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    requestId: req.requestId,
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(`[${req.requestId ?? "no-request-id"}]`, error);
  res.status(500).json({
    error: "Internal server error",
    requestId: req.requestId,
  });
}

function clientKey(req: Request): string {
  return headerValue(req, "x-forwarded-for")?.split(",")[0]?.trim() || req.ip || "unknown";
}

function headerValue(req: Pick<Request, "headers">, name: string): string | undefined {
  const value = req.headers[name];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function safeCompare(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
