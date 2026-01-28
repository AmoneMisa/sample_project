export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('vue:error', (err) => {
        console.error('Uncaught error', err);
    });
    nuxtApp.hook('app:error', (...args) => {
        console.error('[APP ERROR]', ...args)
    });
});
