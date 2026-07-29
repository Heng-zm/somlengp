import 'server-only';

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitStoreGlobal {
  __somlengpRateLimitStore?: Map<string, RateLimitRecord>;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
  resetAt: number;
}

const rateLimitGlobal = globalThis as typeof globalThis & RateLimitStoreGlobal;
const store =
  rateLimitGlobal.__somlengpRateLimitStore ??
  (rateLimitGlobal.__somlengpRateLimitStore = new Map());

function pruneExpiredEntries(now: number): void {
  if (store.size < 1_000) {
    return;
  }

  for (const [key, record] of store) {
    if (record.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size > 5_000) {
    const overflow = store.size - 5_000;
    let removed = 0;
    for (const key of store.keys()) {
      store.delete(key);
      removed += 1;
      if (removed >= overflow) {
        break;
      }
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now()
): RateLimitResult {
  pruneExpiredEntries(now);

  const safeLimit = Math.max(1, Math.trunc(limit));
  const safeWindowMs = Math.max(1_000, Math.trunc(windowMs));
  let record = store.get(key);

  if (!record || record.resetAt <= now) {
    record = { count: 0, resetAt: now + safeWindowMs };
    store.set(key, record);
  }

  if (record.count >= safeLimit) {
    return {
      allowed: false,
      limit: safeLimit,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((record.resetAt - now) / 1_000)),
      resetAt: record.resetAt,
    };
  }

  record.count += 1;

  return {
    allowed: true,
    limit: safeLimit,
    remaining: Math.max(0, safeLimit - record.count),
    retryAfter: 0,
    resetAt: record.resetAt,
  };
}

export function getClientAddress(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown'
  );
}

export function hashRateLimitValue(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('base64url').slice(0, 24);
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1_000)));

  if (!result.allowed) {
    response.headers.set('Retry-After', String(result.retryAfter));
  }

  return response;
}

export function createRateLimitResponse(
  result: RateLimitResult,
  message = 'Too many requests. Please try again later.'
): NextResponse {
  return applyRateLimitHeaders(
    NextResponse.json(
      { success: false, error: message, retryAfter: result.retryAfter },
      { status: 429 }
    ),
    result
  );
}
