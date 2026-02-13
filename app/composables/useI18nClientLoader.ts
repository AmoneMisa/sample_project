import { startI18nLoading, finishI18nLoading } from '~/composables/useI18nLoading';
import { useTranslationsLoaded } from '~/composables/useCommonData';
import { safeFetch } from '~/utils/safeFetch';

export async function loadTranslationsClient(nuxtApp: ReturnType<typeof useNuxtApp>, lang: string) {
    const loaded = useTranslationsLoaded();
    if (loaded.value.has(lang)) return;

    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    startI18nLoading();
    try {
        const { data } = await safeFetch<Record<string, any>>(
            `${api}/translations/structured`,
            { query: { lang } }
        );
        nuxtApp.$i18n.setLocaleMessage(lang, data ?? {});
        loaded.value.add(lang);
    } finally {
        finishI18nLoading();
    }
}
