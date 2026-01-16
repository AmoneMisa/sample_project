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

const activeTab = ref(tabs[0].label);

const currentTab = computed(() => tabs.find(t => t.label === activeTab.value));
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
        <img src="/images/admin-panel.jpg" class="w-full rounded-lg" alt="admin panel"/>
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
          <u-tabs class="flex flex-wrap gap-4" :items="tabs">
            <template #content="{ item }">
              <div class="relative rounded-xl border bg-muted/5 shadow-sm overflow-hidden">
                <div class="h-2 w-full bg-primary"/>
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

    </u-page-body>
  </u-page>
</template>

<style scoped>

</style>