import Redis from "ioredis";

export type RedisStatus =
  | "connecting"
  | "ready"
  | "reconnecting"
  | "end"
  | "memory-fallback";

declare global {
  // eslint-disable-next-line no-var
  var __famwishRedis: Redis | undefined;

  // eslint-disable-next-line no-var
  var __famwishRedisStatus: RedisStatus | undefined;

  // eslint-disable-next-line no-var
  var __famwishRedisFallbackStore:
    | Map<string, string>
    | undefined;
}

const REDIS_URL =
  process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis =
  global.__famwishRedis ??
  new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    reconnectOnError: () => false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__famwishRedis = redis;
}

redis.on("connect", () => {
  global.__famwishRedisStatus = "connecting";
});

redis.on("ready", () => {
  global.__famwishRedisStatus = "ready";
});

redis.on("reconnecting", () => {
  global.__famwishRedisStatus = "reconnecting";
});

redis.on("end", () => {
  global.__famwishRedisStatus = "end";
});

redis.on("error", () => {
  global.__famwishRedisStatus = "memory-fallback";

  if (!global.__famwishRedisFallbackStore) {
    global.__famwishRedisFallbackStore =
      new Map<string, string>();
  }
});

export async function ensureRedis() {
  if (redis.status !== "ready") {
    await redis.connect();
  }

  return redis;
}

export function getRedisStatus(): RedisStatus {
  return (
    global.__famwishRedisStatus ??
    "connecting"
  );
}

export default redis;
