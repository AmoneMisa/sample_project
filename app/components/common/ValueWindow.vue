<script setup lang="ts">
import CustomButton from "~/components/common/CustomButton.vue";

type Props = {
  titleKey: string
  keyText?: string
  value: string
  readonly?: boolean
  active?: boolean
  status?: "same" | "diff" | "onlyA" | "onlyB"
  showCopy?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  keyText: "",
  readonly: true,
  active: false,
  showCopy: false,
})

const emit = defineEmits<{
  (e: "update:value", v: string): void
  (e: "copy", v: string): void
}>()

function onInput(e: Event) {
  const v = (e.target as HTMLTextAreaElement).value
  emit("update:value", v)
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value ?? "")
    emit("copy", props.value ?? "")
  } catch {
    // ignore
  }
}
</script>

<template>
  <div
      class="vw"
      :class="{
      vw_active: active,
      vw_same: status === 'same',
      vw_diff: status === 'diff',
      vw_only: status === 'onlyA' || status === 'onlyB'
    }"
  >
    <div class="vw__head">
      <div class="vw__title">
        {{ $t(titleKey) }}
      </div>

      <div class="vw__right">
        <span v-if="status" class="vw__badge" :data-kind="status">
          {{ $t(`services.mergeJson.badges.${status}`) }}
        </span>

        <CustomButton
            v-if="showCopy"
            variant="ghost"
            :_class="'vw__btn'"
            type="button"
            @click="copy"
        >
          {{ $t("services.mergeJson.actions.copy") }}
        </CustomButton>
      </div>
    </div>

    <div v-if="keyText" class="vw__key">
      {{ keyText }}
    </div>

    <textarea
        class="vw__ta"
        :readonly="readonly"
        :value="value"
        rows="4"
        @input="onInput"
    />
  </div>
</template>

<style scoped>
.vw {
  border-radius: 16px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
  min-width: 0;
}

.vw_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.vw__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.vw__title {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.vw__right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.vw__badge {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text-muted);
}

.vw__key {
  margin-top: 8px;
  font-weight: 900;
  font-size: 13px;
  word-break: break-word;
}

.vw__ta {
  margin-top: 10px;
  width: 100%;
  border-radius: 14px;
  padding: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  color: var(--ui-text);
  outline: none;
  resize: vertical;
  min-height: 96px;
  font-size: 12px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.vw__ta:focus {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.vw__btn {
  height: 30px;
  padding: 0 10px;
}

.light .vw,
.light .vw__badge,
.light .vw__ta {
  background: rgba(255, 255, 255, 0.65);
  border-color: rgba(0, 0, 0, 0.08);
  color: rgba(21, 22, 42, 0.82);
}
</style>
