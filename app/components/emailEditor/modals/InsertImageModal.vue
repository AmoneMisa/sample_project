<script setup lang="ts">
import Modal from "~/components/common/Modal.vue";
import CustomInput from "~/components/common/CustomInput.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import { reactive, watch } from "vue";

const { t } = useI18n();
const open = defineModel<boolean>("open", { default: false });

const emit = defineEmits<{
  (e: "insert", payload: { src: string; alt: string; width: number | null; height: number | null }): void;
}>();

const form = reactive({
  src: "",
  alt: "",
  width: "",
  height: "",
});

watch(
    () => open.value,
    (v) => {
      if (!v) return;
      form.src = "";
      form.alt = "";
      form.width = "";
      form.height = "";
    }
);

function toNum(v: string) {
  const n = Number(String(v || "").trim());
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function submit() {
  const src = form.src.trim();
  if (!src) return;

  emit("insert", {
    src,
    alt: form.alt.trim(),
    width: toNum(form.width),
    height: toNum(form.height),
  });

  open.value = false;
}
</script>

<template>
  <modal v-model:open="open" max-width-class="sm:max-w-xl">
    <template #title>{{ t("services.emailEditor.modals.insertImage.title") }}</template>

    <div class="email-editor-insert">
      <custom-input
          v-model="form.src"
          :label="t('services.emailEditor.modals.insertImage.url')"
          :placeholder="t('services.emailEditor.modals.insertImage.placeholders.url')"
      />
      <custom-input
          v-model="form.alt"
          :label="t('services.emailEditor.modals.insertImage.alt')"
          :placeholder="t('services.emailEditor.modals.insertImage.placeholders.alt')"
      />

      <div class="email-editor-insert__row">
        <custom-input
            v-model="form.width"
            type="number"
            :label="t('services.emailEditor.modals.insertImage.width')"
            :placeholder="t('services.emailEditor.modals.insertImage.placeholders.width')"
        />
        <custom-input
            v-model="form.height"
            type="number"
            :label="t('services.emailEditor.modals.insertImage.height')"
            :placeholder="t('services.emailEditor.modals.insertImage.placeholders.height')"
        />
      </div>
    </div>

    <template #actions="{ close }">
      <custom-button variant="secondary" @click="close()">
        {{ t("services.emailEditor.modals.insertImage.cancel") }}
      </custom-button>
      <custom-button variant="full" @click="submit">
        {{ t("services.emailEditor.modals.insertImage.insert") }}
      </custom-button>
    </template>
  </modal>
</template>

<style scoped lang="scss">
.email-editor-insert {
  display: grid;
  gap: 10px;
}

.email-editor-insert__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
