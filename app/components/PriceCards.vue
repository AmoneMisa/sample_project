<script setup lang="ts">
import {safeFetch} from "~/utils/safeFetch";
import PageHeader from "~/components/common/PageHeader.vue";
import type {OfferCardType} from "~/types/OfferCardType";

const config = useRuntimeConfig();

const { data: offerCards } = await safeFetch<OfferCardType[]>(
    `${config.public.apiBase}/offer-cards`
);

const isYearly = ref(true);
const { t } = useI18n();
</script>

<template>
  <u-container class="price-cards">
    <div class="text-center space-y-3 price-cards__header">
      <page-header
          title="pricing.title"
          headline="pricing.headline"
          class="mb-6"
      />

      <div class="price-cards__switcher">
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
          root: 'flex flex-col p-6 folder-figure-holder ring-0 rounded-md bg-transparent',
          body: 'folder-figure-inner flex flex-col h-full'
        }"
      >
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

        <u-separator class="my-4" />

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
              <u-icon name="i-lucide-check" class="text-primary" />
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

        <u-separator class="my-4" />

        <div class="flex flex-col items-center gap-2">
          <u-button color="primary" class="w-full justify-center">
            {{ t('pricing.actions.getStarted') }}
          </u-button>

          <span class="text-xs text-muted">
            {{ t('pricing.limitedOffer') }}
          </span>
        </div>
      </u-card>
    </div>
  </u-container>
</template>
