import {ensureRemoteMessages} from "~/assets/i18nRemoteLoader";

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as any
    const current =
        (typeof i18n.locale === 'string' ? i18n.locale : i18n.locale?.value) || 'ru';

    // дождаться переводов ДО первого рендера
    await ensureRemoteMessages(nuxtApp, current);
})
