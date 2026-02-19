<script setup lang="ts">
import Modal from "~/components/common/Modal.vue";
import CustomInput from "~/components/common/CustomInput.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import { reactive, watch } from "vue";

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
    <template #title>Insert image</template>

    <div class="email-editor-insert">
      <CustomInput v-model="form.src" label="Image URL" placeholder="https://..." />
      <CustomInput v-model="form.alt" label="Alt text" placeholder="Description" />

      <div class="email-editor-insert__row">
        <CustomInput v-model="form.width" type="number" label="Width" placeholder="e.g. 600" />
        <CustomInput v-model="form.height" type="number" label="Height" placeholder="e.g. 300" />
      </div>
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

.email-editor-insert__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
</style>
