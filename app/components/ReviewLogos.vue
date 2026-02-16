<script setup lang="ts">
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
      <u-page-header :title="t(title)" class="p-0 border-0" :ui="{title: 'text-base sm:text-base'}"/>
    </div>

    <div class="flex flex-wrap justify-center gap-8 mt-6 items-center">
      <div class="max-w-[100px]" v-for="(logo, index) in logos" :key="index">
        <nuxt-img
            class="transition hover:brightness-125 hover:drop-shadow-md cursor-pointer w-full h-fit"
            :src="logo.src"
            :alt="t(logo.alt)"
            format="webp"
            quality="100"
            widths="[1280]"
            sizes="(max-width: 768px) 100vw, 1200px"
        />
      </div>
    </div>
  </div>
</template>
