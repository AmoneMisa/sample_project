import { useHeaderMenu, useFooterBlocks, useContacts, useTranslationsLoaded } from '~/composables/useCommonData';
import { safeFetch } from '~/utils/safeFetch';

export async function bootstrapCommonSSR(nuxtApp: ReturnType<typeof useNuxtApp>, lang: string) {
    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    const tr = await safeFetch<Record<string, any>>(
        `${api}/translations/structured`,
        { query: { lang } }
    );

    nuxtApp.$i18n.setLocaleMessage(lang, tr.data ?? {});
    useTranslationsLoaded().value.add(lang);

    const [contacts, menu, footer] = await Promise.all([
        safeFetch(`${api}/contacts`),
        safeFetch(`${api}/header-menu`),
        safeFetch(`${api}/footer/menu/blocks`),
    ]);

    useContacts().value = contacts.data ?? null;
    useHeaderMenu().value = menu.data ?? null;
    useFooterBlocks().value = footer.data ?? null;
}
