<script setup lang="ts">
import TextareaRequestForm from "~/components/common/TextareaRequestForm.vue";
import FeaturesCarousel from "~/components/FeaturesCarousel.vue";
import TabsWithUnderButtons from "~/components/TabsWithUnderButtons.vue";
import ImagesCarousel from "~/components/ImagesCarousel.vue";
import {safeFetch} from "~/utils/safeFetch";
import type TestimonialInterface from "~/interfaces/TestimonialInterface";
import type FeatureCardInterface from "~/interfaces/FeatureCardInterface";
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import type {TabsResponse} from "~/interfaces/TabsInterface";

const {t} = useI18n();
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
const config = useRuntimeConfig();

const {data: featureCards} = await safeFetch<FeatureCardInterface[]>(
    `${config.public.apiBase}/feature-cards`
);

const {data: testimonials, pending, error} = await useAsyncData<TestimonialInterface[]>(
    "testimonials",
    () => $fetch(`${config.public.apiBase}/testimonials`)
);

const {data: tabs} = await useAsyncData<TabsResponse>(
    "tabsWithBackground",
    () => $fetch<TabsResponse>(`${config.public.apiBase}/tabs`)
);

interface AnimatedTextItem {
  id: string;
  titleKey: string;
  isVisible: boolean;
  order: number;
}

const { data: animatedText } = await useAsyncData<AnimatedTextItem[]>(
    "animatedText",
    () => $fetch<AnimatedTextItem[]>(`${config.public.apiBase}/animated-text`)
);

console.log("animatedText", animatedText);
const withBackgroundTabs = computed(() => tabs.value?.withBackground ?? []);
const underbuttonTabs = computed(() => tabs.value?.underbutton ?? []);
</script>

<template>
  <u-page :ui="{center: 'flex flex-col gap-[28px] lg:gap-[32px] xl:gap-[40px] py-12'}">
    <div>
      <h1 class="page-main-header mx-auto max-w-[22ch] text-center font-bold tracking-tight leading-[0.95] text-[clamp(2.25rem,5vw,3.5rem)]">
        <span class="block dark:text-white/90 text-[var(--ui-text)]/90">{{ t('hero.title') }}</span>
        <span class="mt-2 block">
            <animated-rotated-x-text v-if="animatedText && animatedText?.length" class="align-baseline"
                                     :texts-list="animatedText"/>
        </span>
        <span class="mt-2 block dark:text-white/90 text-[var(--ui-text)]/90">{{ t('hero.title2') }}</span>
      </h1>
      <page-header description="hero.subtitle" descriptionSize="24" class="mt-2"/>
    </div>
    <u-page-body class="mt-4 pb-0 gap-16 flex flex-col justify-center">
      <textarea-request-form
          :placeholder="t('form.placeholder')"
          :button-text="t('form.button')"
      />
      <u-container class="max-w-6xl mx-auto admin-panel">
        <div class="admin-panel__image">
          <img src="/images/slider-main-image.png" class="w-full rounded-lg" alt="admin panel"/>
        </div>
      </u-container>
      <u-container class="flex items-center flex-col justify-center min-w-0 mb-0">
        <h3 class="text-2xl font-semibold text-center text-muted uppercase mb-8">{{ t('trust.title') }}</h3>
        <images-carousel :images="[
            '/images/intellij.png',
            '/images/restapi.png',
            '/images/jira.png',
            '/images/docker.png',
            '/images/jenkins.png',
            '/images/github.png',
            '/images/cicd.png',
            '/images/gitlab.png',
            '/images/confluence.png'
        ]"/>
      </u-container>
      <tabs-with-background :tabs="withBackgroundTabs" title="page.tabsWithBackground.title"
                            headline="page.tabsWithBackground.headline"/>
      <features-carousel :cards="cards" button-text="page.featuresCarousel.button"/>
      <tabs-with-under-buttons class="bg-full" :tabs="underbuttonTabs"/>
      <u-container class="flex flex-col justify-center">
        <page-header
            title="page.collaboration.title"
            headline="page.collaboration.headline"
            titleClasses="max-w-[530px]"
        />
        <custom-button class="m-auto justify-center h-16 w-48 text-lg mt-5" variant="full">{{
            t('page.collaboration.cta')
          }}
        </custom-button>
        <div class="relative logo-shadow">
          <div
              class="logo-shadow__logo absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-12 py-8 rounded-xl ring-2 dark:ring-neutral-900 ring-[#d1d1ff] max-w-[330px]">
            <img alt="AI Collaboration" src="/images/letter-logo.png"
                 class=""/>
          </div>
          <img alt="AI Collaboration" src="/images/split-2-background.png"/>
        </div>
      </u-container>

      <u-container
          class="violet-block rounded-xl flex flex-col lg:flex-row justify-between py-10 lg:py-16 gap-8 lg:gap-0 max-h-none lg:max-h-[265px] mb-0">
        <page-header class="border-none max-w-full lg:max-w-[590px] py-0"
                     title="page.community.title"
                     description="page.community.description"
                     :ui="{
              description: 'text-white'
            }"/>
        <div class="items-center justify-center lg:justify-start hidden lg:flex">
          <img src="/images/bg-shape-01.png" :alt="t('page.community.title')">
        </div>
        <u-container class="w-full lg:w-1/4 gap-6 flex flex-col items-center lg:items-start justify-center">
          <img src="/images/myself.png" alt="team on GitHub" class="flex-none mx-auto w-[120px]">
          <a href="https://github.com/AmoneMisa" target="_blank" rel="noopener noreferrer">
            <custom-button class="justify-center h-12 text-base w-max" button-type="white">
              {{ t('page.community.cta') }}
            </custom-button>
          </a>
        </u-container>
      </u-container>

      <u-container class="mb-0">
        <price-cards/>
      </u-container>
      <u-container class="mb-0 flex flex-col lg:flex-row gap-8 lg:gap-20">
        <service-cards-grid :cards="(featureCards || []).filter((featureCard) => featureCard.isVisible)"/>
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
    width: 320px;
    height: 320px;
    border-radius: 24px;
    animation: styles_moving-gradient 16s linear infinite;

    @media screen and (max-width: 768px) {
      width: 260px;
      height: 260px;
    }

    @media screen and (max-width: 420px) {
      width: 240px;
      height: 240px;
    }
  }
}

.logo-shadow__logo {
  background-color: var(--background-color);
}

.admin-panel {
  padding-right: calc(1.5rem * .5);
  padding-left: calc(1.5rem * .5);
  margin-top: 0;
  margin-bottom: 0;
}

.admin-panel__image {
  background-size: contain;
  background: url('/images/slider-main-bg.png') no-repeat top center;
  padding: 70px 70px 42px;
  position: relative;
  z-index: 3;
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