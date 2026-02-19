<script setup lang="ts">
import Modal from "~/components/common/Modal.vue";
import CustomInput from "~/components/common/CustomInput.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import { reactive, watch } from "vue";

const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "insert", payload: { href: string; text: string }): void;
}>();

const form = reactive({
  href: "",
  text: "",
});

watch(
    () => open.value,
    (v) => {
      if (!v) return;
      form.href = "";
      form.text = "";
    }
);

function submit() {
  const href = form.href.trim();
  if (!href) return;

  emit("insert", {
    href,
    text: form.text.trim(),
  });

  open.value = false;
}
</script>

<template>
  <modal v-model:open="open" max-width-class="sm:max-w-xl">
    <template #title>Insert link</template>

    <div class="email-editor-insert">
      <CustomInput v-model="form.href" label="URL" placeholder="https://..." />
      <CustomInput v-model="form.text" label="Text" placeholder="Link text" />
    </div>

    <template #actions="{ close }">
      <CustomButton variant="secondary" @click="close()">Cancel</CustomButton>
      <CustomButton variant="full" @click="submit">Insert</CustomButton>
    </template>
  </modal>
</template>

<style scoped lang="scss">
.email-editor-insert {
  display: grid;
  gap: 10px;
}
</style>
