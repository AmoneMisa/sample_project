<template>
  <u-app>
    <custom-header/>
    <u-main>
      <u-container class="m-auto">
        <NuxtPage/>
      </u-container>
    </u-main>
    <custom-footer/>
    <under-footer />
    <i18n-loader-overlay />
  </u-app>
</template>
<script setup lang="ts">
import CustomHeader from "~/layout/Header.vue";
import CustomFooter from "~/layout/Footer.vue";
import UnderFooter from "~/layout/UnderFooter.vue";

</script>
<style lang="scss">

</style>