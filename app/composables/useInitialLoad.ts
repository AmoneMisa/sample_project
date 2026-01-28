export async function loadInitialDataSSR(api: string, lang: string) {
    const [translations, menu, testi] = await Promise.all([
        $fetch(`${api}/translations/structured`, { query: { lang } }),
        $fetch(`${api}/header-menu`, { query: { lang } }),
        $fetch(`${api}/testimonials`, { query: { lang } }),
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
            $fetch(`${api}/header-menu`, { query: { lang } }),
            $fetch(`${api}/testimonials`, { query: { lang } }),
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