<template>
  <u-app>
    <custom-header/>
    <u-main>
      <u-container class="m-auto">
        <NuxtPage/>
      </u-container>
    </u-main>
    <custom-footer/>
  </u-app>
</template>
<script setup lang="ts">
import CustomHeader from "~/layout/Header.vue";
import CustomFooter from "~/layout/Footer.vue";

</script>
<style lang="scss">

</style>