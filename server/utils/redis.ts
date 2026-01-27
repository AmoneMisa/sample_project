import Redis from "ioredis";

let redis: Redis;

export function useRedis() {
    if (!redis) {
        redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
    }
    return redis;
}
