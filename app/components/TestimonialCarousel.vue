<script setup lang="ts">
import {computed, ref} from 'vue'
import sliceSlides from "~/assets/sliceSlides";



const props = defineProps({
  testimonials: {
    type: Array<{}>,
    required: true
  },
  title: String,
  description: String,
  headline: String
});

const {t} = useI18n();

const selected = ref(0);

const slides = computed(() => {
  return sliceSlides(props.testimonials);
});
</script>

<template>
  <div class="space-y-6">
    <carousel v-model="selected"
              :items="slides"
              indicators
              dots
              loop
              v-slot="{item: group}"
              :ui="{
        item: 'px-4',
        indicators: 'mt-4 flex justify-center gap-2',
        indicator: 'size-2 rounded-full bg-muted data-[active=true]:bg-primary',
        dots: 'gap-4',
        dot: 'tab-circle-button'
      }"
              :title="title" :description="description" :headline="headline" :isCentered="false" class="mb-14"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-1 gap-6">
        <u-card
            v-for="(testimonial, index) in group"
            :key="index"
            :ui="{
              root: 'folder-icon ring-0 bg-transparent relative testimonial',
              body: 'h-fill-available sm:p-8 p-8'
            }"
        >
          <div class="testimonial__border">
            <picture>
              <img alt="border" src="/svg/folder.svg" class="testimonial__border-image">
            </picture>
            <picture>
              <img alt="border" src="/svg/folder-border.svg"
                   class="testimonial__border-image testimonial__border-image_border"></picture>

          </div>
          <div class="flex gap-1 mb-3">
            <u-icon
                v-for="i in testimonial.rating"
                :key="i"
                name="i-lucide-star"
                class="text-yellow-400 size-4"
            />
          </div>

          <blockquote class="text-sm text-muted italic mb-4">
            “{{ testimonial.quote }}”
          </blockquote>

          <div class="flex items-center gap-3">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-3">
                <p class="font-semibold text-sm">{{ testimonial.name }}</p>
                <p class="text-xs text-muted">{{ t(testimonial.role) }}</p>
              </div>
              <img :alt="testimonial.name" :src="testimonial.avatar" class="testimonial__image testimonial__image_avatar object-cover rounded-lg"/>
            </div>
            <img :alt="t(testimonial.role)" :src="testimonial.logo" class="testimonial__image testimonial__image_logo ml-auto rounded-full"/>
          </div>
        </u-card>
      </div>
    </carousel>
  </div>
</template>

<style scoped lang="scss">
.testimonial__image {
  max-width: 60px;
}

.testimonial__image_logo {
  height: 64px;
  max-width: initial;
}

.testimonial__border {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.testimonial__border-image {
  transition: opacity 0.2s ease;
  width: -webkit-fill-available;
  height: -webkit-fill-available;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.testimonial__border-image_border {
  opacity: 0;
}

.testimonial {
  cursor: pointer;

  &:hover {
    .testimonial__border-image {
      opacity: 0;
    }

    .testimonial__border-image_border {
      opacity: 1;
    }
  }
}

</style>