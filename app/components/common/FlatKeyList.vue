<script setup lang="ts">
type Status = "same" | "diff" | "onlyA" | "onlyB";

const props = defineProps<{
  keys: string[];
  modelValue?: string;
  filter?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
  statusByKey?: (k: string) => Status;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();

const list = computed(() => {
  const f = (props.filter || "").trim().toLowerCase();
  return props.keys.filter((k) => {
    if (f && !k.toLowerCase().includes(f)) return false;
    if (props.onlyDiff && props.diffSet && !props.diffSet.has(k)) return false;
    return true;
  });
});

function pick(k: string) {
  emit("update:modelValue", k);
}
</script>

<template>
  <div class="fk">
    <button
        v-for="k in list"
        :key="k"
        class="fk__row"
        :class="{ fk__row_active: modelValue === k }"
        type="button"
        @click="pick(k)"
    >
      <span class="fk__key">{{ k }}</span>
      <span v-if="statusByKey" class="fk__badge">
        {{ $t(`services.mergeJSON.badges.${statusByKey(k)}`) }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.fk { display: flex; flex-direction: column; gap: 8px; }

.fk__row {
  width: 100%;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text);
  cursor: pointer;
  text-align: left;
}

.fk__row_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.fk__key { font-weight: 900; word-break: break-word; }

.fk__badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text-muted);
}
</style>
