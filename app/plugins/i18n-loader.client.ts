import {ensureRemoteMessages} from "~/assets/i18nRemoteLoader";

export default defineNuxtPlugin(async (nuxtApp) => {
    nuxtApp.hook('i18n:localeSwitched', async ({ newLocale }: any) => {
        await ensureRemoteMessages(nuxtApp, newLocale)
    })
})
