import svgLoader from 'vite-svg-loader';

export default defineNuxtConfig({
    app: {
        head: {
            link: [
                {
                    rel: "preload",
                    as: "font",
                    href: "/fonts/PT Root UI_Bold.woff2",
                    type: "font/woff2",
                    crossorigin: "anonymous"
                },
                {
                    rel: "preload",
                    as: "font",
                    href: "/fonts/PT Root UI_Medium.woff2",
                    type: "font/woff2",
                    crossorigin: "anonymous"
                }
            ]
        }
    },
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},
    modules: ['@nuxt/ui', '@nuxtjs/i18n', '@nuxt/icon', '@nuxt/image'],
    css: ['~/assets/css/main.css'],
    sourcemap: {
        client: true,
        server: true
    },
    vite: {
        build: {
            sourcemap: true,
            minify: 'esbuild',
            cssMinify: 'esbuild'
        },
        plugins: [svgLoader()], optimizeDeps: {
            exclude: ["monaco-editor"],
        }
    },
    i18n: {
        defaultLocale: 'ru',
        langDir: null,
        locales: [
            { code: 'en', iso: 'en-US', name: 'English' },
            { code: 'ru', iso: 'ru-RU', name: 'Русский' },
            { code: 'kk', iso: 'kk-KZ', name: 'Қазақша' }
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
        apiBase: 'http://backend:8000', //http://backend:8000/** - prod
        public: {
            apiBase: '/api'
        }
    },
    nitro: {
        routeRules: {
            '/api/**': {proxy: 'http://backend:8000/**'} //http://backend:8000/** - prod
        }
    },
    icon: {
        localApiEndpoint: "/_nuxt_icon"
    }
});