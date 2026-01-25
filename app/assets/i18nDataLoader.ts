import { $fetch } from "ofetch";
import { useRuntimeConfig } from "#imports";

export async function fetchHeaderMenu(nuxtApp: any, lang: string) {
    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    const data = await $fetch(`/header-menu`, {
        baseURL: api,
        query: { lang },
    });

    nuxtApp.provide("headerMenu", data);
}

export async function fetchTestimonials(nuxtApp: any, lang: string) {
    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    const data = await $fetch(`/testimonials`, {
        baseURL: api,
        query: { lang },
    });

    nuxtApp.provide("testimonials", data);
}
