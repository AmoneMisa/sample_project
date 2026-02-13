<script setup lang="ts">
import {UCarousel} from '#components';
import PageHeader from "~/components/common/PageHeader.vue";

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  ui: {
    type: Object,
    default: () => ({})
  },
  loop: {
    type: Boolean,
    default: false
  },
  autoplay: {
    type: [Boolean, Object],
    default: false
  },
  indicators: {
    type: Boolean,
    default: false
  },
  dots: {
    type: Boolean,
    default: false
  },
  arrows: {
    type: Boolean,
    default: false
  },
  description: {
    type: String
  },
  headline: {
    type: String
  },
  title: {
    type: String
  },
  isFullWidth: {
    type: Boolean,
    default: true
  },
  headLineClasses: {
    type: String,
    default: ""
  },
  titleClasses: {
    type: String,
    default: ""
  },
  descriptionClasses: {
    type: String,
    default: ""
  }
});

const carousel = useTemplateRef('carousel');
const scrollPrev = () => { carousel.value?.emblaApi?.scrollPrev(); };
const scrollNext = () => { carousel.value?.emblaApi?.scrollNext(); };
</script>

<template>
  <div class="relative w-full carousel">
    <div class="carousel__row">
      <page-header :title="title" :headline="headline" :isCentered="false"
                   :isFullWidth="false" :headLineClasses="headLineClasses"
                   :titleClasses="titleClasses" :descriptionClasses="descriptionClasses"/>
      <div class="carousel__arrows" v-if="arrows">
        <button
            class="absolute left-0 top-1/2 -translate-y-1/2 z-10 gradient-button-figure gradient-button-figure_reverse carousel__arrow"
            @click="scrollPrev()"
        >
          ←
        </button>

        <button
            class="absolute right-0 top-1/2 -translate-y-1/2 z-10 gradient-button-figure carousel__arrow"
            @click="scrollNext()"
        >
          →
        </button>
      </div>
    </div>
    <u-carousel
        v-bind="props"
        :arrows="false"
        v-slot="{ item }"
        ref="carousel"
    >
      <slot :item="item"/>
    </u-carousel>
  </div>
</template>

<style scoped lang="scss">
.carousel__row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

@media screen and (max-width: 560px){
  .carousel__row {
    flex-wrap: wrap;
    justify-content: center;
    gap: 15px;
  }
}

.carousel__arrows {
  display: flex;
  gap: 20px;
}

.carousel__arrow {
  height: 59px;
  width: 53px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color .3s ease;
  color: var(--ui-text-inverted);

  &:before {
    opacity: 0.6;
  }

  &:after {
    transition: opacity .3s ease;
  }

  &:hover {
    color: var(--color-blackest);
    &:after {
      opacity: 0;
    }
  }
}
</style>