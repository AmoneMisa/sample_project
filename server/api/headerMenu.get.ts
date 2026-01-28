import {useRedis} from "~~/server/utils/redis";

export default defineEventHandler(async (event) => {
    const redis = useRedis();
    const key = "header-menu";

    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);

    const config = useRuntimeConfig();

    const data = await $fetch(`${config.public.apiBase}/header-menu`);

    await redis.set(key, JSON.stringify(data), "EX", 3600);

    return data;
});
