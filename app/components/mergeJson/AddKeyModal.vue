<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "submit", payload: { key: string; value: string }): void;
}>();

const keyInput = ref("");
const valueInput = ref("");

function close() {
  emit("update:modelValue", false);
}

function submit() {
  const key = keyInput.value.trim();
  if (!key) return;
  emit("submit", { key, value: valueInput.value });
  keyInput.value = "";
  valueInput.value = "";
  close();
}
</script>

<template>
  <div v-if="modelValue" class="akm">
    <div class="akm__backdrop" @click="close" />
    <div class="akm__card">
      <div class="akm__title">Add key</div>

      <label class="akm__label">
        Key
        <input v-model="keyInput" class="akm__input" placeholder="a.b.c" />
      </label>

      <label class="akm__label">
        Value
        <textarea v-model="valueInput" class="akm__ta" rows="6" />
      </label>

      <div class="akm__actions">
        <button class="akm__btn akm__btn_ghost" type="button" @click="close">Cancel</button>
        <button class="akm__btn" type="button" @click="submit" :disabled="!keyInput.trim()">Add</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.akm { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; }
.akm__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,.55); }
.akm__card {
  position: relative;
  width: min(640px, calc(100vw - 24px));
  border-radius: 18px;
  border: 1px solid var(--ui-border);
  background: rgba(15, 16, 28, .92);
  backdrop-filter: blur(10px);
  padding: 14px;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.akm__title { font-weight: 900; margin-bottom: 10px; }
.akm__label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 900; opacity: .9; }
.akm__input, .akm__ta {
  border-radius: 14px;
  padding: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(0,0,0,.18);
  color: var(--ui-text);
  outline: none;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
.akm__ta { resize: vertical; }
.akm__actions { margin-top: 12px; display: flex; justify-content: flex-end; gap: 10px; }
.akm__btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(128,90,245,.35);
  color: var(--ui-text);
  font-weight: 900;
}
.akm__btn_ghost { background: rgba(255,255,255,.06); }
.akm__btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
