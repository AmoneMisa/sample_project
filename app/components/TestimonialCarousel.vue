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
})

const selected = ref(0);

const slides = computed(() => {
  return sliceSlides(props.testimonials);
});
</script>

<template>
  <div class="space-y-6">
    <u-page-header :title="title" :description="description" :headline="headline" class="border-0"/>

    <u-carousel
        v-model="selected"
        :items="slides"
        arrows
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
    >
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <u-card
            v-for="(t, index) in group"
            :key="index"
            :ui="{
              root: 'folder-figure-holder p-6 ring-0 bg-transparent',
              body: 'folder-figure-inner h-fill-available'
            }"
        >
          <div class="flex gap-1 mb-3">
            <u-icon
                v-for="i in t.rating"
                :key="i"
                name="i-lucide-star"
                class="text-yellow-400 size-4"
            />
          </div>

          <blockquote class="text-sm text-muted italic mb-4">
            “{{ t.quote }}”
          </blockquote>

          <div class="flex items-center gap-3">
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-3">
                <p class="font-semibold text-sm">{{ t.name }}</p>
                <p class="text-xs text-muted">{{ t.role }}</p>
              </div>
              <img :alt="t.name" :src="t.avatar" class="object-cover"/>
            </div>
            <img :alt="t.role" :src="t.logo" class="ml-auto h-5"/>
          </div>
        </u-card>
      </div>
    </u-carousel>
  </div>
</template>
