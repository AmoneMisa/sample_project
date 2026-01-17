<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
}>()
</script>

<template>
  <u-card
      :ui="{
        root: 'flex flex-col items-center text-center gap-3 p-6 rounded-xl bg-muted/5 transition-transform hover:-translate-y-1 hover:shadow-lg'
      }"
  >
    <div class="bg-muted/10 p-4 rounded-full">
      <u-icon :name="icon" class="text-primary size-6"/>
    </div>

    <h3 class="text-base font-semibold">{{ title }}</h3>
    <p class="text-sm text-muted">{{ description }}</p>
  </u-card>
</template>
