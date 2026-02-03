<script setup lang="ts">
const {t} = useI18n();

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
  },
  ui: {
    type: Object
  }
})
</script>

<template>
  <u-page-header :description="description ? t(description) : ''"
                 :title="title ? t(title) : ''"
                 :headline="headline ? t(headline) : ''"
                 class="text-center border-0 py-0 my-0"
                 :class="{'m-auto': isCentered}"
                 :ui="Object.assign({
  title: `
    ${isCentered ? 'mx-auto' : 'mx-0 text-left'}
    ${!isFullWidth ? 'max-w-[390px]' : ''}
    ${titleClasses}

    whitespace-normal break-words [overflow-wrap:anywhere]
    leading-tight
    ${titleSize === '48'
      ? 'text-3xl sm:text-4xl lg:text-5xl'
      : 'text-2xl sm:text-3xl lg:text-4xl'
    }
  `,
  headline: `
    ${isCentered ? 'justify-center' : 'text-left'}
    ${!isFullWidth ? 'max-w-[390px]' : ''}
    ${headLineClasses}
    gradient-text text-md
    whitespace-normal break-words [overflow-wrap:anywhere]
  `,
  description: `
    ${descriptionSize === '24' ? 'text-lg sm:text-xl' : 'text-base sm:text-md'}
    ${isCentered ? 'justify-center' : 'text-left'}
    ${!isFullWidth ? 'max-w-[390px]' : ''}
    ${descriptionClasses}
    whitespace-normal break-words [overflow-wrap:anywhere]
  `
}, ui)"
  />
</template>

<style scoped lang="scss">

</style>