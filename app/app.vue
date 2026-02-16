<template>
  <u-app>
    <custom-header/>
    <u-main>
      <u-container class="m-auto">
        <NuxtPage/>
      </u-container>
    </u-main>
    <custom-footer/>
    <under-footer/>
    <i18n-loader-overlay/>
  </u-app>
</template>
<script setup lang="ts">
import CustomHeader from "~/layout/Header.vue";
import CustomFooter from "~/layout/Footer.vue";
import UnderFooter from "~/layout/UnderFooter.vue";
import I18nLoaderOverlay from "~/components/common/I18nLoaderOverlay.vue";

const localeHead = useLocaleHead({
  dir: true,
  seo: true,
  lang: true
});

useHead({
  ...localeHead,
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/images/admin-panel.png',
      fetchpriority: 'high',
      type: 'image/webp'
    }
  ]
});
</script>
<style lang="scss">

</style>