import {ensureRemoteMessages} from "~/assets/i18nRemoteLoader";

export default defineNuxtPlugin(async (nuxtApp) => {
    const i18n = nuxtApp.$i18n as any;
    const current = (typeof i18n.locale === 'string' ? i18n.locale : i18n.locale?.value) || 'ru';

    // на случай если клиент стартанул без SSR сообщений
    await ensureRemoteMessages(nuxtApp, current);

    nuxtApp.hook('i18n:localeSwitched', async ({ newLocale }: any) => {
        await ensureRemoteMessages(nuxtApp, newLocale);
    });
});
