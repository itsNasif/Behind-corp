import { Redis } from "@upstash/redis";
import IORedis from "ioredis";
import { Ratelimit } from "@upstash/ratelimit";
import { getEnv, required } from "./env";
import { HttpError } from "./security";
let local: IORedis;
let remote: Redis;
function clients() {
  if (getEnv().APP_ENV === "local") {
    local ??= new IORedis(required("REDIS_URL"), {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
    });
    return { local };
  }
  remote ??= new Redis({
    url: required("UPSTASH_REDIS_REST_URL"),
    token: required("UPSTASH_REDIS_REST_TOKEN"),
    automaticDeserialization: false,
    signal: () => AbortSignal.timeout(8000),
    retry: { retries: 1 },
  });
  return { remote };
}
export async function get<T>(key: string): Promise<T | null> {
  const c = clients();
  const v = c.local ? await c.local.get(key) : await c.remote!.get<string>(key);
  return v ? JSON.parse(v) : null;
}
export async function set(
  key: string,
  value: unknown,
  seconds: number,
  nx = false,
) {
  const c = clients();
  const v = JSON.stringify(value);
  return c.local
    ? nx
      ? c.local.set(key, v, "EX", seconds, "NX")
      : c.local.set(key, v, "EX", seconds)
    : nx
      ? c.remote!.set(key, v, { ex: seconds, nx: true })
      : c.remote!.set(key, v, { ex: seconds });
}
export async function del(key: string) {
  const c = clients();
  return c.local ? c.local.del(key) : c.remote!.del(key);
}
export async function take<T>(key: string): Promise<T | null> {
  const c = clients();
  const v = c.local
    ? await c.local.getdel(key)
    : await c.remote!.getdel<string>(key);
  return v ? JSON.parse(v) : null;
}
export async function release(key: string, owner: string) {
  const c = clients();
  const script =
    "if redis.call('get',KEYS[1]) == ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
  return c.local
    ? c.local.eval(script, 1, key, JSON.stringify(owner))
    : c.remote!.eval(script, [key], [JSON.stringify(owner)]);
}
export async function rateLimit(key: string, limit = 5, window = 600) {
  const c = clients();
  if (c.local) {
    const script =
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
    const n = (await c.local.eval(script, 1, `limit:${key}`, window)) as number;
    if (n > limit)
      throw new HttpError(429, "Too many requests. Please try again later.");
    return;
  }
  const limiter = new Ratelimit({
    redis: c.remote!,
    limiter: Ratelimit.fixedWindow(limit, `${window} s`),
    analytics: false,
    ephemeralCache: false,
    timeout: 0,
    prefix: "behind:limit",
  });
  const r = await limiter.limit(key);
  if (!r.success || r.reason === "timeout")
    throw new HttpError(429, "Too many requests. Please try again later.");
}

export async function closeRedis() {
  if (local) await local.quit();
}
