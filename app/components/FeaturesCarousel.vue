<script setup lang="ts">
import {computed} from "vue";
import sliceSlides from "~/assets/sliceSlides";

const {t} = useI18n();
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
  <carousel :items="slides" v-slot="{ item: group }" loop indicators dots
            :ui="{
        item: 'px-4',
        indicators: 'mt-4 flex justify-center gap-2',
        indicator: 'size-2 rounded-full bg-muted data-[active=true]:bg-primary',
        dots: 'gap-4',
        dot: 'tab-circle-button'
      }"
            title="carousel.title" headline="carousel.headline"
            headLineClasses="gradient-text_cap"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <u-card v-for="(item, index) in group"
              :key="index"
              :ui="{
              root: 'folder-figure-holder p-6 ring-0 bg-transparent',
              body: 'folder-figure-inner h-fill-available background-shape-image'
            }">
        <div
            class="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 z-10 relative">
          <img :alt="t(item.title)" :src="item.icon" class="text-xl"/>
        </div>
        <div class="z-10 relative space-y-2">
          <h3 class="text-xl font-bold text-white">{{ t(item.title) }}</h3>
          <p class="text-muted">{{ t(item.description) }}</p>
          <custom-button buttonType="link">{{ t(buttonText) }}</custom-button>
        </div>
      </u-card>
    </div>
  </carousel>
</template>

<style lang="scss">
.background-shape-image {
  &:after {
    content: "";
    background-image: url("/images/service-card-bg.png");
    top: 12%;
    height: auto;
    width: 60%;
    z-index: 2;
    opacity: 0.7;
    transition: opacity 0.3s ease;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
  }

  &:hover {
    &:after {
      opacity: 1;
    }
  }
}
</style>