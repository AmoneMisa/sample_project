<script setup lang="ts">
defineProps({
  cards: {
    type: Array,
    default: [],
    required: true
  },
  buttonText: {
    type: String,
    default: "Explore More →"
  },
});
</script>

<template>
  <u-carousel :items="cards" v-slot="{ item }" loop dots arrows class="max-w-6xl mx-auto">
    <div class="folder-figure-holder">
      <div class="folder-figure-inner">
        <div
            class="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 z-10 relative">
          <u-icon :name="item.icon" class="text-xl"/>
        </div>
        <div class="z-10 relative space-y-2">
          <h3 class="text-xl font-bold text-white">{{ item.title }}</h3>
          <p class="text-muted">{{ item.description }}</p>
          <u-button variant="link" color="primary">{{ buttonText }}</u-button>
        </div>
      </div>
    </div>
  </u-carousel>
</template>

<style scoped lang="scss">

</style>