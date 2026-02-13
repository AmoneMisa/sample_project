<script setup lang="ts">
type Props = {
  labelKey: string
  accept?: string
  multiple?: boolean
  error?: string | null
  hintKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  accept: ".json,.csv,.xml",
  multiple: false,
  error: null,
})

const emit = defineEmits<{
  (e: "files", files: File[]): void
}>()

function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  emit("files", files)
  input.value = ""
}
</script>

<template>
  <div class="mi">
    <div class="mi__label">
      {{ $t(labelKey) }}
    </div>

    <div class="mi__box" :class="{ mi__box_error: !!error }">
      <input
          class="mi__input"
          type="file"
          :accept="accept"
          :multiple="multiple"
          @change="onChange"
      />
    </div>

    <div v-if="hintKey" class="mi__hint">
      {{ $t(hintKey) }}
    </div>

    <div v-if="error" class="mi__error">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.mi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 220px;
}

.mi__label {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.mi__box {
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  padding: 8px 10px;
}

.mi__box_error {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.06);
}

.mi__input {
  width: 100%;
  font-size: 12px;
  color: var(--ui-text);
}

.mi__hint {
  font-size: 11px;
  color: var(--ui-text-muted);
}

.mi__error {
  font-size: 12px;
  font-weight: 900;
  color: var(--color-error, #ef4444);
}
</style>
