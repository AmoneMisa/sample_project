<script setup lang="ts">
const buttonTypes = ['default', 'white', 'black', 'gradient-white', 'figure', 'link'] as const

type ButtonType = typeof buttonTypes[number]

defineProps<{
  buttonType?: ButtonType
}>()

</script>

<template>
  <u-button v-if="buttonType === 'gradient-white'" class="gradient-button">
    <slot/>
  </u-button>
  <u-button v-else-if="buttonType === 'white'" class="brightness-125 button-white">
    <slot/>
  </u-button>
  <u-button v-else-if="buttonType === 'link'" variant="link" class="text-white pl-0 button-link">
    <slot/>
  </u-button>
  <u-button class="gradient-button gradient-button_black" v-else>
    <slot/>
  </u-button>
</template>

<style scoped lang="scss">
.button-link {
  transition: all .3s ease-in-out;

  &:hover {
    background-image: linear-gradient(to right, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
</style>