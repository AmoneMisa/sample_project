<script setup lang="ts">
const isYearly = ref(true);

const plans = ref([
  {
    name: 'Basic',
    description: 'For large teams & corporations',
    monthly: 'Free',
    yearly: 'Free',
    features: [
      '7,700 3–5 day turnaround',
      '6+ Naive development',
      '5+ Task delivered one-by-one',
      'AI Blog Updates via dashboard & slack',
      'Advance Updates via dashboard & slack'
    ],
    highlight: false,
    expanded: false
  },
  {
    name: 'Premium',
    description: 'For large teams & corporations',
    monthly: '$59.00 /Per Month',
    yearly: '$499.00 /Per Year',
    features: [
      '12,700 7–9 day turnaround',
      '6+ Naive development',
      '5+ Task delivered one-by-one',
      '7,700 3–5 day turnaround',
      'AI Blog Updates via dashboard & slack',
      'Advance Updates via dashboard & slack'
    ],
    highlight: true,
    expanded: true
  },
  {
    name: 'Enterprise',
    description: 'For large teams & corporations',
    monthly: '$79.00 /Per Month',
    yearly: '$599.00 /Per Year',
    features: [
      '15,700 15–30 day turnaround',
      '6+ Naive development',
      '5+ Task delivered one-by-one',
      '7,700 3–5 day turnaround',
      '6+ Naive development'
    ],
    highlight: false,
    expanded: false
  }
]);
</script>

<template>
  <u-container class="py-20 space-y-12">
    <div class="text-center space-y-3">
      <u-page-header title="Pricing plans for everyone" headline="pricing" class="border-0"
                     :ui="{title: 'mx-auto', headline: 'justify-center gradient-text text-md'}"/>

      <div class="inline-flex items-center gap-3 bg-muted/10 px-4 py-2 rounded-full text-sm">
        <span :class="isYearly ? 'text-muted' : 'text-primary font-semibold'">
          Monthly
        </span>

        <u-switch
            v-model="isYearly"
            :value="'yearly'"
            :unchecked-value="'monthly'"
        />

        <span :class="isYearly ? 'text-muted' : 'text-primary font-semibold'">
          Yearly <span class="text-primary">–10%</span>
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <u-card
            v-for="(plan, index) in plans"
            :key="plan.name"
            :ui="{
          root: 'flex flex-col p-6 folder-figure-holder ring-0 rounded-md bg-transparent',
          body: 'folder-figure-inner flex flex-col h-full'
        }"
        >
          <div v-if="plan.highlight" class="flex justify-center mb-2">
            <u-badge color="primary" variant="solid">Best Offer</u-badge>
          </div>

          <div class="text-center space-y-1">
            <h3 class="text-xl font-bold">{{ plan.name }}</h3>
            <p class="text-muted text-sm">{{ plan.description }}</p>
            <p class="text-2xl font-semibold text-primary">
              {{ isYearly ? plan.yearly : plan.monthly }}
            </p>
          </div>

          <u-separator class="my-4"/>

          <div class="flex-1">
            <p class="font-semibold text-muted mb-2">Features</p>

            <u-page-list class="space-y-1 text-sm text-muted spoiler-list" :class="{'spoiler_open': plan.expanded}"
                         :items="plan.features"
                         :data-plan-index="index">
              <li
                  v-for="feature in plan.features"
                  :key="feature"
                  class="flex items-center gap-2"
              >
                <u-icon name="i-lucide-check" class="text-primary"/>
                <span>{{ feature }}</span>
              </li>
            </u-page-list>

            <u-button
                v-if="plan.features.length > 3"
                variant="link"
                color="primary"
                class="mt-2 px-0"
                @click="plan.expanded = !plan.expanded"
                :data-plan-index="index"
            >
              {{ plan.expanded ? 'Show Less' : 'Show More' }}
            </u-button>
          </div>

          <u-separator class="my-4"/>

          <div class="flex flex-col items-center gap-2">
            <u-button color="primary" class="w-full justify-center">Get Started</u-button>
            <span class="text-xs text-muted">Limited Offer</span>
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
</style>