<script setup lang="ts">
import {computed, ref} from "vue";
import Carousel from "~/components/common/Carousel.vue";

const props = defineProps({
  testimonials: {
    type: Array as () => Array<{
      rating: number;
      quote: string;
      name: string;
      role: string;
      avatar: string;
      logo: string;
    }>,
    required: true,
  },
  title: String,
  description: String,
  headline: String,
});

const selected = ref(0);
const canPaginate = computed(() => (props.testimonials?.length ?? 0) > 1);

watch(
    () => props.testimonials?.length,
    (len) => {
      if (!len) return;
      if (selected.value > len - 1) selected.value = 0;
    }
);
</script>

<template>
  <div class="space-y-6">
    <carousel
        v-model="selected"
        :items="testimonials"
        :loop="canPaginate"
        :indicators="canPaginate"
        :dots="canPaginate"
        :arrows="canPaginate"
        v-slot="{ item }"
        :ui="{
        item: 'px-3 sm:px-4',
        indicators: 'mt-4 flex justify-center gap-2',
        indicator:
          'size-2 rounded-full bg-muted data-[active=true]:bg-primary transition',
        dots: 'gap-4',
        dot: 'tab-circle-button'
      }"
        :title="title"
        :description="description"
        :headline="headline"
        :isCentered="false"
        class="mb-10 sm:mb-14"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <u-card
            :ui="{
            root: 'folder-icon ring-0 bg-transparent relative testimonial',
            body: 'h-fill-available sm:p-8 py-[38px] px-[20px]'
          }"
        >
          <div class="testimonial__border">
            <picture>
              <img alt="border" src="/svg/folder.svg" class="testimonial__border-image "/>
            </picture>
            <picture>
              <img
                  alt="border"
                  src="/svg/folder-border.svg"
                  class="testimonial__border-image testimonial__border-image_border"
              />
            </picture>
          </div>

          <div class="flex gap-1 mb-3">
            <u-icon
                v-for="i in item.rating"
                :key="i"
                name="i-lucide-star"
                class="text-yellow-400 size-4"
            />
          </div>

          <blockquote
              class="text-sm text-muted italic mb-4 line-clamp-5 break-words"
              :title="item.quote"
          >
            “{{ item.quote }}”
          </blockquote>

          <div class="flex md:flex-col sm:flex-row sm:items-center gap-4 justify-between md:justify-baseline">
            <div class="flex items-center gap-4 min-w-0">
              <img
                  :alt="item.name"
                  :src="item.avatar"
                  class="h-12 w-12 rounded-full object-cover shrink-0"
                  loading="lazy"
                  decoding="async"
              />

              <div class="flex flex-col gap-1 min-w-0">
                <p class="font-semibold text-sm line-clamp-1" :title="item.name">
                  {{ item.name }}
                </p>
                <p class="text-xs text-muted line-clamp-1" :title="item.role">
                  {{ item.role }}
                </p>
              </div>
            </div>

            <img
                :alt="item.role"
                :src="item.logo"
                class="testimonial__image testimonial__image_logo sm:ml-auto sm:h-5 md:h-6 h-12 w-12 rounded-full"
                loading="lazy"
                decoding="async"
            />
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
  inset: 0;
  pointer-events: none;
}

.testimonial__border-image {
  transition: opacity 0.2s ease;
  width: -webkit-fill-available;
  height: -webkit-fill-available;
  position: absolute;
  inset: 0;
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

@media (max-width: 640px) {
  .testimonial__image_logo {
    height: 48px;
  }
}
</style>
