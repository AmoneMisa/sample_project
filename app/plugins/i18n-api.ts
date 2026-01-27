import { loadInitialData } from "~/composables/useInitialLoad";
import { startI18nLoading, finishI18nLoading } from "~/composables/useI18nLoading";

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as any;
    const current =
        (typeof i18n.locale === "string" ? i18n.locale : i18n.locale?.value) || "ru";

    if (import.meta.server) {
        await loadInitialData(nuxtApp, current);
    } else {
        startI18nLoading();
        await loadInitialData(nuxtApp, current);
        finishI18nLoading();
    }

    nuxtApp.hook("i18n:localeSwitched", async ({ newLocale }) => {
        if (import.meta.server) {
            await loadInitialData(nuxtApp, newLocale);
        } else {
            startI18nLoading();
            await loadInitialData(nuxtApp, newLocale);
            finishI18nLoading();
        }
    });
});
