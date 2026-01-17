<script setup lang="ts">
import type {TabsItem} from "#ui/components/Tabs.vue";
import TextareaRequestForm from "~/components/TextareaRequestForm.vue";
import FeaturesCarousel from "~/components/FeaturesCarousel.vue";
import TabsWithUnderButtons from "~/components/TabsWithUnderButtons.vue";

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
    description: 'Quickly find answers without searching multiple sources.',
    icon: 'i-lucide-message-square'
  },
  {
    title: 'Connect everywhere',
    description: 'Access AI from any device or platform.',
    icon: 'i-lucide-bar-chart-3'
  },
  {
    title: 'Fast responding',
    description: 'Get instant replies powered by smart models.',
    icon: 'i-lucide-zap'
  }
];

const tabs2 = [
  {
    label: '01 Connect with AI',
    title: 'Connect with AI',
    description: 'Identify the platform or interface through which you can access the chatbot.',
    image: '/images/split-1.png'
  },
  {
    label: '02 Streamline Workflow',
    title: 'Streamline Workflow',
    description: 'Automate repetitive tasks and boost productivity with AI-powered tools.',
    image: '/images/split-2.png'
  },
  {
    label: '03 Cybersecurity',
    title: 'Cybersecurity',
    description: 'Protect your data and systems with intelligent threat detection.',
    image: '/images/split-3.png'
  },
  {
    label: '04 Data Analysis',
    title: 'Data Analysis',
    description: 'Extract insights from complex datasets using AI-driven analytics.',
    image: '/images/split-4.png'
  }
];
</script>

<template>
  <u-page>
    <h1 class="font-bold text-7xl text-center">Examine the Potential of
      <animated-rotated-x-text :texts-list="['AI Chating', 'AI Writing' ,'AI Chating', 'AI Writing']"/>
      AI Hack
    </h1>
    <u-page-header description="Unleash Brainwave's AI potential. Use the open AI conversation app Pixcels Themes" class="text-center m-auto"/>
    <u-page-body class="gap-16 grid">
      <textarea-request-form placeholder="Type something to promt AI..." button-text="Start with AI" />
      <u-container class="max-w-6xl mx-auto">
        <img src="/images/slider-main-image.png" class="w-full rounded-lg" alt="admin panel"/>
      </u-container>
      <u-container class="flex items-center justify-center">
        <p class="text-2xl font-semibold text-center text-muted uppercase">Truest 800,000+ highly productive company</p>
      </u-container>
      <tabs-with-background :tabs="tabs" title="Generative AI made for creators." headline="Rainbow unlocks the potential AI" />
      <features-carousel :cards="cards" button-text="Explore More →" />
      <tabs-with-under-buttons :tabs="tabs2" button-text="Try It Now →" />
      <u-container class="flex flex-col justify-center">
        <u-page-header title="AI Chat app for seamless collaboration" headline="AI Collaboration" class="border-0"
                       :ui="{title: 'mx-auto', headline: 'justify-center'}"/>
        <u-button class=" m-auto justify-center h-16 w-48 text-lg">Try it now →</u-button>
        <div class="relative">
          <img alt="AI Collaboration" src="/images/split-2-logo.png"
               class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-12 py-8 rounded-xl shadow-2xl/30 shadow-purple-500 ring-2 ring-neutral-900"/>
          <img alt="AI Collaboration" src="/images/split-2-background.png"/>
        </div>
      </u-container>
      <u-container class="bg-violet-500 rounded-xl flex justify-between px-20 py-16">
        <u-page-header
            class="border-none w-5/12"
            title="Join our aI Experts community"
            description="Meet and learn from 80+ creators & companies who share how thay use AI to create better content at lightning speed."/>
        <div>
          <img src="/images/bg-shape-01.png" alt="Join our aI Experts community">
        </div>
        <u-container class="w-1/4 gap-6 flex flex-col">
          <img src="/images/team-01.png" alt="team on GitHub" class="flex-none mx-auto w-fit">
          <u-button class="justify-center text-black bg-white hover:bg-primary hover:text-white h-12 text-base">Join Now Today Free</u-button>
        </u-container>
      </u-container>
      <u-container>
        <price-cards/>
      </u-container>
      <u-container class="flex gap-20">
          <feature-card
              icon="i-lucide-dollar-sign"
              title="100% No-Risk, Money Back Guarantee!"
              description="Refunds will be issued within period of 14 days from the purchase date"
          />
          <feature-card
              icon="i-lucide-user"
              title="Upgrade or Cancel Anytime"
              description="Passages there are many variations of Lorem Ipsum available."
          />
          <feature-card
              icon="i-lucide-heart"
              title="Not sure yet? Try the free version"
              description="Refunds will be issued within period of 14 days from the purchase date"
          />
      </u-container>
    </u-page-body>
  </u-page>
</template>

<style lang="scss">


</style>