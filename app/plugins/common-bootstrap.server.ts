import {bootstrapCommonSSR} from "~/composables/bootstrapSSR";

export default defineNuxtPlugin(async (nuxtApp) => {
    const rawLocale = nuxtApp.$i18n.locale;
    const lang = typeof rawLocale === 'string' ? rawLocale : rawLocale?.value || 'ru';

    await bootstrapCommonSSR(nuxtApp, lang);
});
