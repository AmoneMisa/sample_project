<script setup lang="ts">
import type {TabsItem} from "#ui/components/Tabs.vue";

const props = defineProps<{
  tabs: TabsItem[]
  title?: string
  headline?: string
  description?: string
  ctaKey?: string
}>();

const tabLine = useTemplateRef('tabLineElement');
const {t, tm, rt} = useI18n();

function moveTabLine(index: number) {
  const triggers = document.querySelectorAll('.tabs__trigger');
  const active = triggers[index] as HTMLElement;

  if (!active || !tabLine.value) return;

  const gap = 10;
  const lineHalf = 80 / 2;

  const tabLeft = active.offsetLeft + index * gap;
  const tabCenter = tabLeft + active.offsetWidth / 2;

  tabLine.value.style.left = `${tabCenter - lineHalf}px`;
}

function resolveList(list?: TabsItem['list']): string[] {
  if (!list) return [];

  if (typeof list === 'string') {
    const raw = tm(list) as unknown
    if (Array.isArray(raw)) return raw.map((x) => (typeof x === 'string' ? x : rt(x)));
    return [];
  }

  return list.map((x) => (typeof x === 'string' ? t(x) : String(x)));
}

onMounted(() => {
  moveTabLine(0);
})
</script>

<template>
  <u-container class="grid grid-cols-1 gap-12 py-16 tabs max-w-full">
    <div class="relative">
      <page-header :title="title" :headline="headline" :description="description" :isCentered="true" class="mb-16"/>
      <div class="p-1 absolute w-full">
        <div ref="tabLineElement"
             class="relative h-2 w-1/4 bg-primary pointer-events-none transition-transform rounded-sm m-0 tabs__control-line"/>
      </div>
      <u-tabs
          :items="tabs"
          @update:modelValue="moveTabLine"
          :ui="{
            trigger: 'tabs__trigger ',
            list: 'tabs__list bg-transparent',
            indicator: 'bg-transparent'
          }"
      >
        <template #default="{ item }">
          {{ t(item.label) }}
        </template>
        <template #content="{ item }">
          <div class="relative custom-border p-0.5">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 bg-zinc-900 rounded-3xl fade-on-switch">
              <div class="space-y-4">
                <h2 class="text-white text-3xl sm:text-4xl lg:text-5xl">{{t(item.title) }}</h2>
                <u-page-list v-if="item.list" class="list-disc list-inside text-muted space-y-1">
                  <li v-for="(li, idx) in resolveList(item.list)" :key="idx">
                    {{ li }}
                  </li>
                </u-page-list>

                <custom-button>{{ t('tabs.audio.cta') }}</custom-button>
              </div>
              <div class="tabs-background__image">
                <img
                    :src="item.image"
                    :alt="t(item.title)"
                    class="rounded-xl shadow-lg transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </template>
      </u-tabs>
    </div>
  </u-container>
</template>

<style lang="scss">
.tabs__control-line {
  transition: left .2s ease;
  top: 60px;
  width: 100px;
}

.tabs__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border-radius: 100px;
  background: var(--color-dark);
  color: var(--color-white);
  border: none;
  cursor: pointer;
  transition: box-shadow 0.3s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: transparent;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
    transition: background .3s ease-in-out;
  }
}

.tabs__trigger[data-state="active"],
.tabs__trigger:hover {
  &:before {
    background: linear-gradient(
            to left,
            var(--color-primary-gradient-start),
            var(--color-primary-gradient-end)
    );
  }
}

.tabs-background__image {
  img {
    min-height: 400px;
    min-width: 400px;
  }
}


@media (max-width: 1024px) {
  .tabs__control-line {
    top: 52px;
  }

  .tabs__trigger {
    padding: 12px 24px;
  }

  .tabs-background__image {
    img {
      min-height: 320px;
      min-width: 320px;
    }
  }
}

@media (max-width: 640px) {
  .tabs__trigger {
    padding: 10px 18px;
  }

  .tabs-background__image {
    img {
      min-height: 240px;
      min-width: 240px;
      width: 100%;
    }
  }
}
</style>