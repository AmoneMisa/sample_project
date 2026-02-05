<script setup lang="ts">
import {safeFetch} from "~/utils/safeFetch";
import PageHeader from "~/components/common/PageHeader.vue";
import type {OfferCardType} from "~/types/OfferCardType";
import CustomButton from "~/components/common/CustomButton.vue";

const config = useRuntimeConfig();

const {data: offerCards} = await safeFetch<OfferCardType[]>(
    `${config.public.apiBase}/offer-cards`
);

const isYearly = ref(true);
const {t} = useI18n();
</script>

<template>
  <u-container class="price-cards">
    <div class="text-center space-y-3 price-cards__header">
      <page-header
          title="pricing.title"
          headline="pricing.headline"
          class="mb-8"
      />

      <div class="price-cards__switcher mb-4">
        <button
            class="price-cards__switcher-button"
            :class="{ 'price-cards__switcher-button_active': !isYearly }"
            @click="isYearly = false"
        >
          {{ t('pricing.switcher.monthly') }}
        </button>

        <button
            class="price-cards__switcher-button"
            :class="{ 'price-cards__switcher-button_active': isYearly }"
            @click="isYearly = true"
        >
          {{ t('pricing.switcher.yearly') }}
          <span class="price-cards__switcher-button-badge line-clamp-1 max-w-[80px]">
            {{ t('pricing.switcher.discountBadge') }}
          </span>
        </button>
      </div>
    </div>

    <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        v-if="offerCards"
    >
      <u-card
          v-for="(offerCard, index) in offerCards"
          :key="offerCard.nameKey"
          :ui="{
              root: 'offer-card flex flex-col p-0 ring-0 bg-transparent relative',
              body: 'offer-card__inner flex flex-col h-full p-6'
          }">
        <div
            v-if="offerCard.highlight"
            class="flex justify-center absolute price-cards__highlight"
        >
          <u-badge color="primary" variant="solid">
            {{ t('pricing.badge.bestOffer') }}
          </u-badge>
        </div>

        <div class="text-center space-y-1" v-if="offerCard.nameKey">
          <h3 class="text-xl font-bold">
            {{ t(offerCard.nameKey) }}
          </h3>

          <p class="text-muted text-sm" v-if="offerCard.descriptionKey">
            {{ t(offerCard.descriptionKey) }}
          </p>

          <p class="text-2xl font-semibold text-primary" v-if="offerCard.yearly && offerCard.monthly">
            {{ isYearly ? offerCard.yearly : offerCard.monthly }}
          </p>
        </div>

        <u-separator class="my-4"/>

        <div class="flex-1">
          <p class="font-semibold text-muted mb-2">
            {{ t('pricing.featuresTitle') }}
          </p>

          <u-page-list
              class="space-y-1 text-sm text-muted spoiler-list"
              :class="{ spoiler_open: index === Math.floor(offerCards.length / 2) }"
              :items="offerCard.features"
          >
            <li
                v-for="feature in offerCard.features"
                :key="feature.id"
                class="flex items-center gap-2"
            >
              <u-icon name="i-lucide-check" class="text-primary"/>
              <span v-if="feature.labelKey">{{ t(feature.labelKey) }}</span>
            </li>
          </u-page-list>

          <u-button
              v-if="offerCard.features.length > 3"
              variant="link"
              color="primary"
              class="mt-2 px-0"
              @click="offerCard.expanded = !offerCard.expanded"
          >
            {{
              offerCard.expanded
                  ? t('pricing.actions.showLess')
                  : t('pricing.actions.showMore')
            }}
          </u-button>
        </div>

        <u-separator class="my-4"/>

        <div class="flex flex-col items-center gap-4">
          <custom-button variant="full" class="w-full justify-center">
            {{ t('pricing.actions.getStarted') }}
          </custom-button>

          <span class="text-xs text-muted">
            {{ t('pricing.limitedOffer') }}
          </span>
        </div>
      </u-card>
    </div>
  </u-container>
</template>

<style lang="scss">
.offer-card {
  position: relative;
  padding: 2px;
  border-radius: 18px;
  overflow: hidden;
  clip-path: polygon(
          0 0,
          calc(100% - 34px) 0,
          100% 30px,
          100% 100%,
          0 100%
  );
  background: linear-gradient(
          120deg,
          rgba(128, 90, 245, 0.85),
          rgba(205, 153, 255, 0.55),
          rgba(255, 255, 255, 0.10),
          rgba(128, 90, 245, 0.85)
  );
  background-size: 240% 240%;
  box-shadow:
      0 16px 45px rgba(0, 0, 0, 0.45),
      0 0 0 1px rgba(255, 255, 255, 0.03);
}

.offer-card__inner {
  position: relative;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(14, 12, 21, 0.92);
  clip-path: polygon(
          0 0,
          calc(100% - 34px) 0,
          100% 30px,
          100% 100%,
          0 100%
  );
  box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      inset 0 -18px 30px rgba(0, 0, 0, 0.45);
}

.offer-card__inner::after {
  content: "";
  position: absolute;
  inset: -60% -60%;
  background: linear-gradient(
          45deg,
          transparent 44%,
          rgba(255, 255, 255, 0.10) 50%,
          transparent 56%
  );
  transform: translateX(-35%) translateY(35%);
  opacity: 0;
  pointer-events: none;
}

.offer-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  clip-path: inherit;
  background: linear-gradient(
          120deg,
          transparent 0%,
          rgba(255, 255, 255, 0.00) 35%,
          rgba(255, 255, 255, 0.18) 50%,
          rgba(255, 255, 255, 0.00) 65%,
          transparent 100%
  );
  background-size: 220% 220%;
  background-position: 0% 50%;
  opacity: 0;
  pointer-events: none;
}

.offer-card:hover::before {
  opacity: 1;
  animation: offerBorderBurst 0.7s ease-out 1;
}

.offer-card:hover .offer-card__inner::after {
  opacity: 1;
  animation: offerSheen 0.75s ease-out 1 forwards;
}

.offer-card:hover {
  filter: brightness(1.02);
}

@keyframes offerBorderIdle {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes offerBorderBurst {
  from { background-position: 0% 50%; }
  to   { background-position: 180% 50%; }
}

@keyframes offerSheen {
  from { transform: translateX(-35%) translateY(35%); }
  to   { transform: translateX(35%) translateY(-35%); }
}

@media (prefers-reduced-motion: reduce) {
  .offer-card {
    animation: none;
  }
  .offer-card::before,
  .offer-card__inner::after {
    animation: none !important;
    opacity: 0 !important;
  }
}

@media (max-width: 640px) {
  .offer-card,
  .offer-card__inner {
    clip-path: polygon(
            0 0,
            calc(100% - 24px) 0,
            100% 22px,
            100% 100%,
            0 100%
    );
    border-radius: 16px;
  }
  .offer-card__inner {
    border-radius: 14px;
  }
}

</style>