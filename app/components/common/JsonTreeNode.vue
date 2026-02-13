<script setup lang="ts">
type JsonValue = null | boolean | number | string | JsonValue[] | Record<string, JsonValue>;
type Status = "same" | "diff" | "onlyA" | "onlyB";

const props = defineProps<{
  label: string;
  value: JsonValue;
  path: string;
  opened: Set<string>;
  selected?: string;

  // filtering / diff
  filter?: string;                 // lowercased
  onlyDiff?: boolean;
  diffSet?: Set<string>;           // leaf paths that are "not same"
  statusByLeaf?: (path: string) => Status | null; // for badges on leaf
}>();

const emit = defineEmits<{
  (e: "toggle", path: string): void;
  (e: "select", path: string): void;
}>();

const isObject = computed(() => props.value && typeof props.value === "object" && !Array.isArray(props.value));
const isArray = computed(() => Array.isArray(props.value));
const isBranch = computed(() => isObject.value || isArray.value);

const open = computed(() => props.opened.has(props.path));
const selected = computed(() => props.selected === props.path);

function toggle() {
  emit("toggle", props.path);
}
function select() {
  emit("select", props.path);
}

function preview(v: JsonValue) {
  if (v === null) return "null";
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length}]`;
  return `{${Object.keys(v).length}}`;
}

const entries = computed(() => {
  if (isArray.value) return (props.value as JsonValue[]).map((v, i) => [String(i), v] as const);
  if (isObject.value) return Object.entries(props.value as Record<string, JsonValue>);
  return [];
});

const leafStatus = computed(() => {
  if (isBranch.value) return null;
  return props.statusByLeaf?.(props.path) ?? null;
});

// ----- visibility (filter + onlyDiff pruning) -----
function selfMatchesFilter() {
  if (!props.filter) return true;
  const p = (props.path || "root").toLowerCase();
  return p.includes(props.filter);
}

function selfMatchesOnlyDiff() {
  if (!props.onlyDiff) return true;
  // leaf is visible if in diffSet
  if (!isBranch.value) return props.diffSet?.has(props.path) ?? false;

  // branch visible if it has any diff leaf under it (cheap prefix check)
  if (!props.diffSet) return false;
  const prefix = props.path ? props.path + "." : "";
  for (const k of props.diffSet) {
    if (k === props.path || k.startsWith(prefix)) return true;
  }
  return false;
}

const visible = computed(() => {
  // if branch, allow it when it matches itself OR any child matches (handled by child rendering);
  // we still need to show branch row if any child survives.
  if (!isBranch.value) {
    return selfMatchesFilter() && selfMatchesOnlyDiff();
  }

  // branch: show if itself matches filter or has any child that would be visible
  if (!selfMatchesOnlyDiff()) return false;

  if (!props.filter) return true;

  // need to check if any descendant could match filter
  const f = props.filter;
  const prefix = props.path ? props.path.toLowerCase() + "." : "";
  // if current path matches already -> ok
  if (selfMatchesFilter()) return true;

  // try quick check by scanning children labels (no deep traversal cost explosion)
  for (const [k] of entries.value) {
    const childPath = prefix ? `${prefix}${k.toLowerCase()}` : k.toLowerCase();
    if (childPath.includes(f)) return true;
  }
  // fallback: still render children; if none visible, it will appear empty — we hide it via computed below
  return true;
});

const anyVisibleChild = computed(() => {
  if (!isBranch.value) return false;
  // if no filters, always true when branch
  if (!props.filter && !props.onlyDiff) return entries.value.length > 0;

  const prefix = props.path ? props.path + "." : "";
  for (const [k, v] of entries.value) {
    const childPath = prefix ? `${prefix}${k}` : k;
    const childIsBranch = v && typeof v === "object";
    if (!childIsBranch) {
      // leaf
      const okFilter = !props.filter || childPath.toLowerCase().includes(props.filter);
      const okDiff = !props.onlyDiff || (props.diffSet?.has(childPath) ?? false);
      if (okFilter && okDiff) return true;
    } else {
      // branch: optimistic; let it render and decide
      // but for onlyDiff we can use prefix scan
      if (!props.onlyDiff) return true;
      if (!props.diffSet) continue;
      const childPrefix = childPath + ".";
      for (const kk of props.diffSet) {
        if (kk === childPath || kk.startsWith(childPrefix)) return true;
      }
    }
  }
  // also allow if this node itself matches filter (so user sees the branch row)
  return selfMatchesFilter();
});

const showBranch = computed(() => {
  if (!isBranch.value) return visible.value;
  // show branch only if it has any visible child OR it matches filter itself
  if (!visible.value) return false;
  return anyVisibleChild.value || selfMatchesFilter();
});
</script>

<template>
  <div v-if="!isBranch ? visible : showBranch" class="jt__item">
    <button
        class="jt__row"
        :class="{
        jt__row_branch: isBranch,
        jt__row_leaf: !isBranch,
        jt__row_active: selected
      }"
        type="button"
        @click="isBranch ? toggle() : select()"
        :title="path"
    >
      <span class="jt__icon" v-if="isBranch">{{ open ? "▾" : "▸" }}</span>
      <span class="jt__icon" v-else>•</span>

      <span class="jt__label">{{ label || "root" }}</span>

      <span class="jt__value">{{ preview(value) }}</span>

      <span v-if="leafStatus" class="jt__badge" :data-kind="leafStatus">
        {{ $t(`services.mergeJSON.badges.${leafStatus}`) }}
      </span>

      <span class="jt__path">{{ path }}</span>
    </button>

    <div v-if="isBranch && open" class="jt__children">
      <JsonTreeNode
          v-for="[k, v] in entries"
          :key="`${path}.${k}`"
          :label="k"
          :value="v"
          :path="path ? `${path}.${k}` : k"
          :opened="opened"
          :selected="selected"
          :filter="filter"
          :only-diff="onlyDiff"
          :diff-set="diffSet"
          :status-by-leaf="statusByLeaf"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.jt__row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text);
  cursor: pointer;
  text-align: left;
}

.jt__row_leaf { background: rgba(0, 0, 0, 0.10); }

.jt__row_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.jt__icon {
  width: 18px;
  text-align: center;
  opacity: .9;
  font-weight: 900;
}

.jt__label { font-weight: 900; }

.jt__value {
  opacity: .75;
  font-weight: 800;
  font-size: 12px;
}

.jt__badge {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 900;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text-muted);
}

.jt__path {
  margin-left: auto;
  opacity: .55;
  font-weight: 800;
  font-size: 12px;
}

.jt__children {
  margin-left: 18px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
