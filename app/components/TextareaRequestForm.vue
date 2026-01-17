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
    default: 4
  },
  autoresize: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <u-form class="flex justify-center flex-col items-center gap-3 m-auto bg-accented p-3.5 w-96 rounded-md">
    <u-form-field>
      <u-textarea :rows="rows" :placeholder="placeholder" size="xl" :required="true"
                  :autoresize="false" class="w-80"/>
    </u-form-field>
    <u-separator/>
    <u-form-field class="w-80">
      <u-button class="w-full justify-center">{{ buttonText }}</u-button>
    </u-form-field>
  </u-form>
</template>

<style scoped lang="scss">

</style>