import { ensureRemoteMessages } from "~/assets/i18nRemoteLoader";
import { fetchHeaderMenu, fetchTestimonials } from "~/assets/i18nDataLoader";

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as any;
    const current =
        (typeof i18n.locale === "string" ? i18n.locale : i18n.locale?.value) || "ru";

    await Promise.all([
        ensureRemoteMessages(nuxtApp, current),
        fetchHeaderMenu(nuxtApp, current),
        fetchTestimonials(nuxtApp, current),
    ]);

    nuxtApp.hook("i18n:localeSwitched", async ({ newLocale }: any) => {
        await Promise.all([
            ensureRemoteMessages(nuxtApp, newLocale),
            fetchHeaderMenu(nuxtApp, newLocale),
            fetchTestimonials(nuxtApp, newLocale),
        ]);
    });
});
