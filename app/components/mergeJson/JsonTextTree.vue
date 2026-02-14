<script setup lang="ts">
import type { JsonValue } from "~/utils/mergeJson/json";

type Highlight = "new" | "conflict" | "added" | "edited" | null;

type Line =
    | { kind: "open"; path: string; indent: number; keyLabel: string | null; brace: "{" | "["; summary: string; highlight: Highlight; match: boolean }
    | { kind: "close"; path: string; indent: number; brace: "}" | "]" }
    | { kind: "leaf"; path: string; indent: number; keyLabel: string | null; text: string; highlight: Highlight; match: boolean };

const props = defineProps<{
  value: JsonValue;
  basePath?: string;
  selected?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
  query?: string;
  minify?: boolean;
  highlightByLeaf?: (path: string) => Highlight;
  onPickPath?: (path: string) => void;
}>();

const emit = defineEmits<{
  (e: "select", path: string): void;
}>();

const q = computed(() => (props.query || "").trim().toLowerCase());

const opened = reactive(new Set<string>([""]));
function isOpen(path: string) {
  return opened.has(path);
}
function toggle(path: string) {
  if (opened.has(path)) opened.delete(path);
  else opened.add(path);
}

function pathJoin(base: string, part: string) {
  if (!base) return part;
  if (!part) return base;
  return `${base}.${part}`;
}

function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function jsonInline(v: any) {
  return props.minify ? JSON.stringify(v) : JSON.stringify(v);
}

function leafText(v: any) {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return jsonInline(v);
}

function hasDiffUnder(path: string) {
  if (! Furious) return false;
  const set = props.diffSet;
  if (!set) return false;
  if (set.has(path)) return true;
  const prefix = path ? path + "." : "";
  for (const k of set) {
    if (prefix ? k.startsWith(prefix) : true) return true;
  }
  return false;
}

function selfMatches(path: string, v: any) {
  if (!q.value) return false;
  if (path.toLowerCase().includes(q.value)) return true;
  const s = String(v ?? "").toLowerCase();
  return s.includes(q.value);
}

function isVisiblePath(path: string) {
  if (!props.onlyDiff) return true;
  if (!props.diffSet) return false;
  if (props.diffSet.has(path)) return true;
  const prefix = path ? path + "." : "";
  for (const k of props.diffSet) {
    if (k === path || k.startsWith(prefix)) return true;
  }
  return false;
}

function valueSummary(v: any) {
  if (Array.isArray(v)) return `[${v.length}]`;
  if (isPlainObject(v)) return `{${Object.keys(v).length}}`;
  return "";
}

function buildLines(v: any, path: string, indent: number, keyLabel: string | null, out: Line[]) {
  const h = props.highlightByLeaf?.(path) ?? null;
  const m = selfMatches(path, v);

  const isObj = isPlainObject(v);
  const isArr = Array.isArray(v);

  if (!isObj && !isArr) {
    if (!isVisiblePath(path) && !m) return;
    out.push({ kind: "leaf", path, indent, keyLabel, text: leafText(v), highlight: h, match: m });
    return;
  }

  if (!isVisiblePath(path) && !m) return;

  const brace: "{" | "[" = isArr ? "[" : "{";
  const close: "}" | "]" = isArr ? "]" : "}";
  const openPath = path || "";
  const openedNow = isOpen(openPath);
  out.push({ kind: "open", path: openPath, indent, keyLabel, brace, summary: valueSummary(v), highlight: h, match: m });

  if (!openedNow) {
    out.push({ kind: "close", path: openPath, indent, brace: close });
    return;
  }

  if (isArr) {
    const arr = v as any[];
    for (let i = 0; i < arr.length; i++) {
      const childPath = path ? `${path}.${i}` : String(i);
      buildLines(arr[i], childPath, indent + 1, null, out);
    }
  } else {
    const obj = v as Record<string, any>;
    const keys = Object.keys(obj);
    keys.sort((a, b) => a.localeCompare(b));
    for (const k of keys) {
      const childPath = path ? `${path}.${k}` : k;
      buildLines(obj[k], childPath, indent + 1, k, out);
    }
  }

  out.push({ kind: "close", path: openPath, indent, brace: close });
}

const lines = computed<Line[]>(() => {
  const out: Line[] = [];
  buildLines(props.value, props.basePath || "", 0, null, out);
  return out;
});

const lineRefs = shallowRef<Record<string, HTMLElement | null>>({});

function setRef(key: string, el: HTMLElement | null) {
  const map = lineRefs.value;
  map[key] = el;
  lineRefs.value = map;
}

function ensureOpenForPath(path: string) {
  const parts = path.split(".").filter(Boolean);
  let cur = "";
  opened.add(cur);
  for (const p of parts) {
    cur = cur ? `${cur}.${p}` : p;
    opened.add(cur);
  }
}

function pick(path: string) {
  emit("select", path);
  props.onPickPath?.(path);
}

function scrollToSelected() {
  const path = props.selected || "";
  if (!path) return;
  ensureOpenForPath(path);
  nextTick(() => {
    const el = lineRefs.value[`leaf:${path}`] || lineRefs.value[`open:${path}`] || null;
    el?.scrollIntoView({ block: "center", inline: "nearest" });
  });
}

watch(() => props.selected, scrollToSelected);
watch(() => props.query, () => {
  if (!props.query?.trim()) return;
  const match = lines.value.find((l) => (l.kind === "leaf" || l.kind === "open") && l.match);
  if (!match) return;
  const p = match.path;
  ensureOpenForPath(p);
  nextTick(() => {
    const el = lineRefs.value[`${match.kind}:${p}`] || null;
    el?.scrollIntoView({ block: "center", inline: "nearest" });
  });
});

const maxIndent = computed(() => {
  let m = 0;
  for (const l of lines.value) m = Math.max(m, l.indent);
  return m;
});

function indentStyle(n: number) {
  return { paddingLeft: `${n * 18}px` };
}

function rowClass(h: Highlight, match: boolean, isSelected: boolean) {
  return {
    jtt__row: true,
    jtt__row_active: isSelected,
    jtt__row_new: h === "new",
    jtt__row_conflict: h === "conflict",
    jtt__row_added: h === "added",
    jtt__row_edited: h === "edited",
    jtt__row_match: match,
  };
}

function keyPrefix(label: string | null) {
  if (!label) return "";
  return JSON.stringify(label) + ": ";
}
</script>

<template>
  <div class="jtt">
    <div
        v-for="(l, idx) in lines"
        :key="`${l.kind}:${l.path}:${idx}`"
        :ref="(el) => (l.kind === 'leaf' || l.kind === 'open') ? setRef(`${l.kind}:${l.path}`, el as any) : null"
        :class="l.kind === 'leaf' || l.kind === 'open' ? rowClass(l.kind === 'close' ? null : (l as any).highlight, l.kind === 'close' ? false : (l as any).match, selected === l.path) : 'jtt__close'"
        :style="indentStyle(l.indent)"
        @click="l.kind === 'leaf' ? pick(l.path) : (l.kind === 'open' ? pick(l.path) : undefined)"
    >
      <template v-if="l.kind === 'open'">
        <button class="jtt__toggle" type="button" @click.stop="toggle(l.path)">
          {{ isOpen(l.path) ? "▾" : "▸" }}
        </button>
        <span class="jtt__text">
          <span class="jtt__key">{{ keyPrefix(l.keyLabel) }}</span>
          <span class="jtt__brace">{{ l.brace }}</span>
          <span class="jtt__summary">{{ l.summary }}</span>
        </span>
      </template>

      <template v-else-if="l.kind === 'close'">
        <span class="jtt__text">
          <span class="jtt__brace">{{ l.brace }}</span>
        </span>
      </template>

      <template v-else>
        <span class="jtt__dot">•</span>
        <span class="jtt__text">
          <span class="jtt__key">{{ keyPrefix(l.keyLabel) }}</span>
          <span class="jtt__leaf">{{ l.text }}</span>
        </span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.jtt {
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

.jtt__row,
.jtt__close {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  padding: 6px 8px;
  color: var(--ui-text);
  user-select: none;
}

.jtt__row {
  cursor: pointer;
}

.jtt__close {
  opacity: 0.9;
}

.jtt__toggle {
  width: 26px;
  height: 22px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text);
  cursor: pointer;
  flex: 0 0 auto;
}

.jtt__dot {
  width: 26px;
  display: inline-flex;
  justify-content: center;
  opacity: 0.8;
  flex: 0 0 auto;
}

.jtt__text {
  display: inline-flex;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
}

.jtt__key {
  font-weight: 900;
  opacity: 0.95;
}

.jtt__brace {
  font-weight: 900;
  opacity: 0.9;
}

.jtt__summary {
  opacity: 0.6;
  font-weight: 800;
}

.jtt__leaf {
  opacity: 0.9;
  word-break: break-word;
  white-space: pre-wrap;
}

.jtt__row_active {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.jtt__row_new { box-shadow: 0 0 0 2px rgba(34,197,94,.35) inset; }
.jtt__row_conflict { box-shadow: 0 0 0 2px rgba(234,179,8,.35) inset; }
.jtt__row_added { box-shadow: 0 0 0 2px rgba(56,189,248,.35) inset; }
.jtt__row_edited { box-shadow: 0 0 0 2px rgba(168,85,247,.35) inset; }
.jtt__row_match { outline: 2px solid rgba(59,130,246,.45); }

@media (max-width: 1100px) {
  .jtt { max-height: 380px; }
}
</style>
