export default defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('error', (err, { event }) => {
        console.error('[NITRO_ERROR]', err)
    })
})
