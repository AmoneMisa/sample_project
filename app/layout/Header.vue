<script setup lang="ts">
import {en, ru, kk} from '@nuxt/ui/locale'
import HeaderMenu from "~/components/HeaderMenu.vue";

const locale = ref('ru');
const header = useTemplateRef('header');
const isSticky = ref(false);
const isVisible = ref(false);

onMounted(() => {
  const el = header.value?.$el;
  if (!el) return;

  const sentinel = document.createElement('div');
  el.before(sentinel);

  const observer = new IntersectionObserver(([entry]) => {
    const sticky = !entry.isIntersecting;
    isSticky.value = sticky;

    if (sticky) {
      isVisible.value = false;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isVisible.value = true;
        });
      });
    } else {
      isVisible.value = false;
    }
  });

  observer.observe(sentinel);
});

</script>

<template>
  <u-header ref="header" class="header bg-transparent border-0"
            :class="{ 'header_sticky': isSticky,
                      'header_visible': isVisible }"
  >
    <template #left>
      <a class="header__logo max-h-[35px]" href="/">
        <img alt="Logo" src="/images/logo.png">
      </a>
    </template>
    <template #default>
      <header-menu />
    </template>
    <template #right>
      <u-locale-select class="header__lang" v-model="locale" :locales="[en, ru, kk]" :ui="{
          base: 'gradient-button-figure gradient-button-figure_reverse',
          leading: 'self-baseline',
          trailingIcon: 'text-primary',
          content: 'bg-default text-white border-2 border-default',
          value: 'px-2'
        }"/>
      <u-button class="capitalize gradient-button-figure">Get start</u-button>
    </template>
  </u-header>
</template>

<style lang="scss">


.header {
  transition: background-color .3s ease;

  &.header_sticky {
    animation-name: hideShowHeader;
    animation-duration: 1s;
    animation-timing-function: ease;
    animation-fill-mode: forwards;
    background-color: var(--color-blackest);
  }
}

@keyframes hideShowHeader {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
}
</style>