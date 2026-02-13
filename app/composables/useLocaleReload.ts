import {safeFetch} from '~/utils/safeFetch';
import {startI18nLoading, finishI18nLoading} from '~/composables/useI18nLoading';

export async function reloadLocaleData(nuxtApp: ReturnType<typeof useNuxtApp>, lang: string) {
    const config = useRuntimeConfig();
    const api = config.public.apiBase;
    const loaded = useTranslationsLoaded();

    if (loaded.value.has(lang)) return;

    startI18nLoading();
    try {
        const tr = await safeFetch<Record<string, any>>(`${api}/translations/structured`, {query: {lang}});
        nuxtApp.$i18n.setLocaleMessage(lang, tr.data ?? {});
        loaded.value.add(lang);
    } finally {
        finishI18nLoading();
    }
}
