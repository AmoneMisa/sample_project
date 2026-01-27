import { $fetch } from "ofetch";
import { useRuntimeConfig } from "#imports";
import { startI18nLoading, finishI18nLoading } from "~/composables/useI18nLoading";

// --- глобальные reactive-хранилища ---
export const useHeaderMenu = () =>
    useState("header-menu", () => null);

export const useTestimonials = () =>
    useState("testimonials", () => null);

export const useTranslationsLoaded = () =>
    useState("translations-loaded", () => new Set<string>());

/**
 * Единая загрузка данных для текущего языка:
 * - переводы (если ещё не загружены)
 * - меню
 * - отзывы
 *
 * SSR: выполняется до рендера
 * Client: выполняется при смене языка
 */
export async function loadInitialData(nuxtApp: any, lang: string) {
    if (!lang) return;

    const config = useRuntimeConfig();
    const api = import.meta.server
        ? config.apiBase
        : config.public.apiBase;

    const translationsLoaded = useTranslationsLoaded();
    const headerMenu = useHeaderMenu();
    const testimonials = useTestimonials();

    const needTranslations = import.meta.server || !translationsLoaded.value.has(lang);

    startI18nLoading();

    try {
        const [translations, menu, testi] = await Promise.all([
            needTranslations
                ? $fetch(`${api}/translations/structured`, {
                    query: { lang },
                })
                : null,

            $fetch(`${api}/header-menu`, {
                query: { lang },
            }),

            $fetch(`${api}/testimonials`, {
                query: { lang },
            }),
        ]);

        // --- Переводы ---
        if (translations) {
            const i18n = nuxtApp.$i18n;
            i18n.setLocaleMessage(lang, translations);
            translationsLoaded.value.add(lang);
        }

        // --- Меню и отзывы ---
        headerMenu.value = menu;
        testimonials.value = testi;

    } catch (err) {
        console.error("Ошибка загрузки initial data:", err);
    } finally {
        finishI18nLoading();
    }
}
