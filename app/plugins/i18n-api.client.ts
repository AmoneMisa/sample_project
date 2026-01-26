import { ensureRemoteMessages } from "~/assets/i18nRemoteLoader";
import { fetchHeaderMenu, fetchTestimonials } from "~/assets/i18nDataLoader";
import { startI18nLoading, finishI18nLoading } from "~/composables/useI18nLoading";

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as any;
    const current =
        (typeof i18n.locale === "string" ? i18n.locale : i18n.locale?.value) || "ru";

    startI18nLoading();

    await Promise.all([
        ensureRemoteMessages(nuxtApp, current),
        fetchHeaderMenu(nuxtApp, current),
        fetchTestimonials(nuxtApp, current),
    ]);

    finishI18nLoading();

    nuxtApp.hook("i18n:localeSwitched", async ({ newLocale }: any) => {
        startI18nLoading();

        await Promise.all([
            ensureRemoteMessages(nuxtApp, newLocale),
            fetchHeaderMenu(nuxtApp, newLocale),
            fetchTestimonials(nuxtApp, newLocale),
        ]);

        finishI18nLoading();
    });
});
