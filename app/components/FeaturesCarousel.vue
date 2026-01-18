<script setup lang="ts">
import {computed} from "vue";
import sliceSlides from "~/assets/sliceSlides";

const props = defineProps({
  cards: {
    type: Array<{}>,
    default: [],
    required: true
  },
  buttonText: {
    type: String,
    default: "Explore More →"
  },
});

const slides = computed(() => {
  return sliceSlides(props.cards);
});
</script>

<template>
  <u-carousel :items="slides" v-slot="{ item: group }" loop indicators dots arrows
              :ui="{
        item: 'px-4',
        indicators: 'mt-4 flex justify-center gap-2',
        indicator: 'size-2 rounded-full bg-muted data-[active=true]:bg-primary'
      }"
  >
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <u-card v-for="(item, index) in group"
              :key="index"
              :ui="{
              root: 'folder-figure-holder p-6 ring-0 bg-transparent',
              body: 'folder-figure-inner h-fill-available'
            }">
        <div
            class="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 z-10 relative">
          <u-icon :name="item.icon" class="text-xl"/>
        </div>
        <div class="z-10 relative space-y-2">
          <h3 class="text-xl font-bold text-white">{{ item.title }}</h3>
          <p class="text-muted">{{ item.description }}</p>
          <u-button variant="link" color="primary">{{ buttonText }}</u-button>
        </div>
      </u-card>
    </div>
  </u-carousel>
</template>

<style scoped lang="scss">

</style>