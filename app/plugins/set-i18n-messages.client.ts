import {useTranslationMessages} from "~/composables/useCommonData";

export default defineNuxtPlugin(async (nuxtApp) => {
    const rawLocale = nuxtApp.$i18n.locale;
    const lang = typeof rawLocale === 'string' ? rawLocale : rawLocale?.value || 'ru';
    const messages = useTranslationMessages();
    nuxtApp.$i18n.setLocaleMessage(lang, messages.value);
});
