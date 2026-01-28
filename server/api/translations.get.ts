import {useRedis} from "~~/server/utils/redis";

export default defineEventHandler(async (event) => {
    const redis = useRedis();
    const lang = getQuery(event).lang as string;
    const key = `translations:${lang}`;

    const cached = await redis.get(key);
    if (cached) {
        return JSON.parse(cached);
    }
    const config = useRuntimeConfig();
    const data = await $fetch(`${config.public.apiBase}/translations`, {
        query: { lang },
    });

    await redis.set(key, JSON.stringify(data), "EX", 3600);

    return data;
});
