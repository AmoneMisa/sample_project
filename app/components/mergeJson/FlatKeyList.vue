<script setup lang="ts">
import type { Status } from "~/utils/mergeJson/diff";

const props = defineProps<{
  keys: string[];
  modelValue?: string;
  filter?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
  statusByKey?: (path: string) => Status | null;
  highlightByKey?: (path: string) => "new" | "conflict" | "added" | "edited" | null;
  matchByKey?: (path: string) => boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();

const q = computed(() => (props.filter || "").trim().toLowerCase());

const visibleKeys = computed(() => {
  const out: string[] = [];
  for (const k of props.keys) {
    if (!k) continue;
    if (props.onlyDiff && props.diffSet && !props.diffSet.has(k)) continue;
    if (q.value && !k.toLowerCase().includes(q.value)) continue;
    out.push(k);
  }
  return out;
});

function pick(k: string) {
  emit("update:modelValue", k);
}
</script>

<template>
  <div class="fkl">
    <button
        v-for="k in visibleKeys"
        :key="k"
        class="fkl__row"
        :class="{
        fkl__row_active: modelValue === k,
        fkl__row_new: highlightByKey?.(k) === 'new',
        fkl__row_conflict: highlightByKey?.(k) === 'conflict',
        fkl__row_added: highlightByKey?.(k) === 'added',
        fkl__row_edited: highlightByKey?.(k) === 'edited',
        fkl__row_match: matchByKey?.(k) === true,
      }"
        type="button"
        @click="pick(k)"
    >
      <span class="fkl__key">{{ k }}</span>
      <span v-if="statusByKey?.(k)" class="fkl__badge" :data-kind="statusByKey?.(k)">{{ statusByKey?.(k) }}</span>
    </button>
  </div>
</template>

<style scoped>
.fkl {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}
.fkl__row {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255,255,255,0.02);
  color: var(--ui-text);
  cursor: pointer;
}
.fkl__row_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}
.fkl__key { font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fkl__badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  opacity: .85;
}

.fkl__row_new { box-shadow: 0 0 0 2px rgba(34,197,94,.35) inset; }
.fkl__row_conflict { box-shadow: 0 0 0 2px rgba(234,179,8,.35) inset; }
.fkl__row_added { box-shadow: 0 0 0 2px rgba(56,189,248,.35) inset; }
.fkl__row_edited { box-shadow: 0 0 0 2px rgba(168,85,247,.35) inset; }
.fkl__row_match { outline: 2px solid rgba(59,130,246,.45); }
</style>
