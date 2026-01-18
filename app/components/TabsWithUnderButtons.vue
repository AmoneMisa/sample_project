<script setup lang="ts">
defineProps({
  tabs: {
    type: Array,
    default: [],
    required: true
  },
  buttonText: {
    type: String,
    default: "Try It Now →"
  },
});
</script>

<template>
  <u-tabs :items="tabs" class="flex flex-col-reverse gap-6">
    <template #content="{ item }">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div class="space-y-4">
          <h2 class="text-3xl font-bold text-white">{{ item.title }}</h2>
          <p class="text-muted text-lg">{{ item.description }}</p>
          <u-button color="primary">Try It Now →</u-button>
        </div>
        <div class="min-h-[450px]">
          <img :src="item.image" :alt="item.title" class="w-full max-w-md mx-auto"/>
        </div>
      </div>
    </template>
  </u-tabs>
</template>

<style scoped lang="scss">

</style>