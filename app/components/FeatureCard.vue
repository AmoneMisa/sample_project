<script setup lang="ts">
defineProps<{
  image: string
  title: string
  description: string
}>()
</script>

<template>
  <u-card
      :ui="{
        root: 'ring-0 flex flex-col items-center text-center gap-3 p-6 rounded-xl transition-transform hover:-translate-y-1'
      }"
  >
    <div class="p-4 rounded-full">
      <img class="mx-auto" alt="service image" :src="`/images/${image}`"/>
    </div>

    <h3 class="text-2xl font-semibold mb-3">{{ title }}</h3>
    <p class="text-base text-muted">{{ description }}</p>
  </u-card>
</template>
