export function trackSocketEvent(event: string, payload: Record<string, unknown>) {
  console.log(`[FamWish][Socket] ${event}`, payload);
}

export function trackRedisError(error: unknown) {
  console.error(`[FamWish][Redis] error`, error);
}

export function trackLockConflict(auctionId: string, reason: string) {
  console.warn(`[FamWish][Lock] auction=${auctionId} conflict=${reason}`);
}

export function trackBidLatency(auctionId: string, latencyMs: number) {
  console.log(`[FamWish][BidLatency] auction=${auctionId} latency=${latencyMs}ms`);
}

export function trackAuctionActivity(auctionId: string, payload: Record<string, unknown>) {
  console.log(`[FamWish][Auction] auction=${auctionId}`, payload);
}

export function trackAdminEvent(name: string, payload: Record<string, unknown>) {
  console.log(`[FamWish][Admin] ${name}`, payload);
}
