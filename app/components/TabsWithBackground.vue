<script setup lang="ts">
import type {TabsItem} from '#ui/components/Tabs.vue';
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";

const props = defineProps<{
  tabs: TabsItem[]
  title?: string
  headline?: string
  description?: string
  ctaKey?: string
}>();

const {t, tm, rt} = useI18n();

const tabsScroll = useTemplateRef<HTMLElement>('tabsScroll');
const tabLine = useTemplateRef<HTMLElement>('tabLineElement');

const currentIndex = ref(0);

function moveTabLine(index: number) {
  const wrap = tabsScroll.value;
  const line = tabLine.value;
  if (!wrap || !line) return;

  const triggers = wrap.querySelectorAll<HTMLElement>('.tabs__trigger');
  const active = triggers[index]
  if (!active) return

  const center = active.offsetLeft + active.offsetWidth / 2;
  const w = 12;
  line.style.width = `${w}px`;
  line.style.transform = `translateX(${Math.round(center - w / 2)}px)`;
}

function ensureTabVisible(index: number) {
  const wrap = tabsScroll.value;
  if (!wrap) return;

  const triggers = wrap.querySelectorAll<HTMLElement>('.tabs__trigger');
  const active = triggers[index];
  if (!active) return;

  const left = active.offsetLeft;
  const right = left + active.offsetWidth;
  const viewLeft = wrap.scrollLeft;
  const viewRight = wrap.scrollLeft + wrap.clientWidth;

  if (left < viewLeft) {
    wrap.scrollTo({left: left - 16, behavior: 'smooth'});
  } else if (right > viewRight) {
    wrap.scrollTo({left: right - wrap.clientWidth + 16, behavior: 'smooth'});
  }
}

async function onTabChange(index: number) {
  currentIndex.value = index;
  await nextTick();

  moveTabLine(index);
  ensureTabVisible(index);
}

function resolveList(list?: TabsItem['list']): string[] {
  if (!list) return [];

  if (typeof list === 'string') {
    const raw = tm(list) as unknown;
    if (Array.isArray(raw)) return raw.map((x) => (typeof x === 'string' ? x : rt(x)));
    return []
  }

  return list.map((x) => (typeof x === 'string' ? t(x) : String(x)));
}

function handleResize() {
  nextTick(() => moveTabLine(currentIndex.value));
}

onMounted(async () => {
  await nextTick();
  moveTabLine(0);
  window.addEventListener('resize', handleResize, {passive: true});
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
})
</script>

<template>
  <u-container class="tabs-section max-w-6xl mx-auto py-14 sm:py-16">
    <page-header
        :title="title"
        :headline="headline"
        :description="description"
        :isCentered="true"
        class="mb-10 sm:mb-12"
    />
    <div class="tabs-row">
      <div ref="tabsScroll" class="tabs-scroll">
        <div class="tabs-head">
          <u-tabs
              :items="tabs"
              @update:modelValue="onTabChange"
              :ui="{ trigger: 'tabs__trigger', list: 'tabs__list', indicator: 'hidden' }"
          >
            <template #default="{ item }">
              {{ t(item.label) }}
            </template>

            <template #content="{ item }">
              <section class="tabs-card">
                <div class="tabs-card__inner">
                  <div class="tabs-card__content">
                    <h2 class="tabs-card__title">{{ t(item.title) }}</h2>

                    <u-page-list v-if="item.list" class="tabs-card__list">
                      <li v-for="(li, idx) in resolveList(item.list)" :key="idx">{{ li }}</li>
                    </u-page-list>

                    <custom-button class="tabs-card__cta">
                      {{ t(item.ctaKey ?? ctaKey ?? 'tabs.audio.cta') }}
                    </custom-button>
                  </div>

                  <div class="tabs-card__media">
                    <img
                        :src="item.image"
                        :alt="t(item.title)"
                        class="tabs-card__img"
                        decoding="async"
                        loading="eager"
                        fetchpriority="high"
                    />
                  </div>
                </div>
              </section>
            </template>
          </u-tabs>
          <div class="tabs-line-wrap">
            <div ref="tabLineElement" class="tabs-line"/>
          </div>
        </div>
      </div>
    </div>
  </u-container>
</template>

<style lang="scss">
.tabs-scroll {
  position: relative;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 8px;

  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tabs__list {
  display: inline-flex;
  gap: 10px;
  padding: 4px;
  border-radius: 999px;
  background: transparent;
  min-width: max-content;
}

.tabs__trigger {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(22, 24, 30, .75);
  color: rgba(255, 255, 255, .88);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04),
  inset 0 -10px 20px rgba(0, 0, 0, .25);
  transition: background .2s ease, color .2s ease, box-shadow .2s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: rgba(255, 255, 255, .06);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: .85;
    transition: opacity .2s ease, background .25s ease;
    pointer-events: none;
  }

  &:hover {
    background: rgba(22, 24, 30, .88);

    &::before {
      background: linear-gradient(
              90deg,
              var(--color-primary-gradient-start),
              var(--color-primary-gradient-end)
      );
      opacity: 1;
    }
  }

  &[data-state="active"] {
    color: rgba(255, 255, 255, .95);
    background: rgba(22, 24, 30, .92);

    &::before {
      background: linear-gradient(
              90deg,
              var(--color-primary-gradient-start),
              var(--color-primary-gradient-end)
      );
      opacity: 1;
    }
  }
}

.tabs-head {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tabs-line-wrap {
  position: relative;
  height: 16px;
  margin: 0;
  padding: 0 4px;
}

.tabs-line {
  position: absolute;
  left: 0;
  top: 2px;
  height: 12px;
  width: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
  box-shadow: 0 8px 20px rgba(128, 90, 245, .25);
  transform: translateX(0);
  transition: transform .22s ease;
  will-change: transform;
}

.tabs-card {
  margin-top: 18px;
  border-radius: 28px;
  padding: 2px;
  background: linear-gradient(
          180deg,
          rgba(255, 255, 255, .10),
          rgba(255, 255, 255, .03)
  );
}

.tabs-card__inner {
  border-radius: 26px;
  padding: 18px;
  background: radial-gradient(900px 380px at 15% 0%, rgba(128, 90, 245, .18), transparent 60%),
  radial-gradient(900px 380px at 85% 0%, rgba(205, 153, 255, .12), transparent 60%),
  rgba(14, 12, 21, .92);

  box-shadow: 0 20px 60px rgba(0, 0, 0, .45),
  inset 0 1px 0 rgba(255, 255, 255, .05);
}

.tabs-card__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.tabs-card__title {
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, .95);
  margin-bottom: 10px;
}

.tabs-card__list {
  margin-top: 12px;
  color: rgba(188, 195, 215, .92);
  line-height: 1.6;

  li {
    margin: 6px 0;
  }
}

.tabs-card__cta {
  margin-top: 16px;
  width: fit-content;
}

.tabs-card__media {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .06);
  aspect-ratio: 16 / 10;
}

.tabs-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (min-width: 1024px) {
  .tabs-card__inner {
    grid-template-columns: 1.05fr 1fr;
    align-items: center;
    gap: 22px;
    padding: 22px;
  }

  .tabs-card__title {
    font-size: 44px;
  }
}

@media (max-width: 640px) {
  .tabs__trigger {
    height: 40px;
    padding: 0 14px;
    gap: 8px;
    font-size: 14px;
  }

  .tabs-card__title {
    font-size: 28px;
  }

  .tabs-card__inner {
    padding: 16px;
  }
}

</style>