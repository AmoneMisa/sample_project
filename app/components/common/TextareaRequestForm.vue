<script setup lang="ts">
import CustomButton from "~/components/common/CustomButton.vue";

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
</script>

<template>
  <u-form class="flex justify-center flex-col items-center gap-3 m-auto p-6 max-w-[540px] w-full rounded-xl textarea-form">
    <u-form-field class="w-full">
      <u-textarea :rows="rows" :placeholder="placeholder" :required="true"
                  :autoresize="false" class="w-full border-[1px] rounded-md border-primary"/>
    </u-form-field>
    <u-separator class="py-2.5" :ui="{
      border: ''
    }"/>
    <u-form-field class="w-fill-available">
      <custom-button class="w-fill-available justify-center" variant="full">{{ buttonText }}</custom-button>
    </u-form-field>
  </u-form>
</template>

<style scoped>
.textarea-form {
  background-color: var(--color-blackest);
}
</style>