<script setup lang="ts">
import type { JsonValue } from "~/utils/mergeJson/json";
import type { Highlight } from "~/utils/mergeJson/highlight";

type Pane = "A" | "B" | "R";

const props = defineProps<{
  label: string;
  value: JsonValue;
  path: string;
  depth: number;
  opened: Set<string>;
  selected?: string;

  pane: Pane;
  onPick?: (path: string, from: "A" | "B") => void;
  onReset?: (path: string) => void;

  highlightByLeaf?: (path: string) => Highlight;
  matchByLeaf?: (path: string) => boolean;

  filter?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
}>();

const emit = defineEmits<{
  (e: "toggle", path: string): void;
  (e: "select", path: string): void;
}>();

function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

const isArray = computed(() => Array.isArray(props.value));
const isObject = computed(() => isPlainObject(props.value));
const isBranch = computed(() => isArray.value || isObject.value);
const open = computed(() => props.opened.has(props.path));
const isSelected = computed(() => props.selected === props.path);
const isRoot = computed(() => props.path === "");

function toggle() {
  emit("toggle", props.path);
}

function select() {
  emit("select", props.path);
}

const highlight = computed(() => props.highlightByLeaf?.(props.path) ?? null);
const match = computed(() => props.matchByLeaf?.(props.path) === true);

function jsonScalar(v: any) {
  return JSON.stringify(v);
}

function openToken(v: JsonValue) {
  if (Array.isArray(v)) return "[";
  if (isPlainObject(v)) return "{";
  return jsonScalar(v);
}

function closeToken(v: JsonValue) {
  if (Array.isArray(v)) return "]";
  if (isPlainObject(v)) return "}";
  return "";
}

function isLeafValue(v: any) {
  return !(Array.isArray(v) || isPlainObject(v));
}

const entries = computed(() => {
  if (isArray.value) return (props.value as JsonValue[]).map((v, i) => [String(i), v] as const);
  if (isObject.value) return Object.entries(props.value as Record<string, JsonValue>);
  return [];
});

function childPath(k: string) {
  return props.path ? `${props.path}.${k}` : k;
}

function selfMatchesFilterLeaf(path: string) {
  const f = props.filter;
  if (!f) return true;
  return (path || "root").toLowerCase().includes(f);
}

function selfMatchesOnlyDiffLeaf(path: string) {
  if (!props.onlyDiff) return true;
  return props.diffSet?.has(path) ?? false;
}

function branchHasAnyDiff(prefixPath: string) {
  if (!props.onlyDiff) return true;
  if (!props.diffSet) return false;
  const prefix = prefixPath ? prefixPath + "." : "";
  for (const k of props.diffSet) {
    if (k === prefixPath || k.startsWith(prefix)) return true;
  }
  return false;
}

function branchHasAnyFilterHit(prefixPath: string) {
  const f = props.filter;
  if (!f) return true;
  const low = (prefixPath || "root").toLowerCase();
  if (low.includes(f)) return true;

  const pref = prefixPath ? prefixPath.toLowerCase() + "." : "";
  for (const [k] of entries.value) {
    const p = pref ? `${pref}${k.toLowerCase()}` : k.toLowerCase();
    if (p.includes(f)) return true;
  }
  return true;
}

const visible = computed(() => {
  if (!isBranch.value) return selfMatchesFilterLeaf(props.path) && selfMatchesOnlyDiffLeaf(props.path);
  return branchHasAnyDiff(props.path) && branchHasAnyFilterHit(props.path);
});

function onPick(from: "A" | "B") {
  if (!props.path) return;
  props.onPick?.(props.path, from);
  emit("select", props.path);
}

function onReset() {
  if (!props.path) return;
  props.onReset?.(props.path);
  emit("select", props.path);
}

const indentStyle = computed(() => ({
  paddingLeft: `${props.depth * 14}px`,
}));
</script>

<template>
  <div v-if="visible" class="jttn">
    <div
        class="jttn__row"
        :class="{
        jttn__row_root: isRoot,
        jttn__row_active: isSelected,
        jttn__row_new: highlight === 'new',
        jttn__row_conflict: highlight === 'conflict',
        jttn__row_added: highlight === 'added',
        jttn__row_edited: highlight === 'edited',
        jttn__row_match: match
      }"
        :style="indentStyle"
        @click="isBranch ? toggle() : select()"
        role="button"
        tabindex="0"
    >
      <span class="jttn__twisty" v-if="isBranch">
        <span class="jttn__twistyIcon">{{ open ? "▼" : "▶" }}</span>
      </span>
      <span class="jttn__twisty" v-else>
        <span class="jttn__twistyIcon">•</span>
      </span>

      <span class="jttn__code">
        <template v-if="!isRoot">
          <span class="jttn__key">"{{ label }}"</span><span class="jttn__colon">: </span>
        </template>

        <template v-if="isBranch">
          <span class="jttn__token">{{ openToken(value) }}</span>
        </template>
        <template v-else>
          <span class="jttn__token">{{ jsonScalar(value) }}</span>
        </template>
      </span>

      <span class="jttn__actions" v-if="!isBranch && path">
        <button v-if="pane === 'A'" class="jttn__btn" type="button" @click.stop="onPick('A')">Use A</button>
        <button v-else-if="pane === 'B'" class="jttn__btn" type="button" @click.stop="onPick('B')">Use B</button>
        <button v-else class="jttn__btn jttn__btn_ghost" type="button" @click.stop="onReset">Reset</button>
      </span>
    </div>

    <div v-if="isBranch && open" class="jttn__children">
      <JsonTreeNode
          v-for="[k, v] in entries"
          :key="childPath(k)"
          :label="k"
          :value="v"
          :path="childPath(k)"
          :depth="depth + 1"
          :opened="opened"
          :selected="selected"
          :filter="filter"
          :only-diff="onlyDiff"
          :diff-set="diffSet"
          :highlight-by-leaf="highlightByLeaf"
          :match-by-leaf="matchByLeaf"
          :pane="pane"
          :on-pick="onPick ? onPick : undefined"
          :on-reset="onReset ? onReset : undefined"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
      />

      <div class="jttn__row jttn__row_closer" :style="indentStyle">
        <span class="jttn__twisty"></span>
        <span class="jttn__code">
          <span class="jttn__token">{{ closeToken(value) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.jttn {
  min-width: 0;
}

.jttn__row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  color: var(--ui-text);
  cursor: pointer;
  user-select: none;
}

.jttn__row_root {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

.jttn__row_closer {
  cursor: default;
  border-style: dashed;
  opacity: 0.9;
}

.jttn__row_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.jttn__twisty {
  width: 18px;
  display: inline-flex;
  justify-content: center;
}

.jttn__twistyIcon {
  font-weight: 900;
  opacity: 0.9;
}

.jttn__code {
  min-width: 0;
  display: inline-flex;
  gap: 4px;
  align-items: baseline;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.45;
  overflow: hidden;
}

.jttn__key {
  font-weight: 900;
  white-space: nowrap;
}

.jttn__colon {
  opacity: 0.8;
  white-space: nowrap;
}

.jttn__token {
  opacity: 0.95;
  white-space: pre-wrap;
  word-break: break-word;
}

.jttn__actions {
  margin-left: auto;
  display: inline-flex;
  gap: 8px;
  flex: 0 0 auto;
}

.jttn__btn {
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ui-text);
  font-weight: 900;
  font-size: 12px;
  cursor: pointer;
}

.jttn__btn_ghost {
  background: rgba(0, 0, 0, 0.10);
}

.jttn__children {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.jttn__row_new { box-shadow: 0 0 0 2px rgba(34,197,94,.35) inset; }
.jttn__row_conflict { box-shadow: 0 0 0 2px rgba(234,179,8,.35) inset; }
.jttn__row_added { box-shadow: 0 0 0 2px rgba(56,189,248,.35) inset; }
.jttn__row_edited { box-shadow: 0 0 0 2px rgba(168,85,247,.35) inset; }
.jttn__row_match { outline: 2px solid rgba(59,130,246,.45); }

@media (max-width: 1100px) {
  .jttn__row {
    padding: 8px 9px;
    gap: 8px;
  }
  .jttn__btn {
    height: 28px;
  }
}
</style>
