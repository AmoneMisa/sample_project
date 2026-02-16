<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";

defineProps<{
  title: string,
  logos: { src: string; alt: string }[]
}>();

const {t} = useI18n();
</script>

<template>
  <div class="text-center">
    <div class="flex justify-center items-center gap-2">
      <u-icon name="i-lucide-fish-symbol" v-for="i in 5" :key="i" class="text-primary w-4 h-4"/>
      <page-header :title="t(title)" class="p-0 border-0" :ui="{title: 'text-base sm:text-base'}"/>
    </div>

    <div class="flex flex-wrap justify-center gap-8 mt-6 items-center">
      <div class="max-w-[100px]" v-for="(logo, index) in logos" :key="index">
        <nuxt-img
            class="transition hover:brightness-125 hover:drop-shadow-md cursor-pointer h-fit"
            :src="logo.src"
            :alt="t(logo.alt)"
            :quality="80"
            width="100"
            height="100"
            fit="contain"
            loading="lazy"
            sizes="100px"
            :widths="[100, 200]"
        />
      </div>
    </div>
  </div>
</template>
