import { nanoid } from "nanoid";
import { ensureRedis, getRedis } from "@/lib/redis";
import { trackLockConflict, trackRedisError, trackAuctionActivity } from "@/lib/observability";

const LOCK_KEY_PREFIX = "auction-lock:";

export async function acquireAuctionLock(
  auctionId: string,
  ttl = 7000
): Promise<string | null> {
  const redis = await ensureRedis();
  if (!redis) {
    trackLockConflict(auctionId, "redis-unavailable");
    return null;
  }

  const lockKey = `${LOCK_KEY_PREFIX}${auctionId}`;
  const token = nanoid();
  try {
    const result = await redis.set(lockKey, token, "NX", "PX", ttl);
    if (result !== "OK") {
      trackLockConflict(auctionId, "lock-acquire-failed");
      return null;
    }

    trackAuctionActivity(auctionId, {
      type: "lock_acquired",
      ttl,
      token,
    });
    return token;
  } catch (error: any) {
    trackRedisError(error);
    return null;
  }
}

export async function releaseAuctionLock(
  auctionId: string,
  token: string
): Promise<boolean> {
  const redis = await ensureRedis();
  if (!redis) return false;

  const lockKey = `${LOCK_KEY_PREFIX}${auctionId}`;
  const releaseScript = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;

  try {
    const result = await redis.eval(releaseScript, 1, lockKey, token);
    return result === 1;
  } catch (error: any) {
    trackRedisError(error);
    return false;
  }
}

export async function isAuctionLocked(
  auctionId: string
): Promise<boolean | null> {
  const redis = await ensureRedis();
  if (!redis) return null;

  try {
    const count = await redis.exists(`${LOCK_KEY_PREFIX}${auctionId}`);
    return count === 1;
  } catch (error: any) {
    trackRedisError(error);
    return null;
  }
}
