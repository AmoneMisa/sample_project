export const useHeaderMenu = () =>
    useState<any>('header-menu', () => null);

export const useTestimonials = () =>
    useState<any>('testimonials', () => null);

export const useTranslationsLoaded = () =>
    useState<Set<string>>('translations-loaded', () => new Set<string>());

export async function loadInitialDataSSR(api: string, lang: string) {
    const [translations, menu, testi] = await Promise.all([
        $fetch(`${api}/translations/structured`, { query: { lang } }),
        $fetch(`${api}/header-menu`),
        $fetch(`${api}/testimonials`),
        $fetch(`${api}/offer-cards`),
        $fetch(`${api}/feature-cards`),
        $fetch(`${api}/contacts`)
    ]);

    return { translations, menu, testi };
}

export async function loadInitialDataClient(nuxtApp: ReturnType<typeof useNuxtApp>,
                                            lang: string) {
    const config = useRuntimeConfig();
    const api = config.public.apiBase;

    const translationsLoaded = useTranslationsLoaded();
    const headerMenu = useHeaderMenu();
    const testimonials = useTestimonials();

    const needTranslations = !translationsLoaded.value.has(lang);

    startI18nLoading();

    try {
        const [translations, menu, testi] = await Promise.all([
            needTranslations
                ? $fetch(`${api}/translations/structured`, { query: { lang } })
                : null,
            $fetch(`${api}/header-menu`),
            $fetch(`${api}/testimonials`),
        ]);

        if (translations) {
            nuxtApp.$i18n.setLocaleMessage(lang, translations);
            translationsLoaded.value.add(lang);
        }

        headerMenu.value = menu;
        testimonials.value = testi;

    } finally {
        finishI18nLoading();
    }
}