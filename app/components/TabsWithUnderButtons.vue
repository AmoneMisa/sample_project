<script setup lang="ts">
import {computed, ref, watch} from "vue";
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";

const {t} = useI18n();

const props = defineProps({
  tabs: {
    type: Array as () => Array<{
      title: string;
      description?: string;
      headline?: string;
      image?: string;
    }>,
    default: () => [],
    required: true,
  },
  buttonText: {
    type: String,
    default: "Try It Now →",
  },
});

const activeIndex = ref(0);

const activeTab = computed(() => props.tabs?.[activeIndex.value] ?? null);
const currentImg = ref(activeTab.value?.image ?? "");
const nextImg = ref("");
const imgSwapping = ref(false);

function preload(src?: string) {
  if (!src || !import.meta.client) return;
  const i = new Image();
  i.decoding = "async";
  i.src = src;
}

watch(
    () => props.tabs,
    (tabs) => {
      (tabs ?? []).forEach((x) => preload(x.image));
      activeIndex.value = 0;
      currentImg.value = tabs?.[0]?.image ?? "";
    },
    {immediate: true, deep: true}
);

watch(
    () => activeTab.value?.image,
    (src) => {
      if (!src || src === currentImg.value) return;
      preload(src);
      nextImg.value = src;
      imgSwapping.value = true;

      setTimeout(() => {
        currentImg.value = src;
        nextImg.value = "";
        imgSwapping.value = false;
      }, 220);
    }
);
</script>

<template>
  <section class="tabs-bg">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div class="tabs-card">
        <div class="tabs-content">
          <div class="tabs-image">
            <div class="tabs-image__frame">
              <img
                  v-if="currentImg"
                  :src="currentImg"
                  :alt="activeTab ? t(activeTab.title) : 'tab image'"
                  class="tabs-image__img"
                  :class="{ 'is-dim': imgSwapping }"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                  draggable="false"
              />
              <img
                  v-if="nextImg"
                  :src="nextImg"
                  :alt="activeTab ? t(activeTab.title) : 'tab image'"
                  class="tabs-image__img is-next"
                  loading="eager"
                  decoding="async"
                  fetchpriority="high"
                  draggable="false"
              />
            </div>
          </div>

          <div class="tabs-info">
            <page-header
                v-if="activeTab"
                :title="activeTab.title"
                :headline="activeTab.headline"
                :isCentered="false"
                headLineClasses="gradient-text_cap"
                :ui="{
                title: 'text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white',
                headline: 'text-sm sm:text-base',
                description: 'text-white/70 text-sm sm:text-base leading-relaxed'
              }"
            />
            <div class="tabs-desc-scroll">
              <p v-if="activeTab?.description" class="tabs-desc">
                {{ t(activeTab.description) }}
              </p>
            </div>

            <custom-button class="mt-6 w-fit" variant="full">
              {{ t(buttonText) }}
            </custom-button>
          </div>
        </div>
      </div>
      <u-tabs
          :items="tabs"
          class="tabs tabs-with-under-buttons"
          v-model="activeIndex"
          :ui="{
          list: 'tabs__list bg-transparent',
          trigger: 'tabs__button',
          indicator: 'hidden',
          label: 'w-full flex md:flex-col items-center gap-[6px] md:gap-0 md:items-baseline text-left'
        }"
      >
        <template #default="{ item, index }">
          <span class="tabs__count">
            <span>0{{ index + 1 }}</span>
          </span>
          <span class="tabs__title">{{ t(item.title) }}</span>
        </template>
        <template #content>
          <div/>
        </template>
      </u-tabs>
    </div>
  </section>
</template>

<style scoped lang="scss">
.tabs-bg {
  position: relative;
  width: 100%;
  background: radial-gradient(900px 520px at 18% 0%, rgba(128, 90, 245, 0.10), transparent 60%),
  radial-gradient(900px 520px at 85% 10%, rgba(205, 153, 255, 0.08), transparent 60%),
  rgba(14, 12, 21, 0.92);
  margin-bottom: 0;
}

.tabs-card {
  border-radius: 26px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(128, 90, 245, 0.55), rgba(255, 255, 255, 0.06), rgba(205, 153, 255, 0.35));
  box-shadow: 0 22px 70px rgba(0, 0, 0, 0.55);
}

.tabs-content {
  border-radius: 24px;
  background: rgba(14, 12, 21, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -22px 45px rgba(0, 0, 0, 0.55);
  padding: 18px;
  display: flex;
  gap: 18px;
}

@media (max-width: 768px) {
  .tabs-content {
    flex-direction: column;
    align-items: center;
    gap: 26px;
    padding: 22px;
  }
}

.tabs-image__frame {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.45);
  aspect-ratio: 1 / 1;
}

.tabs-image__img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transform: translateZ(0);
  opacity: 1;
  transition: opacity 220ms ease;
}

.tabs-image__img.is-dim {
  opacity: 0.55;
}

.tabs-image__img.is-next {
  position: absolute;
  inset: 0;
  opacity: 0;
  animation: imgFadeIn 220ms ease forwards;
}

@keyframes imgFadeIn {
  to {
    opacity: 1;
  }
}

.tabs-info {
  padding: 6px 4px;
}

.tabs-desc-scroll {
  margin-top: 12px;
  max-height: 120px;
  overflow: auto;
  padding-right: 6px;
}

.tabs-desc {
  color: rgba(188, 195, 215, 0.9);
  line-height: 1.6;
  word-break: break-word;
}

.tabs-desc-scroll::-webkit-scrollbar {
  width: 6px;
}

.tabs-desc-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
}

.tabs-with-under-buttons {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 18px;
}

.tabs-with-under-buttons :deep(.tabs__list) {
  display: grid;
  gap: 14px;
  padding: 6px 2px;
  grid-template-columns: 1fr;
  overflow: visible;
  flex-wrap: unset;
  scrollbar-width: unset;
}

.tabs-with-under-buttons :deep(.tabs__list::-webkit-scrollbar) {
  display: none;
}

.tabs-with-under-buttons :deep(.tabs__button) {
  cursor: pointer;
  padding-top: 18px;
  width: 100%;
  border: none;
  background: transparent;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  transition: color 0.25s ease;
}

.tabs-with-under-buttons :deep(.tabs__button::before) {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  width: 100%;
  border-radius: 7px;
  background: rgb(52, 54, 103);
  transition: background 0.25s ease, height 0.25s ease;
}

.tabs__title {
  font-size: 1.02rem;
  font-weight: 600;
  color: rgba(188, 195, 215, 0.95);
  max-width: 240px;
  transition: color 0.25s ease;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (min-width: 1024px) {
  .tabs-with-under-buttons :deep(.tabs__list) {
    justify-content: space-between;
    overflow: visible;
    padding: 6px 2px;
    scroll-snap-type: none;
  }

  .tabs-with-under-buttons :deep(.tabs__button) {
    width: auto;
    min-width: 220px;
    padding-top: 22px;
  }

  .tabs__title {
    white-space: nowrap;
    text-overflow: ellipsis;
    -webkit-line-clamp: unset;
    display: block;
    max-width: 240px;
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .tabs-with-under-buttons :deep(.tabs__list) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .tabs-with-under-buttons :deep(.tabs__list) {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 6px 2px;
  }
}

.tabs__count {
  width: 36px;
  height: 36px;
  background: url("/images/tab-bg-shape.png") center/cover no-repeat;
  border-radius: 50%;
  display: grid;
  place-items: center;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .35));
  transition: transform 0.25s ease, filter 0.25s ease;
}

.tabs__count span {
  background: linear-gradient(90deg, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.tabs-with-under-buttons :deep(.tabs__button[data-state="active"]::before) {
  background: linear-gradient(90deg, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
  height: 2px;
}

.tabs-with-under-buttons :deep(.tabs__button[data-state="active"] .tabs__title) {
  color: rgba(255, 255, 255, 0.95);
}

.tabs-with-under-buttons :deep(.tabs__button:hover .tabs__count) {
  transform: translateY(-1px);
  filter: drop-shadow(0 16px 22px rgba(128, 90, 245, 0.25));
}

@media (max-width: 640px) {
  .tabs-with-under-buttons :deep(.tabs__button) {
    padding-top: 18px;
  }
  .tabs__title {
    font-size: 0.98rem;
    max-width: 180px;
  }
  .tabs__count {
    width: 34px;
    height: 34px;
  }
}
</style>
