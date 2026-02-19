<script setup lang="ts">
import CustomInput from "~/components/common/CustomInput.vue";
import CustomCheckbox from "~/components/common/CustomCheckbox.vue";
import CustomButton from "~/components/common/CustomButton.vue";

const { t } = useI18n();

const open = defineModel<boolean>("open", { default: false });
const color = defineModel<string>("color", { default: "#15162A" });
const preferHex = defineModel<boolean>("preferHex", { default: true });

const props = defineProps<{
  anchorClientX: number;
  anchorClientY: number;
}>();

const emit = defineEmits<{
  (e: "apply"): void;
  (e: "close"): void;
}>();

function close() {
  open.value = false;
  emit("close");
}

function apply() {
  emit("apply");
}

const style = computed(() => {
  const x = Math.max(12, props.anchorClientX);
  const y = Math.max(12, props.anchorClientY);
  return { left: `${x}px`, top: `${y}px` };
});
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="color-picker-popover" @mousedown.self="close">
      <div class="color-picker-popover__panel" :style="style">
        <div class="color-picker-popover__header">
          <div class="color-picker-popover__title">
            <u-icon name="i-lucide-palette" />
            <span>{{ t("services.emailEditor.modals.colorPicker.title") }}</span>
          </div>

          <button
              type="button"
              class="color-picker-popover__close"
              @click="close"
              :aria-label="t('services.emailEditor.modals.common.close')"
          >
            <u-icon name="i-lucide-x" />
          </button>
        </div>

        <div class="color-picker-popover__content">
          <div class="color-picker-popover__row">
            <input class="color-picker-popover__native" type="color" v-model="color" />
            <div class="color-picker-popover__preview" :style="{ background: color }" />
          </div>

          <custom-input
              v-model="color"
              :label="t('services.emailEditor.modals.colorPicker.hex')"
              :placeholder="t('services.emailEditor.modals.colorPicker.placeholders.hex')"
          />

          <custom-checkbox
              v-model="preferHex"
              :label="t('services.emailEditor.modals.colorPicker.preferHex')"
          />

          <div class="color-picker-popover__actions">
            <custom-button variant="secondary" @click="close">
              {{ t("services.emailEditor.modals.colorPicker.close") }}
            </custom-button>
            <custom-button variant="full" @click="apply">
              {{ t("services.emailEditor.modals.colorPicker.apply") }}
            </custom-button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped lang="scss">
.color-picker-popover {
  position: fixed;
  inset: 0;
  z-index: 60;
}

.color-picker-popover__panel {
  position: fixed;
  width: 320px;
  border-radius: 18px;
  border: 1px solid var(--ui-border);
  background: rgba(14, 12, 21, 0.92);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 12px;
}

.light .color-picker-popover__panel {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(12px) saturate(180%);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12),
  inset 0 1px 0 rgba(255, 255, 255, 0.65),
  inset 0 -4px 12px rgba(0, 0, 0, 0.06),
  inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.color-picker-popover__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.color-picker-popover__title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.92);
}

.light .color-picker-popover__title {
  color: rgba(21, 22, 42, 0.86);
}

.color-picker-popover__close {
  height: 34px;
  width: 34px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.18);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: filter 160ms ease, transform 140ms ease;
  color: rgba(255, 255, 255, 0.9);
}

.light .color-picker-popover__close {
  color: rgba(21, 22, 42, 0.86);
}

.color-picker-popover__close:hover {
  filter: brightness(1.06);
}

.color-picker-popover__close:active {
  transform: translateY(1px);
}

.color-picker-popover__content {
  display: grid;
  gap: 10px;
}

.color-picker-popover__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker-popover__native {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: transparent;
  padding: 0;
  overflow: hidden;
}

.color-picker-popover__preview {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  box-shadow: var(--shadow-light);
}

.color-picker-popover__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}
</style>
