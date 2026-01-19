<script setup lang="ts">
import type {TabsItem} from "#ui/components/Tabs.vue";
import TextareaRequestForm from "~/components/TextareaRequestForm.vue";
import FeaturesCarousel from "~/components/FeaturesCarousel.vue";
import TabsWithUnderButtons from "~/components/TabsWithUnderButtons.vue";
import ImagesCarousel from "~/components/ImagesCarousel.vue";

const tabs: TabsItem[] = [
  {
    label: 'Audio',
    icon: 'i-lucide-volume-2',
    title: 'AI Audio Generation',
    text: 'Audio generating AI refers to artificial intelligence that creates sound from text or data.',
    list: [
      'Transformer Models',
      'Conditional Generative Models',
      'Pre-trained Models',
      'Variational Autoencoders'
    ],
    image: '/images/chat-export-audio.png'
  },
  {
    label: 'Code',
    icon: 'i-lucide-terminal',
    title: 'AI Code Generation',
    text: 'Generate clean, functional code from natural language prompts using advanced models.',
    list: [
      'Syntax-aware transformers',
      'Contextual completion',
      'Multi-language support',
      'Secure-by-default scaffolding'
    ],
    image: '/images/chat-export-code.png'
  },
  {
    label: 'Photo',
    icon: 'i-lucide-image',
    title: 'AI Photo Generation',
    text: 'Produce high-quality visuals from text prompts using generative diffusion models.',
    list: [
      'Stable Diffusion',
      'Style Transfer',
      'Inpainting & Outpainting',
      'Prompt-to-image pipelines'
    ],
    image: '/images/chat-export-photo.png'
  },
  {
    label: 'Video',
    icon: 'i-lucide-video',
    title: 'AI Video Generation',
    text: 'Create dynamic video content from scripts, storyboards, or voice input.',
    list: [
      'Scene synthesis',
      'Lip-syncing',
      'Motion interpolation',
      'Multi-modal rendering'
    ],
    image: '/images/chat-export-video.png'
  }
];

const cards = [
  {
    title: 'Ask anything',
    description: 'Lets users quickly find answers to their questions without having to search through multiple sources.',
    icon: '/svg/service-icon-01.svg'
  },
  {
    title: 'Connect everywhere',
    description: 'Lets users quickly find answers to their questions without having to search through multiple sources.',
    icon: '/svg/service-icon-02.svg'
  },
  {
    title: 'Fast responding',
    description: 'Lets users quickly find answers to their questions without having to search through multiple sources.',
    icon: '/svg/service-icon-03.svg'
  }
];

const tabs2 = [
  {
    label: 'Connect with AI',
    title: 'Connect with Al chatbot',
    description: 'Dentify the platform or interface through which you can access the chatbot. This could be a website, a messaging app, or a dedicated application.',
    headline: 'How it work',
    image: '/images/split-1.png'
  },
  {
    label: 'Streamline Workflow',
    title: 'Streamline Your Workflow',
    description: 'Discover tools and techniques to optimize your workflow, making your tasks more efficient and manageable.',
    headline: 'Exploring Efficiency',
    image: '/images/split-2.png'
  },
  {
    label: 'Cybersecurity',
    title: 'Protecting Your Digital Presence',
    description: 'Gain insights into cybersecurity measures and strategies to safeguard your online identity and sensitive information.',
    headline: 'Navigating Cybersecurity',
    image: '/images/split-3.png'
  },
  {
    label: 'Data Analysis',
    title: 'Demystifying Data Analytics',
    description: 'Learn the fundamentals of data analysis, including tools and methodologies, to extract meaningful insights from raw data.',
    headline: 'Mastering Data Analysis',
    image: '/images/split-4.png'
  }
];

const testimonials = [
  {
    name: 'Guy Hawkins',
    role: 'Nursing Assistant',
    quote: 'Pixcels-Themes has become such an integral part of our work! By putting our',
    avatar: '/images/brand-t.png',
    logo: '/logos/modx.svg',
    rating: 5
  }, {
    name: 'Guy Hawkins',
    role: 'Nursing Assistant',
    quote: 'Pixcels-Themes has become such an integral part of our work! By putting our',
    avatar: '/images/brand-t.png',
    logo: '/logos/modx.svg',
    rating: 5
  }, {
    name: 'Guy Hawkins',
    role: 'Nursing Assistant',
    quote: 'Pixcels-Themes has become such an integral part of our work! By putting our',
    avatar: '/images/brand-t.png',
    logo: '/logos/modx.svg',
    rating: 5
  }, {
    name: 'Guy Hawkins',
    role: 'Nursing Assistant',
    quote: 'Pixcels-Themes has become such an integral part of our work! By putting our',
    avatar: '/images/brand-t.png',
    logo: '/logos/modx.svg',
    rating: 5
  }, {
    name: 'Guy Hawkins',
    role: 'Nursing Assistant',
    quote: 'Pixcels-Themes has become such an integral part of our work! By putting our',
    avatar: '/images/brand-t.png',
    logo: '/logos/modx.svg',
    rating: 5
  },
];
</script>

<template>
  <u-page>
    <h1 class="font-bold text-7xl text-center max-w-[60%] mx-auto">Examine the Potential of
      <animated-rotated-x-text :texts-list="['AI Chating', 'AI Writing' ,'AI Chating', 'AI Writing']"/>
      AI Hack
    </h1>
    <page-header description="Unleash Brainwave's AI potential. Use the open AI conversation app Pixcels Themes"
                 descriptionSize="24"/>
    <u-page-body class="gap-16 grid">
      <textarea-request-form placeholder="Type something to promt AI..." button-text="Start with AI"/>
      <u-container class="max-w-6xl mx-auto admin-panel">
        <div class="admin-panel__image">
          <img src="/images/slider-main-image.png" class="w-full rounded-lg" alt="admin panel"/>
        </div>
      </u-container>
      <u-container class="flex items-center flex-col justify-center">
        <h3 class="text-2xl font-semibold text-center text-muted uppercase mb-8">Truest 800,000+ highly productive company</h3>
        <images-carousel :images="[
  '/images/spotify.png',
  '/images/woocommerce.png',
  '/images/slack.png',
  '/images/strapi.png',
  '/images/mapbox.png'
]"/>
      </u-container>
      <tabs-with-background :tabs="tabs" title="Generative AI made for creators."
                            headline="Rainbow unlocks the potential AI" :ui="{headline: 'gradient-text gradient-text_up'}"/>
      <features-carousel :cards="cards" button-text="Explore More →"/>
      <tabs-with-under-buttons class="bg-full" :tabs="tabs2" button-text="Try It Now →"/>
      <u-container class="flex flex-col justify-center">
        <page-header title="AI Chat app for seamless collaboration" headline="AI Collaboration"
                     titleClasses="max-w-[530px]"/>
        <custom-button class="m-auto justify-center h-16 w-48 text-lg mt-5">Try it now →</custom-button>
        <div class="relative logo-shadow">
          <div
              class="logo-shadow__logo absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-12 py-8 rounded-xl ring-2 ring-neutral-900">
            <img alt="AI Collaboration" src="/images/split-2-logo.png"
                 class=""/>
          </div>
          <img alt="AI Collaboration" src="/images/split-2-background.png"/>
        </div>
      </u-container>
      <u-container class="violet-block rounded-xl flex justify-between py-16 max-h-[265px]">
        <u-page-header
            class="border-none max-w-[590px] py-0"
            title="Join our aI Experts community"
            description="Meet and learn from 80+ creators & companies who share how thay use AI to create better content at lightning speed."
            :ui="{
              description: 'text-white'
            }"
        />
        <div class="flex items-center">
          <img src="/images/bg-shape-01.png" alt="Join our aI Experts community">
        </div>
        <u-container class="w-1/4 gap-6 flex flex-col">
          <img src="/images/team-01.png" alt="team on GitHub" class="flex-none mx-auto w-fit">
          <custom-button class="justify-center h-12 text-base" button-type="white">Join Now Today Free</custom-button>
        </u-container>
      </u-container>
      <u-container>
        <price-cards/>
      </u-container>
      <u-container class="flex gap-20">
        <feature-card
            image="service-icon-01.png"
            title="100% No-Risk, Money Back Guarantee!"
            description="Refunds will be issued within period of 14 days from the purchase date"
        />
        <feature-card
            image="service-icon-02.png"
            title="Upgrade or Cancel Anytime"
            description="Passages there are many variations of Lorem Ipsum available."
        />
        <feature-card
            image="service-icon-03.png"
            title="Not sure yet? Try the free version"
            description="Refunds will be issued within period of 14 days from the purchase date"
        />
      </u-container>
      <testimonial-carousel headline="Assisting Individuals" title="The opinions of the community"
                            :testimonials="testimonials"/>
      <review-logos
          title="Based on 20,000+ reviews on"
          :logos="[
    { src: '/images/brand-01.png', alt: 'G2 Crowd' },
    { src: '/images/brand-02.png', alt: 'Capterra' },
    { src: '/images/brand-03.png', alt: 'GetApp' },
    { src: '/images/brand-04.png', alt: 'TrustRadius' }
  ]"/>
      <app-download-promo headline="Get Started With Pixcels" title="Experience Products in AI
" description="Based on the conversation with the AI chatbot, you will receive
personalized recommendations."/>
    </u-page-body>
  </u-page>
</template>

<style scoped lang="scss">
.violet-block {
  padding: 68px 80px 60px;
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
  max-width: 1210px;
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
}
</style>