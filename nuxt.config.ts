export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/icon'],
    css: ['~/assets/css/main.css'],
    i18n: {
        defaultLocale: 'ru',
        langDir: null,
        locales: [
            {code: 'en', name: 'English'},
            {code: 'ru', name: 'Русский'},
            {code: 'kk', name: 'Қазақша'}
        ],
        strategy: 'no_prefix',
        detectBrowserLanguage: {
            useCookie: true, // Crucial: This tells i18n to use a cookie
            cookieKey: 'i18n_lang', // Default cookie name, you can change it
            alwaysRedirect: false, // Don't redirect if a cookie is already set (important for no_prefix)
            redirectOn: 'root', // Detect on the first visit to the root path
            fallbackLocale: 'ru', // Fallback if detected browser lang isn't available
        },
    },
    experimental: {appManifest: false},
    runtimeConfig: {
        public: {
            apiBase: '/api'
        }
    },
    nitro: {
        routeRules: {
            '/api/**': {proxy: 'http://localhost:8000/**'} //http://backend:8000/** - prod
        }
    }
});
