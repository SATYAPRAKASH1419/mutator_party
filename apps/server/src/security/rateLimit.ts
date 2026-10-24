// ─── src/security/rateLimit.ts ────────────────────────────────────────────────
// IP-based rate limiting & resource capping for join attempts and room creation.
// Rules (backend-spec s7):
// - 10 join attempts per minute per IP
// - 5 room creations per minute per IP
// - Max 3 open rooms per IP
// ─────────────────────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  windowMs?: number;
  maxJoinsPerMin?: number;
  maxCreationsPerMin?: number;
  maxOpenRoomsPerIp?: number;
}

export class IpRateLimiter {
  private joins = new Map<string, number[]>();
  private creations = new Map<string, number[]>();
  private openRooms = new Map<string, Set<string>>();

  private windowMs: number;
  private maxJoins: number;
  private maxCreations: number;
  private maxOpenRooms: number;

  constructor(options: RateLimitOptions = {}) {
    this.windowMs = options.windowMs ?? 60_000;
    this.maxJoins = options.maxJoinsPerMin ?? 10;
    this.maxCreations = options.maxCreationsPerMin ?? 5;
    this.maxOpenRooms = options.maxOpenRoomsPerIp ?? 3;
  }

  /**
   * Checks and records a join attempt for an IP.
   * Returns true if allowed, false if rate limit exceeded.
   */
  public allowJoin(ip: string, now: number = Date.now()): boolean {
    const list = this.cleanTimestamps(this.joins.get(ip) ?? [], now);
    if (list.length >= this.maxJoins) {
      return false;
    }
    list.push(now);
    this.joins.set(ip, list);
    return true;
  }

  /**
   * Checks if an IP can create a new room (considering rate and max open rooms).
   */
  public allowCreation(ip: string, now: number = Date.now()): boolean {
    // 1. Max open rooms cap per IP
    const rooms = this.openRooms.get(ip);
    if (rooms && rooms.size >= this.maxOpenRooms) {
      return false;
    }

    // 2. Creation rate per minute cap
    const list = this.cleanTimestamps(this.creations.get(ip) ?? [], now);
    if (list.length >= this.maxCreations) {
      return false;
    }
    list.push(now);
    this.creations.set(ip, list);
    return true;
  }

  /**
   * Registers a newly opened room for this IP.
   */
  public trackRoomCreated(ip: string, roomId: string) {
    const rooms = this.openRooms.get(ip) ?? new Set<string>();
    rooms.add(roomId);
    this.openRooms.set(ip, rooms);
  }

  /**
   * Unregisters a disposed room for this IP.
   */
  public trackRoomDisposed(ip: string, roomId: string) {
    const rooms = this.openRooms.get(ip);
    if (rooms) {
      rooms.delete(roomId);
      if (rooms.size === 0) {
        this.openRooms.delete(ip);
      }
    }
  }

  /**
   * Helper to extract client IP from an HTTP request or connection header.
   */
  public static extractIp(req: { headers: Record<string, any>; socket?: { remoteAddress?: string } }): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      const parts = forwarded.split(",");
      const first = parts[0]?.trim();
      if (first) return first;
    }
    return req.socket?.remoteAddress ?? "127.0.0.1";
  }

  private cleanTimestamps(timestamps: number[], now: number): number[] {
    const cutoff = now - this.windowMs;
    return timestamps.filter((t) => t > cutoff);
  }

  public clear() {
    this.joins.clear();
    this.creations.clear();
    this.openRooms.clear();
  }
}

export const globalRateLimiter = new IpRateLimiter();

