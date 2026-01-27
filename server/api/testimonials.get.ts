import {useRedis} from "~~/server/utils/redis";

export default defineEventHandler(async (event) => {
    const redis = useRedis();
    const key = "testimonials";

    const cached = await redis.get(key);
    if (cached) {
        return JSON.parse(cached);
    }

    const data = await $fetch("/api/testimonials");

    await redis.set(key, JSON.stringify(data), "EX", 3600);

    return data;
});
