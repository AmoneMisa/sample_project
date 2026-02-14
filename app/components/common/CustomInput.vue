<script setup lang="ts">
type InputType = "text" | "search" | "email" | "password" | "number" | "url";

type Props = {
  modelValue: string
  type?: InputType
  label?: string
  labelKey?: string
  placeholder?: string
  placeholderKey?: string
  hint?: string
  hintKey?: string
  error?: string | null
  disabled?: boolean
  readonly?: boolean
  autocomplete?: string
  inputmode?: "text" | "numeric" | "decimal" | "email" | "search" | "tel" | "url"
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  label: "",
  labelKey: "",
  placeholder: "",
  placeholderKey: "",
  hint: "",
  hintKey: "",
  error: null,
  disabled: false,
  readonly: false,
  autocomplete: "off",
  inputmode: "text",
  clearable: true,
})

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void
  (e: "clear"): void
}>()

const id = `in_${Math.random().toString(16).slice(2)}`
const hasValue = computed(() => (props.modelValue || "").length > 0)

function onInput(e: Event) {
  emit("update:modelValue", (e.target as HTMLInputElement).value)
}

function clear() {
  emit("update:modelValue", "")
  emit("clear")
}
</script>

<template>
  <div class="uii" :class="{ uii_error: !!error, uii_disabled: disabled }">
    <div v-if="labelKey || label" class="uii__label">
      <label :for="id">
        <span v-if="labelKey">{{ $t(labelKey) }}</span>
        <span v-else>{{ label }}</span>
      </label>
    </div>

    <div class="uii__box">
      <input
          :id="id"
          class="uii__input"
          :type="type"
          :value="modelValue"
          :placeholder="placeholderKey ? $t(placeholderKey) : placeholder"
          :disabled="disabled"
          :readonly="readonly"
          :autocomplete="autocomplete"
          :inputmode="inputmode"
          @input="onInput"
      />

      <button
          v-if="clearable && !readonly && !disabled && hasValue"
          class="uii__clear"
          type="button"
          @click="clear"
          :title="$t('services.jsonMerge.titles.reset')"
      >
        <i-lucide-x class="uii__clear-icon" />
      </button>
    </div>

    <div v-if="hintKey || hint" class="uii__hint">
      <span v-if="hintKey">{{ $t(hintKey) }}</span>
      <span v-else>{{ hint }}</span>
    </div>

    <div v-if="error" class="uii__error">{{ error }}</div>
  </div>
</template>

<style scoped>
.uii {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.uii__label {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.uii__box {
  position: relative;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  padding: 8px 10px;
}

.uii__input {
  width: 100%;
  font-size: 12px;
  color: var(--ui-text);
  background: transparent;
  outline: none;
  border: 0;
  padding-right: 28px;
}

.uii__clear {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.uii__clear-icon {
  width: 16px;
  height: 16px;
  opacity: 0.9;
}

.uii__hint {
  font-size: 11px;
  color: var(--ui-text-muted);
}

.uii__error {
  font-size: 12px;
  font-weight: 900;
  color: var(--color-error, #ef4444);
}

.uii_error .uii__box {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.06);
}

.uii_disabled {
  opacity: 0.65;
}

.uii_disabled .uii__clear {
  display: none;
}
</style>
