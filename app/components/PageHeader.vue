<script setup lang="ts">
defineProps({
  description: {
    type: String
  },
  headline: {
    type: String
  },
  title: {
    type: String
  },
  isCentered: {
    type: Boolean,
    default: true
  },
  descriptionSize: {
    type: String,
    default: '16'
  },
  titleSize: {
    type: String,
    default: '48'
  },
  isFullWidth: {
    type: Boolean,
    default: true
  },
  headLineClasses: {
    type: String,
    default: ""
  },
  titleClasses: {
    type: String,
    default: ""
  },
  descriptionClasses: {
    type: String,
    default: ""
  }
})
</script>

<template>
  <u-page-header :description="description"
                 :title="title"
                 :headline="headline"
                 class="text-center border-0 py-0 my-0"
                 :class="{'m-auto': isCentered}"
                 :ui="{title: `${isCentered ? 'mx-auto' : 'mx-0 text-left'} ${titleSize === '48' ? 'text-5xl sm:text-5xl' : 'sm:text-4xl text-4xl'}  ${!isFullWidth? 'max-w-[390px]' : ''} ${titleClasses}`,
                  headline: `${isCentered ? 'justify-center' : 'text-left'} gradient-text text-md  ${!isFullWidth? 'max-w-[390px]' : ''} ${headLineClasses}`,
                  description: `${descriptionSize === '24' ? 'text-2xl' : 'text-md'} ${isCentered ? 'justify-center' : 'text-left'} ${!isFullWidth? 'max-w-[390px]' : ''} ${descriptionClasses}`
                 }"
  />
</template>

<style scoped lang="scss">

</style>