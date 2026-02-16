<script setup lang="ts">
import {computed} from "vue";
import Carousel from "~/components/common/Carousel.vue";

const {t} = useI18n();

const props = defineProps({
  cards: {
    type: Array as () => Array<{ title: string; description: string; icon: string }>,
    default: () => [],
    required: true
  },
  buttonText: {
    type: String,
    default: "Explore More →"
  },
  title: {
    type: String,
    default: "carousel.title"
  },
  headline: {
    type: String,
    default: "carousel.headline"
  }
});

const canPaginate = computed(() => (props.cards?.length ?? 0) > 1);
</script>

<template>
  <carousel
      :items="cards"
      v-slot="{ item }"
      :loop="canPaginate"
      :indicators="canPaginate"
      :dots="canPaginate"
      :ui="{
          item: 'basis-full sm:basis-1/2 lg:basis-1/3 px-3 sm:px-4',
          indicators: 'mt-5 flex justify-center gap-3',
          indicator: 'size-2 rounded-full bg-white/15 ring-2 ring-white/5 data-[active=true]:bg-transparent data-[active=true]:ring-primary transition',
          dots: 'gap-4',
          dot: 'tab-circle-button',
    }"
      title="carousel.title"
      headline="carousel.headline"
      headLineClasses="gradient-text_cap"
  >
    <div class="flex">
      <u-card
          :ui="{
      root: 'folder-figure-holder w-fill-available group relative p-0 bg-transparent ring-0 h-full lg:w-auto',
      body: 'folder-figure-inner relative h-full p-6 sm:p-7'
  }">
        <div class="relative z-10 flex flex-col gap-4 h-full">
          <div class="flex gap-4 items-center ">
            <div
                class="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full dark:bg-primary/10 ring-1 dark:ring-white/5 bg-white/70 backdrop-blur-md ring-black/10 shadow-inner"
            >
              <nuxt-img
                  class="w-full"
                  :src="item.icon"
                  :alt="t(item.title)"
                  format="webp"
                  quality="100"
                  width="48"
                  height="48"
                  sizes="48px"
                  :widths="[48, 96]"
                  loading="lazy"
              />
            </div>
            <h3 class="dark:text-white text-[var(--ui-text)] text-lg sm:text-xl font-semibold leading-snug">
              {{ t(item.title) }}
            </h3>
          </div>
          <div class="space-y-2">

            <p class="dark:text-white/70 text-[var(--ui-text)]/70 text-sm sm:text-base leading-relaxed">
              {{ t(item.description) }}
            </p>
          </div>
        </div>
      </u-card>
    </div>
  </carousel>
</template>

<style scoped lang="scss">
}
</style>
