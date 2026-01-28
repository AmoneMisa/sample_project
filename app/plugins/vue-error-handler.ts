export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('vue:error', (err) => {
        console.error('Uncaught error', err);
    });
});
