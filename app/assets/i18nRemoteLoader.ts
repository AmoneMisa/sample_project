import { useRuntimeConfig } from "#imports"; // Nuxt 3/4 auto-import
import { $fetch } from "ofetch"; // глобальный fetch

const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();

function getI18n(nuxtApp: any) {
    const i18n = nuxtApp.$i18n as any;
    if (!i18n) throw new Error("nuxtApp.$i18n is not available. Is @nuxtjs/i18n installed?");
    return i18n;
}

function setMessages(i18n: any, lang: string, messages: any) {
    if (typeof i18n.setLocaleMessage === "function") {
        i18n.setLocaleMessage(lang, messages);
        return;
    }
    if (i18n.global?.setLocaleMessage) {
        i18n.global.setLocaleMessage(lang, messages);
        return;
    }
    throw new Error("Cannot find setLocaleMessage on i18n instance");
}

function hasMessages(i18n: any, lang: string): boolean {
    const msg =
        typeof i18n.getLocaleMessage === "function"
            ? i18n.getLocaleMessage(lang)
            : i18n.global?.getLocaleMessage
                ? i18n.global.getLocaleMessage(lang)
                : null;

    return !!(msg && Object.keys(msg).length);
}

// простой счётчик загрузки
import { ref } from "vue";
const i18nLoadingCount = ref(0);
export function useI18nLoadingCount() {
    return i18nLoadingCount;
}

export async function ensureRemoteMessages(nuxtApp: any, lang: string) {
    if (!lang) return;

    const i18n = getI18n(nuxtApp);
    if (loaded.has(lang)) return;
    if (hasMessages(i18n, lang)) {
        loaded.add(lang);
        return;
    }

    const existing = pending.get(lang);
    if (existing) return existing;

    const cnt = useI18nLoadingCount();

    const p = (async () => {
        cnt.value++;
        try {
            const config = useRuntimeConfig();
            const api = config.public.apiBase;

            const data = await $fetch(`/translations/structured`, {
                baseURL: api,
                query: { lang },
            });

            setMessages(i18n, lang, data);
            loaded.add(lang);
        } finally {
            cnt.value--;
        }
    })().finally(() => pending.delete(lang));

    pending.set(lang, p);
    return p;
}
