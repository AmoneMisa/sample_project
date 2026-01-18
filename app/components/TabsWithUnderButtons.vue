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
      <div class="flex items-center">
        <div class="min-h-[450px] max-w-[40%]">
          <img :src="item.image" :alt="item.title" class="w-full"/>
        </div>
        <div class="flex flex-col w-full px-20 py-7 max-w-[55%]">
          <page-header :title="item.title" :description="item.description" :headline="item.headline"
                       :isCentered="false" descriptionClasses="mt-8"/>
          <custom-button class="w-fit mt-8">Try It Now →</custom-button>
        </div>
      </div>
    </template>
  </u-tabs>
</template>

<style scoped lang="scss">

</style>