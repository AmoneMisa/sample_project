<script setup lang="ts">
import normalizeList from "~/assets/normalizeList";

const isYearly = ref(true);
const {t, tm, rt} = useI18n();

const plans = ref([
  {
    key: 'basic',
    name: 'pricing.plans.basic.name',
    description: 'pricing.plans.basic.description',
    monthly: 'pricing.plans.basic.monthly',
    yearly: 'pricing.plans.basic.yearly',
    features: 'pricing.plans.basic.features',
    highlight: false,
    expanded: false
  },
  {
    key: 'premium',
    name: 'pricing.plans.premium.name',
    description: 'pricing.plans.premium.description',
    monthly: 'pricing.plans.premium.monthly',
    yearly: 'pricing.plans.premium.yearly',
    features: 'pricing.plans.premium.features',
    highlight: true,
    expanded: true
  },
  {
    key: 'enterprise',
    name: 'pricing.plans.enterprise.name',
    description: 'pricing.plans.enterprise.description',
    monthly: 'pricing.plans.enterprise.monthly',
    yearly: 'pricing.plans.enterprise.yearly',
    features: 'pricing.plans.enterprise.features',
    highlight: false,
    expanded: false
  }
]);
</script>

<template>
  <u-container class="py-20 space-y-12 price-cards">
    <div class="text-center space-y-3 price-cards__header">
      <page-header
          title="pricing.title"
          headline="pricing.headline"
          class="mb-8"
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

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <u-card
          v-for="(plan, index) in plans"
          :key="plan.key"
          :ui="{
          root: 'flex flex-col p-6 folder-figure-holder ring-0 rounded-md bg-transparent',
          body: 'folder-figure-inner flex flex-col h-full'
        }"
      >
        <div v-if="plan.highlight" class="flex justify-center absolute price-cards__highlight">
          <u-badge color="primary" variant="solid">
            {{ t('pricing.badge.bestOffer') }}
          </u-badge>
        </div>

        <div class="text-center space-y-1">
          <h3 class="text-xl font-bold">{{ t(plan.name) }}</h3>
          <p class="text-muted text-sm">{{ t(plan.description) }}</p>
          <p class="text-2xl font-semibold text-primary">
            {{ isYearly ? t(plan.yearly) : t(plan.monthly) }}
          </p>
        </div>

        <u-separator class="my-4"/>

        <div class="flex-1">
          <p class="font-semibold text-muted mb-2">
            {{ t('pricing.featuresTitle') }}
          </p>
          <u-page-list
              class="space-y-1 text-sm text-muted spoiler-list"
              :class="{ spoiler_open: plan.expanded }"
              :items="normalizeList(tm(plan.features))"
          >
            <li
                v-for="(feature, i) in normalizeList(tm(plan.features))"
                :key="i"
                class="flex items-center gap-2"
            >
              <u-icon name="i-lucide-check" class="text-primary"/>
              <span>{{ rt(feature) }}</span>
            </li>
          </u-page-list>

          <u-button
              v-if="(tm(plan.features)?.length || 0) > 3"
              variant="link"
              color="primary"
              class="mt-2 px-0"
              @click="plan.expanded = !plan.expanded"
              :data-plan-index="index"
          >
            {{ plan.expanded ? t('pricing.actions.showLess') : t('pricing.actions.showMore') }}
          </u-button>
        </div>

        <u-separator class="my-4"/>

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

<style lang="scss">
.spoiler-list {
  position: relative;
  overflow: hidden;
  max-height: 85px;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 35px;
    border-radius: 5px;
    background: linear-gradient(to bottom, transparent, #0e0c15);
    transition: opacity .2s ease-out;
    opacity: 1;
    pointer-events: none;
  }
}

.spoiler_open {
  max-height: initial;

  &:after {
    content: none;
  }
}

.price-cards__switcher {
  padding: 13px 18px;
  border: 2px solid var(--ui-border);
  border-radius: 12px;
  display: flex;
  justify-content: space-between !important;
  align-items: center;
  max-width: 306px;
  margin: 0 auto;
  flex-wrap: wrap;
}

.price-cards__switcher-button {
  padding: 6px;
  font-size: 16px;
  line-height: 1.67;
  font-weight: 500;
  color: var(--color-white);
  align-items: center;
  justify-content: center;
  display: flex;
  border-radius: 4px;
  transition: all 0.3s ease;
  border: none;
  outline: none;
}

.price-cards__switcher-button-badge {
  margin-left: 10px;
  font-size: 12px;
  line-height: 1.3;
  border-radius: 3px;
  padding: 3px 4px;
  border: none;
  background: #85EA80;
  font-weight: normal;
  color: #000;
}

.price-cards__switcher-button_active {
  background: var(--color-gray);
  color: var(--color-white);
}

.price-cards__highlight {
  top: 0;
  right: 130px;
}
</style>