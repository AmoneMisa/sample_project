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
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <u-card
            v-for="(testimonial, index) in group"
            :key="index"
            :ui="{
              root: 'folder-icon ring-0 bg-transparent',
              body: 'h-fill-available sm:p-8 p-8'
            }"
        >
          <div class="flex gap-1 mb-3">
            <u-icon
                v-for="i in testimonial.rating"
                :key="i"
                name="i-lucide-star"
                class="text-yellow-400 size-4"
            />
          </div>

          <blockquote class="text-sm text-muted italic mb-4">
            “{{ t(testimonial.quote) }}”
          </blockquote>

          <div class="flex items-center gap-3">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-3">
                <p class="font-semibold text-sm">{{ t(testimonial.name) }}</p>
                <p class="text-xs text-muted">{{ t(testimonial.role) }}</p>
              </div>
              <img :alt="t(testimonial.name)" :src="testimonial.avatar" class="object-cover"/>
            </div>
            <img :alt="t(testimonial.role)" :src="testimonial.logo" class="ml-auto h-5"/>
          </div>
        </u-card>
      </div>
    </carousel>
  </div>
</template>

<style scoped lang="scss">
.folder-icon {
  position: relative;
  cursor: pointer;
  background: transparent;
  overflow: hidden;
  clip-path: polygon(
          2% 0%,
          33.65% 0%,
          45.5% 20.16%,
          100% 20.55%,
          100% 98%,
          98.58% 99.6%,
          1.18% 99.6%,
          0% 97.63%,
          0% 1.98%,
          1.18% 0.79%
  );

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
    transition: background-color 0.3s ease;
    z-index: -1;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background-color: var(--background-color);
    clip-path: polygon(
            2% 0%,
            33.65% 0%,
            45.5% 20.16%,
            100% 20.55%,
            100% 98%,
            98.58% 99.6%,
            1.18% 99.6%,
            0% 97.63%,
            0% 1.98%,
            1.18% 0.79%
    );
    z-index: -1;
  }

  &:hover::after {
    background: linear-gradient(to left, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
  }
}
</style>