import {loadInitialDataSSR} from "~/composables/useInitialLoad";
import { toRaw, unref } from 'vue';

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n;
    const rawLocale = i18n.locale;
    const lang = typeof rawLocale === "string" ? rawLocale : rawLocale?.value || "ru";

    const config = useRuntimeConfig();
    const api = config.apiBase;

    if (import.meta.server) {
        const { translations, menu, testi } = await loadInitialDataSSR(api, lang);

        i18n.setLocaleMessage(lang, translations);

        nuxtApp.payload.data.headerMenu = toRaw(unref(menu));
        nuxtApp.payload.data.testimonials = toRaw(unref(testi));
    }
});
