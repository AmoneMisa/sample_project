<script setup lang="ts">
import type FeatureCardInterface from "~/interfaces/FeatureCardInterface";

const props = defineProps<{
  cards: FeatureCardInterface[]
}>()

const isChess = computed(() => (props.cards?.length ?? 0) < 5)
</script>

<template>
  <div
      class="grid gap-4 sm:gap-5 lg:gap-6
           grid-cols-1
           sm:grid-cols-1
           md:grid-cols-2
           lg:grid-cols-3
           xl:grid-cols-3"
      :class="isChess ? 'cards-chess' : ''"
  >
    <div v-for="(c, i) in cards" :key="i" class="min-w-0">
      <FeatureCard :image="c.image" :title="c.titleKey" :description="c.descriptionKey" />
    </div>
  </div>
</template>

<style scoped>
.cards-chess > :nth-child(even) {
  transform: translateY(10px);
}

@media (max-width: 768px) {
  .cards-chess > :nth-child(even) {
    transform: none;
  }
}
</style>
