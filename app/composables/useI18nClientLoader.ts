import {startI18nLoading, finishI18nLoading} from '~/composables/useI18nLoading';
import {useTranslationsLoaded} from '~/composables/useCommonData';
import {safeFetch} from '~/utils/safeFetch';

export async function loadTranslationsClient(nuxtApp: ReturnType<typeof useNuxtApp>, lang: string) {
    const loaded = useTranslationsLoaded();
    if (loaded.value.includes(lang)) return;

    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    startI18nLoading();
    try {
        const {data} = await safeFetch<Record<string, any>>(
            `${api}/translations/structured`,
            {query: {lang}}
        );
        if (data && Object.keys(data).length) {
            nuxtApp.$i18n.setLocaleMessage(lang, data);
            if (!loaded.value.includes(lang)) loaded.value.push(lang);
        }
    } finally {
        finishI18nLoading();
    }
}
