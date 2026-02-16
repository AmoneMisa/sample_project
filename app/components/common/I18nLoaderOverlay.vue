<script setup lang="ts">
import {loadTranslationsClient} from "~/composables/useI18nClientLoader";

const nuxtApp = useNuxtApp();
const isLoadingCount = useI18nLoadingCount();
const rawLocale = nuxtApp.$i18n.locale;
const localeRef = typeof rawLocale === "string" ? ref(rawLocale) : rawLocale;
if (import.meta.client) {
  watch(
      localeRef,
      async (newLang) => {
        const lang = newLang || "ru";
        await loadTranslationsClient(nuxtApp, lang);
      },
      {immediate: true}
  );
}
</script>

<template>
  <transition name="fade">
    <div v-if="isLoadingCount > 0" class="i18n-overlay" aria-busy="true" aria-live="polite">
      <div class="i18n-overlay__card">
        <u-progress
            class="i18n-overlay__progress"
            size="xl"
            animation="carousel"
            :ui="{
            root: 'gap-0',
            base: 'rounded-full',
            indicator: 'rounded-full'
          }"
        />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.i18n-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
}

.i18n-overlay__card {
  padding: 14px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.i18n-overlay__progress {
  width: 80px;
  height: 80px;
  align-items: center;
  justify-content: center;
}

</style>
