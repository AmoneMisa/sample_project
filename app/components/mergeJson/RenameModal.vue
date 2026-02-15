<script setup lang="ts">
import ModalShell from "~/components/mergeJson/ModalShell.vue";
import CustomInput from "~/components/common/CustomInput.vue";

type Props = {
  modelValue: boolean;
  from: string;
};
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "confirm", payload: { from: string; to: string }): void;
  (e: "close"): void;
}>();

const { t } = useI18n();

const fromLocal = ref(props.from || "");
const toLocal = ref(props.from || "");

watch(
    () => props.from,
    (v) => {
      fromLocal.value = v || "";
      toLocal.value = v || "";
    }
);

const disableConfirm = computed(() => {
  const f = fromLocal.value.trim();
  const to = toLocal.value.trim();
  return !f || !to || f === to;
});

function onConfirm() {
  emit("confirm", { from: fromLocal.value.trim(), to: toLocal.value.trim() });
}
</script>

<template>
  <ModalShell
      :model-value="modelValue"
      @update:modelValue="(v) => emit('update:modelValue', v)"
      @close="emit('close')"
      @confirm="onConfirm"
      :title="t('services.mergeJson.modals.rename.title')"
      :confirm-text="t('services.mergeJson.modals.rename.confirm')"
      :cancel-text="t('services.mergeJson.modals.rename.cancel')"
      :disable-confirm="disableConfirm"
  >
    <CustomInput
        v-model="fromLocal"
        :label="t('services.mergeJson.modals.rename.from')"
    />
    <CustomInput
        v-model="toLocal"
        :label="t('services.mergeJson.modals.rename.to')"
    />
  </ModalShell>
</template>
