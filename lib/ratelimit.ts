import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';
import {createHash} from 'crypto';

// Rate limiting over Upstash Redis (serverless-friendly, HTTP-based). When the
// Upstash env isn't set, every check succeeds — so local dev / previews aren't
// blocked. Limits are deliberately generous; tighten in production if needed.

type LimiterName =
  | 'chat'
  | 'lead'
  | 'conversation'
  | 'calculator'
  | 'calculator_email';

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({url, token}) : null;
  if (!redis && process.env.NODE_ENV === 'production') {
    console.warn('[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set in production — rate limiting is DISABLED (fails open).');
  }
  return redis;
}

const limiters = new Map<LimiterName, Ratelimit>();
function getLimiter(name: LimiterName): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  if (!limiters.has(name)) {
    const limiter =
      name === 'chat'
        ? Ratelimit.slidingWindow(20, '60 s')
        : name === 'lead'
          ? Ratelimit.slidingWindow(5, '3600 s')
          : name === 'calculator'
            ? Ratelimit.slidingWindow(5, '3600 s') // per IP
            : name === 'calculator_email'
              ? Ratelimit.slidingWindow(3, '3600 s') // per email address
              : Ratelimit.slidingWindow(15, '60 s');
    limiters.set(name, new Ratelimit({redis: r, limiter, prefix: `rl:${name}`}));
  }
  return limiters.get(name)!;
}

export async function rateLimit(
  name: LimiterName,
  identifier: string
): Promise<{success: boolean; retryAfterSec?: number}> {
  const limiter = getLimiter(name);
  if (!limiter) return {success: true};
  try {
    const {success, reset} = await limiter.limit(identifier);
    return {
      success,
      retryAfterSec: success
        ? undefined
        : Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch {
    return {success: true}; // fail open — never block on limiter errors
  }
}

export function getRequestIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? '0.0.0.0';
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 24);
}
