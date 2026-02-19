<script setup lang="ts">
import Modal from "~/components/common/Modal.vue";
import CustomInput from "~/components/common/CustomInput.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import { reactive, watch } from "vue";

const { t } = useI18n();
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
    <template #title>{{ t("services.emailEditor.modals.insertLink.title") }}</template>

    <div class="email-editor-insert">
      <custom-input
          v-model="form.href"
          :label="t('services.emailEditor.modals.insertLink.url')"
          :placeholder="t('services.emailEditor.modals.insertLink.placeholders.url')"
      />
      <custom-input
          v-model="form.text"
          :label="t('services.emailEditor.modals.insertLink.text')"
          :placeholder="t('services.emailEditor.modals.insertLink.placeholders.text')"
      />
    </div>

    <template #actions="{ close }">
      <custom-button variant="secondary" @click="close()">
        {{ t("services.emailEditor.modals.insertLink.cancel") }}
      </custom-button>
      <custom-button variant="full" @click="submit">
        {{ t("services.emailEditor.modals.insertLink.insert") }}
      </custom-button>
    </template>
  </modal>
</template>

<style scoped lang="scss">
.email-editor-insert {
  display: grid;
  gap: 10px;
}
</style>
