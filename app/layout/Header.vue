<script setup lang="ts">
import { en, ru, kk } from '@nuxt/ui/locale'

const locale = ref('ru');

const items = [
  {
    label: 'Главная',
    to: '/',
    icon: 'i-lucide-home'
  },
  {
    label: 'Каталог',
    icon: 'i-lucide-box',
    children: [
      {
        label: 'Одежда',
        to: '/catalog/clothing',
        icon: 'i-lucide-shirt',
        description: 'Мужская и женская одежда'
      },
      {
        label: 'Обувь',
        to: '/catalog/shoes',
        icon: 'i-lucide-shoe',
        description: 'Кроссовки, ботинки и др.'
      }
    ]
  },
  {
    label: 'Контакты',
    to: '/contacts',
    icon: 'i-lucide-phone'
  }
];
</script>

<template>
  <u-header class="header">
    <template #left>
      <div class="header__logo max-h-[35px]">
        <img alt="Logo" src="/images/logo.png">
      </div>
    </template>
    <template #default>
      <u-navigation-menu :items="items" />
    </template>
    <template #right>
        <u-locale-select  v-model="locale" :locales="[en, ru, kk]" />
    </template>
  </u-header>
</template>

<style scoped>

</style>