<script setup lang="ts">
defineProps<{
  title: string,
  logos: { src: string; alt: string }[]
}>();
</script>

<template>
  <div class="text-center space-y-4">
    <div class="flex justify-center text-yellow-400 items-center gap-2">
      <u-icon name="i-lucide-star" v-for="i in 5" :key="i" class="size-5" />
      <u-page-header :title="title" class="p-0 border-0" :ui="{title: 'text-base sm:text-base'}" />
    </div>


    <div class="flex flex-wrap justify-center gap-6 mt-12 items-center">
      <img
          v-for="(logo, index) in logos"
          :key="index"
          :src="logo.src"
          :alt="logo.alt"
          class="transition hover:brightness-110 hover:drop-shadow-md cursor-pointer w-48 h-fit"
      />
    </div>
  </div>
</template>
