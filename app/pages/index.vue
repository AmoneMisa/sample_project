<script setup lang="ts">
import type {TabsItem} from "#ui/components/Tabs.vue";

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

const tabLine = useTemplateRef('tabLineElement');
const currentTabIndex = ref(0);

function moveTabLine(index: number) {
  tabLine.value.style.left = `${(100 / tabs.length) * index}%`;
}

</script>

<template>
  <u-page>
    <u-page-header title="Examine the Potential of
AI Chating AI WritingAI Chating AI Hack" description="Unleash Brainwave's AI potential. Use the open AI
conversation app Pixcels Themes" class="text-center m-auto"/>
    <u-page-body class="gap-16 grid">
      <u-form class="flex justify-center flex-col items-center gap-3 m-auto bg-accented p-3.5 w-96 rounded-md">
        <u-form-field>
          <u-textarea :rows="4" placeholder="Type something to promt AI..." size="xl" :required="true"
                      :autoresize="false" class="w-80"/>
        </u-form-field>
        <u-separator/>
        <u-form-field class="w-80">
          <u-button class="w-full justify-center">Start with AI</u-button>
        </u-form-field>
      </u-form>
      <u-container class="max-w-6xl mx-auto">
        <img src="/images/slider-main-image.png" class="w-full rounded-lg" alt="admin panel"/>
      </u-container>
      <u-container class="flex items-center justify-center">
        <p class="text-2xl font-semibold text-center text-muted">TRUEST 800,000+ HIGHLY PRODUCTIVE COMPANY</p>
      </u-container>
      <u-container class="grid grid-cols-1 gap-12 py-16">
        <div class="space-y-8">
          <div class="space-y-2 text-center lg:text-left">
            <p class="text-2xl font-semibold text-muted text-center">RAINBOW UNLOCKS THE POTENTIAL ai</p>
            <h2 class="text-3xl font-bold text-center">Generative AI made for creators.</h2>
          </div>
          <div ref="tabLineElement"
               class="relative h-2 w-1/4 bg-primary pointer-events-none transition-transform top-20 rounded-sm"/>
          <u-tabs :items="tabs" @update:modelValue="moveTabLine" v-model="currentTabIndex">
            <template #content="{ item }">
              <div class="relative rounded-t-xl border-t-4 border-l-1 border-r-1 border-b-0 bg-muted/5 shadow-sm">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                  <div class="space-y-4">
                    <h2 class="text-2xl font-bold text-primary">{{ item.title }}</h2>
                    <p class="text-muted text-base">{{ item.text }}</p>
                    <u-page-list class="list-disc list-inside text-muted space-y-1">
                      <li v-for="li in item.list" :key="li">{{ li }}</li>
                    </u-page-list>
                    <u-button size="xl" color="primary">Start Exploring Now →</u-button>
                  </div>
                  <div>
                    <img
                        :src="item.image"
                        :alt="item.title"
                        class="w-full rounded-xl shadow-lg transition-all duration-300 min-h-96"
                    />
                  </div>
                </div>
              </div>
            </template>
          </u-tabs>
        </div>
      </u-container>
      <u-carousel :items="cards" v-slot="{ item }" loop dots arrows class="max-w-6xl mx-auto">
        <div
            class="relative bg-muted/5 border border-primary/30 rounded-t-xl rounded-b-none p-6 shadow-md overflow-hidden transition-colors duration-300 hover:border-primary"
        >
          <div
              class="absolute inset-0 pointer-events-none rounded-t-xl border-2 border-primary opacity-30 group-hover:opacity-100 transition-opacity duration-300"/>
          <div
              class="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-4 z-10 relative">
            <u-icon :name="item.icon" class="text-xl"/>
          </div>
          <div class="z-10 relative space-y-2">
            <h3 class="text-xl font-bold text-white">{{ item.title }}</h3>
            <p class="text-muted">{{ item.description }}</p>
            <u-button variant="link" color="primary">Explore More →</u-button>
          </div>
        </div>
      </u-carousel>
      <u-tabs :items="tabs2" class="flex flex-col-reverse gap-6">
        <template #content="{ item }">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div class="space-y-4">
              <h2 class="text-3xl font-bold text-white">{{ item.title }}</h2>
              <p class="text-muted text-lg">{{ item.description }}</p>
              <u-button color="primary">Try It Now →</u-button>
            </div>

            <div>
              <img :src="item.image" :alt="item.title" class="w-full max-w-md mx-auto"/>
            </div>
          </div>
        </template>
      </u-tabs>
      <u-container>
        <u-page-header title="AI Chat app for seamless collaboration" headline="AI Collaboration"
                       :ui="{title: 'mx-auto', headline: 'justify-center'}"/>
        <u-button>Try it now →</u-button>
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
          <img src="/images/team-01.png" alt="team on GitHub" class="flex-none">
          <u-button class="justify-center">Join Now Today Free</u-button>
        </u-container>
      </u-container>
      <u-container>
        <price-cards />
      </u-container>

    </u-page-body>
  </u-page>
</template>

<style scoped>

</style>