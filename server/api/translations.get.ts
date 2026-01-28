import {useRedis} from "~~/server/utils/redis";

export default defineEventHandler(async (event) => {
    const redis = useRedis();
    const lang = getQuery(event).lang as string;
    const key = `translations:${lang}`;

    const cached = await redis.get(key);
    if (cached) {
        return JSON.parse(cached);
    }
    console.info("translations route cached:", cached);
    const data = await $fetch("/api/translations", {
        query: { lang },
    });
    console.info("translations route data:", data);
    await redis.set(key, JSON.stringify(data), "EX", 3600);

    return data;
});
