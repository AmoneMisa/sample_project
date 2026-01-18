<script setup lang="ts">
const props = defineProps({
  tabs: {
    type: Array,
    default: [],
    required: true
  },
  title: {
    type: String,
    default: ""
  },
  headline: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
});

const tabLine = useTemplateRef('tabLineElement');

function moveTabLine(index: number) {
  tabLine.value.style.left = `${(100 / props.tabs.length) * index}%`;
}
</script>

<template>
  <u-container class="grid grid-cols-1 gap-12 py-16">
    <div class="relative">
      <u-page-header :title="title" :headline="headline" :description="description" class="border-0 mb-0"
                     :ui="{title: 'mx-auto', headline: 'justify-center gradient-text text-md'}"/>
      <div class="p-1 absolute w-full">
        <div ref="tabLineElement"
             class="relative h-2 w-1/4 bg-primary pointer-events-none transition-transform rounded-sm m-0 tab-control-line"/>
      </div>
      <u-tabs :items="tabs" @update:modelValue="moveTabLine" :ui="{
              slots: {
                list: 'gap-12'
              }
          }">
        <template #content="{ item }">
          <div class="relative custom-border p-0.5">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-zinc-900 rounded-3xl">
              <div class="space-y-4">
                <h2 class="text-2xl font-bold text-primary">{{ item.title }}</h2>
                <p class="text-muted text-base">{{ item.text }}</p>
                <u-page-list class="list-disc list-inside text-muted space-y-1">
                  <li v-for="li in item.list" :key="li">{{ li }}</li>
                </u-page-list>
                <custom-button>Start Exploring Now →</custom-button>
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
</template>

<style scoped lang="scss">
.tab-control-line {
  transition: left .2s ease;
  top: 40px;
}
</style>