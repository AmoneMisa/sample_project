import {useRedis} from "~~/server/utils/redis";

export default defineEventHandler(async (event) => {
    const redis = useRedis();
    const key = "testimonials";

    const cached = await redis.get(key);
    if (cached) {
        return JSON.parse(cached);
    }

    console.info("testimonials route cached:", cached);

    const data = await $fetch("/api/testimonials");
    console.info("testimonials route data:", data);

    await redis.set(key, JSON.stringify(data), "EX", 3600);

    return data;
});
