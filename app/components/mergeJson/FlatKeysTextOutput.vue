<script setup lang="ts">
import type { JsonValue } from "~/utils/mergeJson/json";
import { getByPath, collectLeafPaths } from "~/utils/mergeJson/json";
import JsonTextTree from "~/components/mergeJson/JsonTextTree.vue";

type Highlight = "new" | "conflict" | "added" | "edited" | null;

const props = defineProps<{
  value: JsonValue;
  minify?: boolean;
  sort?: "asc" | "desc";
  selected?: string;
  query?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
  highlightByLeaf?: (path: string) => Highlight;
}>();

const emit = defineEmits<{
  (e: "select", path: string): void;
}>();

function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

const keys = computed(() => {
  const raw = collectLeafPaths(props.value as any);
  const set = new Set<string>(raw.filter(Boolean));
  const arr = Array.from(set);
  arr.sort((a, b) => a.localeCompare(b));
  if (props.sort === "desc") arr.reverse();
  if (!props.onlyDiff) return arr;
  if (!props.diffSet) return [];
  return arr.filter((k) => props.diffSet!.has(k));
});

const opened = reactive(new Set<string>());

function toggle(k: string) {
  if (opened.has(k)) opened.delete(k);
  else opened.add(k);
}

function isOpen(k: string) {
  return opened.has(k);
}

function pick(k: string) {
  emit("select", k);
}

function inlineValue(v: any) {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return props.minify ? JSON.stringify(v) : JSON.stringify(v);
}

const q = computed(() => (props.query || "").trim().toLowerCase());

function matchesKey(k: string, v: any) {
  if (!q.value) return false;
  if (k.toLowerCase().includes(q.value)) return true;
  const s = String(v ?? "").toLowerCase();
  return s.includes(q.value);
}

watch(() => props.query, () => {
  if (!props.query?.trim()) return;
  const first = keys.value.find((k) => matchesKey(k, getByPath(props.value as any, k)));
  if (!first) return;
  emit("select", first);
});
</script>

<template>
  <div class="fko">
    <div
        v-for="k in keys"
        :key="k"
        class="fko__row"
        :class="{
        fko__row_active: selected === k,
        fko__row_match: query && matchesKey(k, getByPath(value as any, k)),
        fko__row_new: highlightByLeaf?.(k) === 'new',
        fko__row_conflict: highlightByLeaf?.(k) === 'conflict',
        fko__row_added: highlightByLeaf?.(k) === 'added',
        fko__row_edited: highlightByLeaf?.(k) === 'edited',
      }"
    >
      <button
          v-if="(() => { const v = getByPath(value as any, k); return v && typeof v === 'object'; })()"
          class="fko__toggle"
          type="button"
          @click="toggle(k)"
      >
        {{ isOpen(k) ? "▾" : "▸" }}
      </button>
      <span v-else class="fko__dot">•</span>

      <button class="fko__pick" type="button" @click="pick(k)">
        <span class="fko__key">{{ JSON.stringify(k) }}</span>
        <span class="fko__sep">:</span>
        <span class="fko__val">{{ inlineValue(getByPath(value as any, k)) }}</span>
      </button>

      <div v-if="isOpen(k)" class="fko__expanded">
        <JsonTextTree
            :value="getByPath(value as any, k)"
            :base-path="k"
            :minify="minify"
            :selected="selected"
            :query="query"
            :only-diff="onlyDiff"
            :diff-set="diffSet"
            :highlight-by-leaf="highlightByLeaf"
            @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fko {
  border-radius: 16px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  overflow: auto;
  max-height: 460px;
  padding: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}

.fko__row {
  border-radius: 12px;
  padding: 6px 8px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--ui-text);
}

.fko__toggle {
  width: 26px;
  height: 22px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text);
  cursor: pointer;
  flex: 0 0 auto;
  margin-top: 2px;
}

.fko__dot {
  width: 26px;
  display: inline-flex;
  justify-content: center;
  opacity: 0.8;
  flex: 0 0 auto;
  margin-top: 2px;
}

.fko__pick {
  border: 0;
  background: transparent;
  padding: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  flex: 1 1 auto;
  min-width: 0;
}

.fko__key { font-weight: 900; }
.fko__sep { opacity: 0.7; padding: 0 6px; }
.fko__val { opacity: 0.9; word-break: break-word; white-space: pre-wrap; }

.fko__expanded {
  width: 100%;
  margin-top: 8px;
  padding-left: 34px;
}

.fko__row_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.fko__row_new { box-shadow: 0 0 0 2px rgba(34,197,94,.35) inset; }
.fko__row_conflict { box-shadow: 0 0 0 2px rgba(234,179,8,.35) inset; }
.fko__row_added { box-shadow: 0 0 0 2px rgba(56,189,248,.35) inset; }
.fko__row_edited { box-shadow: 0 0 0 2px rgba(168,85,247,.35) inset; }
.fko__row_match { outline: 2px solid rgba(59,130,246,.45); }

@media (max-width: 1100px) {
  .fko { max-height: 380px; }
}
</style>
