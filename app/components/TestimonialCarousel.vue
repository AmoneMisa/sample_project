<script setup lang="ts">
import {computed, ref} from "vue";
import Carousel from "~/components/common/Carousel.vue";

const props = defineProps({
  testimonials: {
    type: Array,
    required: true,
  },
  title: String,
  description: String,
  headline: String,
});

const {t} = useI18n();
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
  <u-container class="mb-0">
    <carousel
        v-model="selected"
        :items="testimonials"
        :loop="canPaginate"
        :indicators="canPaginate"
        :dots="canPaginate"
        :arrows="canPaginate"
        v-slot="{ item }"
        :ui="{
        item: 'basis-full sm:basis-1/2 lg:basis-1/3 px-3 sm:px-4',
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
    >
      <u-card
          :ui="{
            root: 'folder-icon ring-0 bg-transparent relative testimonial',
            body: 'h-fill-available sm:p-8 py-[38px] px-[28px]'
          }"
      >
        <div class="testimonial__border">
          <picture>
            <nuxt-img
                class="testimonial__border-image"
                src="/svg/folder.svg"
                alt="border"
                format="svg"
                quality="100"
                widths="[460, 768, 1280]"
                sizes="(max-width: 768px) 100vw, 1200px"
            />
          </picture>
          <picture>
            <nuxt-img
                class="testimonial__border-image testimonial__border-image_border"
                src="/svg/folder-border.svg"
                alt="border"
                format="svg"
                quality="100"
                widths="[460, 768, 1280]"
                sizes="(max-width: 768px) 100vw, 1200px"
            />
          </picture>
        </div>
        <div class="flex items-center gap-4 justify-between mb-3">
          <div class="min-w-0">
            <nuxt-img
                class="h-12 w-12 rounded-full object-cover shrink-0"
                :alt="t(item.nameKey)"
                :src="item.avatar"
                format="svg"
                quality="100"
                widths="[460, 768, 1280]"
                sizes="(max-width: 768px) 100vw, 1200px"
                loading="lazy"
                decoding="async"
            />
          </div>
          <div class="flex gap-1 max-w-[70px] sm:max-w-fit">
            <u-icon
                v-for="i in item.rating"
                :key="i"
                name="i-lucide-fish"
                class="text-yellow-400 size-4"
            />
          </div>
        </div>
        <blockquote v-if="item?.quoteKey"
                    class="text-sm text-muted italic mb-4 line-clamp-5 break-words"
                    :title="t(item.quoteKey)"
        >
          “{{ t(item.quoteKey) }}”
        </blockquote>
        <div class="flex sm:items-center gap-4 justify-between md:justify-baseline w-full min-w-0">
          <p class="font-semibold text-sm line-clamp-1">
            {{ t(item.nameKey) }}
          </p>
          <p class="text-xs text-muted line-clamp-1">
            {{ t(item.roleKey) }}
          </p>
        </div>
      </u-card>
    </carousel>
  </u-container>
</template>

<style scoped lang="scss">
.testimonial__image {
  max-width: 60px;
}

.testimonial__image_logo {
  height: auto;
  max-width: 100%;
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
