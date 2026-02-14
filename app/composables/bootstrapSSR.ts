import {useHeaderMenu, useFooterBlocks, useContacts, useTranslationsLoaded} from '~/composables/useCommonData';
import {safeFetch} from '~/utils/safeFetch';

export async function bootstrapCommonSSR(nuxtApp: ReturnType<typeof useNuxtApp>, lang: string) {
    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    const tr = await safeFetch<Record<string, any>>(
        `${api}/translations/structured`,
        {query: {lang}}
    );

    if (tr.data && Object.keys(tr.data).length) {
        nuxtApp.$i18n.setLocaleMessage(lang, tr.data);
    }
    nuxtApp.runWithContext(() => {
        const loaded = useTranslationsLoaded();
        loaded.value.push(lang);
    });

    const [contacts, menu, footer] = await Promise.all([
        safeFetch(`${api}/contacts`),
        safeFetch(`${api}/header-menu`),
        safeFetch(`${api}/footer/menu/blocks`),
    ]);

    nuxtApp.runWithContext(() => {
        useContacts().value = contacts.data ?? null;
        useHeaderMenu().value = menu.data ?? null;
        useFooterBlocks().value = footer.data ?? null;
    });
}
