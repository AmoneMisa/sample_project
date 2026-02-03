<script setup lang="ts">
import {computed} from "vue";
import Carousel from "~/components/common/Carousel.vue";
import CustomButton from "~/components/common/CustomButton.vue";

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
      root: 'folder-figure-holder group relative p-0 bg-transparent ring-0 h-full w-full lg:w-auto',
      body: 'folder-figure-inner relative h-full p-6 sm:p-7'
  }">
        <div class="relative z-10 flex flex-col gap-4 h-full">
          <div class="flex gap-4 items-center">
            <div
                class="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-primary/10 ring-1 ring-white/5"
            >
              <img :alt="t(item.title)" :src="item.icon" class="w-full"/>
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

          <div class="pt-2 mt-auto">
            <custom-button buttonType="link" _class="btn_link">
              {{ t(buttonText) }}
            </custom-button>
          </div>
        </div>
      </u-card>
    </div>
  </carousel>
</template>

<style scoped lang="scss">
.fx-card {
  --cut: 26px;
  --cutY: 22px;
  border-radius: 22px;
  overflow: hidden;
  padding: 2px;
  background: rgba(255, 255, 255, 0.06);
  transition: filter .25s ease;
}

.fx-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
          90deg,
          var(--color-primary-gradient-start),
          var(--color-primary-gradient-end),
          var(--color-primary-gradient-start)
  );
  background-size: 220% 220%;
  opacity: 0;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;

  pointer-events: none;
  transition: opacity .25s ease;
}

.fx-card:hover::before,
.fx-card:focus-within::before {
  opacity: 1;
  animation: fx-borderShift 1.3s linear infinite;
}

@keyframes fx-borderShift {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.fx-card {
  clip-path: polygon(
          0 0,
          calc(100% - var(--cut)) 0,
          100% var(--cutY),
          100% 100%,
          0 100%
  );
}

.fx-card__inner {
  border-radius: 20px;
  overflow: hidden;
  background: radial-gradient(900px 300px at 18% 10%, rgba(128, 90, 245, 0.10), transparent 60%),
  radial-gradient(900px 300px at 82% 10%, rgba(205, 153, 255, 0.08), transparent 60%),
  rgba(14, 12, 21, 0.96);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
  inset 0 -20px 40px rgba(0, 0, 0, 0.50);
  clip-path: polygon(
          0 0,
          calc(100% - var(--cut)) 0,
          100% var(--cutY),
          100% 100%,
          0 100%
  );
}

.fx-card__inner::before {
  content: "";
  position: absolute;
  top: -40%;
  left: -60%;
  width: 55%;
  height: 200%;
  transform: rotate(25deg);
  background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.10),
          rgba(255, 255, 255, 0.22),
          rgba(255, 255, 255, 0.10),
          transparent
  );

  opacity: 0;
  pointer-events: none;
  filter: blur(0.2px);
}

.fx-card:hover .fx-card__inner::before,
.fx-card:focus-within .fx-card__inner::before {
  opacity: 1;
  animation: fx-sheenDiag .85s ease forwards;
}

@keyframes fx-sheenDiag {
  from {
    transform: translateX(0) rotate(25deg);
  }
  to {
    transform: translateX(240%) rotate(25deg);
  }
}

.fx-card:hover,
.fx-card:focus-within {
  filter: drop-shadow(0 18px 42px rgba(0, 0, 0, .45));
}

@media (prefers-reduced-motion: reduce) {
  .fx-card:hover::before,
  .fx-card:focus-within::before {
    animation: none;
  }

  .fx-card__inner::before,
  .fx-card:hover .fx-card__inner::before,
  .fx-card:focus-within .fx-card__inner::before {
    animation: none !important;
    opacity: 0 !important;
  }
}

@media (max-width: 640px) {
  .fx-card {
    --cut: 18px;
    --cutY: 14px;
    border-radius: 18px;
  }

  .fx-card__inner {
    border-radius: 16px;
  }
}
</style>
