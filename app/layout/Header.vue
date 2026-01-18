<script setup lang="ts">
import { en, ru, kk } from '@nuxt/ui/locale'

const locale = ref('ru');

const items = [
  {
    label: 'Главная',
    to: '/',
  },
  {
    label: 'Каталог',
    children: [
      {
        label: 'Одежда',
        to: '/catalog/clothing',
        description: 'Мужская и женская одежда'
      },
      {
        label: 'Обувь',
        to: '/catalog/shoes',
        description: 'Кроссовки, ботинки и др.'
      }
    ]
  },
  {
    label: 'Контакты',
    to: '/contacts',
  }
];
</script>

<template>
  <u-header class="header bg-transparent border-0 static">
    <template #left>
      <a class="header__logo max-h-[35px]" href="/">
        <img alt="Logo" src="/images/logo.png">
      </a>
    </template>
    <template #default>
      <u-navigation-menu :items="items" class="header__menu" />
    </template>
    <template #right>
        <u-locale-select class="header__lang" v-model="locale" :locales="[en, ru, kk]" :ui="{
          base: 'gradient-button-figure gradient-button-figure_reverse',
          leading: 'self-baseline',
          trailingIcon: 'text-primary',
          content: 'bg-default text-white border-2 border-default',
          value: 'px-2'
        }" />
      <u-button class="capitalize gradient-button-figure">Get start</u-button>
    </template>
  </u-header>
</template>

<style lang="scss">
.header__menu {
  margin: 0;
  padding: 0 16px;
  border: 1px solid var(--ui-border);
  border-radius: 50px;
  background: var(--color-blackest);
  max-height: 52px;

  ul li > a,
  ul li > button {
    position: relative;
    padding: 13px 17px;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-link);
    transition: color 0.3s ease;

    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 75%;
      transform: translate(-50%, -50%);
      width: 100%;
      height: 8px;
      background: linear-gradient(
              90deg,
              var(--color-primary-gradient-start),
              var(--color-primary-gradient-end)
      );
      border-radius: 100%;
      filter: blur(16px);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 0;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      margin: 0 auto;
      width: 0;
      height: 4px;
      background: linear-gradient(
              90deg,
              var(--color-primary-gradient-start),
              var(--color-primary-gradient-end)
      );
      border-radius: 12px;
      opacity: 0;
      transition: 0.3s ease;
      z-index: 1;
    }

    &:hover {
      &::before,
      &::after {
        opacity: 1;
      }

      &:after {
        width: 45px;
      }
    }
  }
}
</style>