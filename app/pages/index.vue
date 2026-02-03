<script setup lang="ts">
import type {TabsItem} from "#ui/components/Tabs.vue";
import TextareaRequestForm from "~/components/common/TextareaRequestForm.vue";
import FeaturesCarousel from "~/components/FeaturesCarousel.vue";
import TabsWithUnderButtons from "~/components/TabsWithUnderButtons.vue";
import ImagesCarousel from "~/components/ImagesCarousel.vue";
import {safeFetch} from "~/utils/safeFetch";
import type TestimonialInterface from "~/interfaces/TestimonialInterface";
import type FeatureCardInterface from "~/interfaces/FeatureCardInterface";
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import type {FeatureCardType} from "~/types/FeatureCardType";

const {t} = useI18n();
const tabs: TabsItem[] = [
  {
    label: 'tabs.audio.label',
    icon: 'i-lucide-volume-2',
    title: 'tabs.audio.title',
    text: 'tabs.audio.text',
    list: 'tabs.audio.features',
    image: '/images/chat-export-audio.png'
  },
  {
    label: 'tabs.code.label',
    icon: 'i-lucide-terminal',
    title: 'tabs.code.title',
    text: 'tabs.code.text',
    list: 'tabs.code.features',
    image: '/images/chat-export-code.png'
  },
  {
    label: 'tabs.photo.label',
    icon: 'i-lucide-image',
    title: 'tabs.photo.title',
    text: 'tabs.photo.text',
    list: 'tabs.photo.features',
    image: '/images/chat-export-photo.png'
  },
  {
    label: 'tabs.video.label',
    icon: 'i-lucide-video',
    title: 'tabs.video.title',
    text: 'tabs.video.text',
    list: 'tabs.video.features',
    image: '/images/chat-export-video.png'
  }
];

const cards = [
  {
    title: 'cards.ask.title',
    description: 'cards.ask.description',
    icon: '/svg/service-icon-01.svg'
  },
  {
    title: 'cards.connect.title',
    description: 'cards.connect.description',
    icon: '/svg/service-icon-02.svg'
  },
  {
    title: 'cards.fast.title',
    description: 'cards.fast.description',
    icon: '/svg/service-icon-03.svg'
  }
];

const tabs2 = [
  {
    label: 'tabs2.connect.label',
    title: 'tabs2.connect.title',
    description: 'tabs2.connect.description',
    headline: 'tabs2.connect.headline',
    image: '/images/split-1.png'
  },
  {
    label: 'tabs2.workflow.label',
    title: 'tabs2.workflow.title',
    description: 'tabs2.workflow.description',
    headline: 'tabs2.workflow.headline',
    image: '/images/split-2.png'
  },
  {
    label: 'tabs2.cyber.label',
    title: 'tabs2.cyber.title',
    description: 'tabs2.cyber.description',
    headline: 'tabs2.cyber.headline',
    image: '/images/split-3.png'
  },
  {
    label: 'tabs2.data.label',
    title: 'tabs2.data.title',
    description: 'tabs2.data.description',
    headline: 'tabs2.data.headline',
    image: '/images/split-4.png'
  }
];

const config = useRuntimeConfig();

const {data: featureCards} = await safeFetch<FeatureCardInterface[]>(
    `${config.public.apiBase}/feature-cards`
);

const {data: testimonials, pending, error} = await useAsyncData<TestimonialInterface[]>(
    "testimonials",
    () => $fetch(`${config.public.apiBase}/testimonials`)
);
</script>

<template>
  <u-page>
    <h1 class="
    page-main-header
    mx-auto
    max-w-[22ch]
    text-center
    font-bold
    tracking-tight
    leading-[0.95]
    text-[clamp(2.25rem,5vw,3.5rem)]"
    >
      <span class="block text-white/90">{{ t('hero.title') }}</span>
      <span class="mt-2 block">
    <animated-rotated-x-text
        class="align-baseline"
        :texts-list="['AI Chating', 'AI Writing', 'AI Chating', 'AI Writing']"
    />
  </span>
      <span class="mt-2 block text-white/90">{{ t('hero.title2') }}</span>
    </h1>
    <page-header description="hero.subtitle"
                 descriptionSize="24"/>
    <u-page-body class="gap-16 flex flex-col justify-center">
      <textarea-request-form
          :placeholder="t('form.placeholder')"
          :button-text="t('form.button')"
      />
      <u-container class="max-w-6xl mx-auto admin-panel">
        <div class="admin-panel__image">
          <img src="/images/slider-main-image.png" class="w-full rounded-lg" alt="admin panel"/>
        </div>
      </u-container>
      <u-container class="flex items-center flex-col justify-center min-w-0">
        <h3 class="text-2xl font-semibold text-center text-muted uppercase mb-8">{{ t('trust.title') }}</h3>
        <images-carousel :images="[
  '/images/spotify.png',
  '/images/woocommerce.png',
  '/images/slack.png',
  '/images/strapi.png',
  '/images/mapbox.png'
]"/>
      </u-container>
      <tabs-with-background :tabs="tabs" title="page.tabsWithBackground.title"
                            headline="page.tabsWithBackground.headline"
                            :ui="{headline: 'gradient-text gradient-text_up'}"/>
      <features-carousel :cards="cards" button-text="page.featuresCarousel.button"/>
      <tabs-with-under-buttons class="bg-full" :tabs="tabs2" button-text="page.tabsWithUnderButtons.button"/>
      <u-container class="flex flex-col justify-center">
        <page-header
            title="page.collaboration.title"
            headline="page.collaboration.headline"
            titleClasses="max-w-[530px]"
        />
        <custom-button class="m-auto justify-center h-16 w-48 text-lg mt-5">{{
            t('page.collaboration.cta')
          }}
        </custom-button>
        <div class="relative logo-shadow">
          <div
              class="logo-shadow__logo absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-12 py-8 rounded-xl ring-2 ring-neutral-900">
            <img alt="AI Collaboration" src="/images/split-2-logo.png"
                 class=""/>
          </div>
          <img alt="AI Collaboration" src="/images/split-2-background.png"/>
        </div>
      </u-container>

      <u-container
          class="violet-block rounded-xl flex flex-col lg:flex-row justify-between py-10 lg:py-16 gap-8 lg:gap-0 max-h-none lg:max-h-[265px]">
        <page-header class="border-none max-w-full lg:max-w-[590px] py-0"
                     title="page.community.title"
                     description="page.community.description"
                     :ui="{
              description: 'text-white'
            }"/>
        <div class="items-center justify-center lg:justify-start hidden lg:flex">
          <img src="/images/bg-shape-01.png" :alt="t('page.community.title')">
        </div>
        <u-container class="w-full lg:w-1/4 gap-6 flex flex-col items-center lg:items-start">
          <img src="/images/team-01.png" alt="team on GitHub" class="flex-none mx-auto w-fit">
          <custom-button class="justify-center h-12 text-base w-max" button-type="white">
            {{ t('page.community.cta') }}
          </custom-button>
        </u-container>
      </u-container>

      <u-container>
        <price-cards/>
      </u-container>
      <u-container class="flex flex-col lg:flex-row gap-8 lg:gap-20">
        <service-cards-grid :cards="(featureCards || []).filter((featureCard) => featureCard.isVisible)" />
      </u-container>
      <testimonial-carousel v-if="!pending" headline="testimonials.headline" title="testimonials.title"
                            :testimonials="(testimonials || []).filter((testimonial) => testimonial.isVisible)"
      />
      <review-logos
          title="page.reviewLogos.title"
          :logos="[
    { src: '/images/brand-01.png', alt: 'G2 Crowd' },
    { src: '/images/brand-02.png', alt: 'Capterra' },
    { src: '/images/brand-03.png', alt: 'GetApp' },
    { src: '/images/brand-04.png', alt: 'TrustRadius' }
  ]"/>
      <app-download-promo headline="download.headline" title="download.title
" description="download.description"/>
    </u-page-body>
  </u-page>
</template>

<style scoped lang="scss">
.violet-block {
  padding: 50px 80px 60px;
  background-color: var(--color-primary);
}

.logo-shadow {
  &:before {
    content: "";
    background: linear-gradient(133deg, #ADFA4B 1.34%, #9872EA 1.35%, #4D72F5 76.16%, #FA11FF 105.35%);
    filter: blur(32.5px);
    background-size: 400%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    margin: auto;
    z-index: -2;
    width: 240px;
    height: 240px;
    border-radius: 24px;
    animation: styles_moving-gradient 16s linear infinite;
  }
}

.logo-shadow__logo {
  background-color: var(--background-color);
}

.admin-panel {
  padding-right: calc(1.5rem * .5);
  padding-left: calc(1.5rem * .5);
  margin-top: 0;
}

.admin-panel__image {
  background-size: contain;
  background: url('/images/slider-main-bg.png') no-repeat top center;
  padding: 70px 70px 42px;
  position: relative;
  z-index: 3;
  margin-top: 60px;
  overflow: hidden;
  border-radius: 12px;
  max-width: 100%;
  background-size: cover;

  &:before {
    content: "";
    position: absolute;
    height: 100%;
    width: 100%;
    top: -40%;
    left: 50%;
    transform: translateX(-50%);
    background: url('/images/main-banner-bg-shape.png');
    z-index: -5;
  }

  @media (max-width: 1024px) {
    padding: 30px 30px 12px;
  }
}
</style>