export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    modules: ['@nuxt/ui', '@nuxtjs/i18n'],
    css: ['~/assets/css/main.css'],
    i18n: {
        defaultLocale: 'ru',
        langDir: 'locales',
        strategy: 'no_prefix',
        locales: [
            {
                code: 'en', file: 'en.json', name: 'English'
            }, {
                code: 'ru',
                file: 'ru.json',
                name: 'Русский'
            },
            {
                code: 'kk', file: 'kk.json', name: 'Қазақша'
            }
        ],
        detectBrowserLanguage: {
            useCookie: true, // Crucial: This tells i18n to use a cookie
            cookieKey: 'i18n_lang', // Default cookie name, you can change it
            alwaysRedirect: false, // Don't redirect if a cookie is already set (important for no_prefix)
            redirectOn: 'root', // Detect on the first visit to the root path
            fallbackLocale: 'ru', // Fallback if detected browser lang isn't available
        },
    },
    experimental: { appManifest: false }
})
