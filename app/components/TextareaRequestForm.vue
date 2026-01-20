<script setup lang="ts">
defineProps({
  placeholder: {
    type: String,
    default: "Type something to promt AI...",
    required: true
  },
  buttonText: {
    type: String,
    default: "Start with AI",
    required: true
  },
  rows: {
    type: Number,
    default: 2
  },
  autoresize: {
    type: Boolean,
    default: false
  }
});

const {t} = useI18n();
</script>

<template>
  <u-form class="flex justify-center flex-col items-center gap-3 m-auto p-6 max-w-[540px] w-full rounded-xl bg-dark">
    <u-form-field class="w-full">
      <u-textarea :rows="rows" :placeholder="t(placeholder)" :required="true"
                  :autoresize="false" class="w-full"/>
    </u-form-field>
    <u-separator class="py-2.5" :ui="{
      border: ''
    }"/>
    <u-form-field class="w-full">
      <custom-button class="w-full justify-center" button-type="gradient-white">{{ t(buttonText) }}</custom-button>
    </u-form-field>
  </u-form>
</template>

<style scoped lang="scss">

</style>