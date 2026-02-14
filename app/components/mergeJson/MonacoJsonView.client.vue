<script setup lang="ts">
import type { editor as E } from "monaco-editor";
import { parseTree } from "jsonc-parser";

type ViewMode = "json" | "flat";

type Props = {
  modelValue?: string; // если задан — компонент controlled
  text?: string;       // fallback для readonly/простого режима
  mode: ViewMode;

  selectedKey?: string;
  hiddenKeys?: string[];

  readonly?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  text: "",
  selectedKey: "",
  hiddenKeys: () => [],
  readonly: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "select", key: string): void;
  (e: "ready", api: { openFind: () => void; revealKey: (k: string) => void }): void;
}>();

const el = ref<HTMLDivElement | null>(null);

let monaco: typeof import("monaco-editor") | null = null;
let editor: E.IStandaloneCodeEditor | null = null;
let dec: E.IEditorDecorationsCollection | null = null;

let isProgrammatic = false;

function ensureDec() {
  if (!editor) return;
  if (!dec) dec = editor.createDecorationsCollection();
}

function model() {
  return editor?.getModel() ?? null;
}

function currentText() {
  return props.modelValue ?? props.text ?? "";
}

function posAt(offset: number) {
  const m = model();
  if (!m) return null;
  return m.getPositionAt(offset);
}

function rangeFromOffsets(start: number, end: number) {
  if (!monaco) return null;
  const a = posAt(start);
  const b = posAt(end);
  if (!a || !b) return null;
  return new monaco.Range(a.lineNumber, 1, b.lineNumber, 1);
}

/**
 * JSON: найти node по path и вернуть диапазон (whole line)
 * path: "a.b.0.c"
 */
function getJsonRangeByPath(path: string) {
  if (!editor || props.mode !== "json") return null;
  const m = model();
  if (!m) return null;

  const tree = parseTree(m.getValue());
  if (!tree) return null;

  const parts = path
      .split(".")
      .filter(Boolean)
      .map((p) => (/^\d+$/.test(p) ? Number(p) : p)) as (string | number)[];

  let cur: any = tree;

  for (const seg of parts) {
    if (!cur) return null;

    if (cur.type === "object") {
      const prop = (cur.children ?? []).find(
          (ch: any) => ch.type === "property" && ch.children?.[0]?.value === seg
      );
      if (!prop) return null;
      cur = prop.children?.[1];
      continue;
    }

    if (cur.type === "array") {
      const idx = typeof seg === "number" ? seg : Number(seg);
      if (Number.isNaN(idx)) return null;
      cur = cur.children?.[idx];
      continue;
    }

    return null;
  }

  if (!cur) return null;
  return rangeFromOffsets(cur.offset, cur.offset + cur.length);
}

/**
 * FLAT: ищем строку "path = ..."
 */
function getFlatRangeByPath(path: string) {
  if (!editor || props.mode !== "flat") return null;
  const m = model();
  if (!m) return null;

  const text = m.getValue();
  const needle = `${path} =`;
  let idx = text.indexOf(needle);
  if (idx === -1) {
    idx = text.indexOf(path);
    if (idx === -1) return null;
  }

  const start = idx;
  const end = text.indexOf("\n", idx);
  return rangeFromOffsets(start, end === -1 ? text.length : end);
}

function getRangeByPath(path: string) {
  return props.mode === "json" ? getJsonRangeByPath(path) : getFlatRangeByPath(path);
}

/**
 * JSON: получить полный path по offset клика (точно, через дерево).
 */
function getJsonPathAtOffset(offset: number): string | null {
  const m = model();
  if (!m) return null;

  const tree = parseTree(m.getValue());
  if (!tree) return null;

  const contains = (n: any) => offset >= n.offset && offset <= n.offset + n.length;
  let hit: any = null;

  const walk = (n: any) => {
    if (!n || !contains(n)) return;
    hit = n;
    const kids = n.children ?? [];
    for (const k of kids) walk(k);
  };
  walk(tree);

  if (!hit) return null;

  const segs: (string | number)[] = [];
  let cur: any = hit;

  while (cur && cur.parent) {
    const parent = cur.parent;

    if (parent.type === "property") {
      const keyNode = parent.children?.[0];
      const key = keyNode?.value;
      if (typeof key === "string") segs.push(key);
      cur = parent.parent;
      continue;
    }

    if (parent.type === "array") {
      const idx = (parent.children ?? []).indexOf(cur);
      if (idx >= 0) segs.push(idx);
      cur = parent.parent;
      continue;
    }

    cur = parent;
  }

  if (!segs.length) return null;
  return segs.reverse().join(".");
}

function applySelected() {
  if (!editor || !monaco) return;
  ensureDec();

  const key = props.selectedKey?.trim();
  if (!key) {
    dec!.clear();
    editor.setHiddenAreas([]);
    return;
  }

  const rg = getRangeByPath(key);
  const hidden = (props.hiddenKeys ?? [])
      .map((k) => getRangeByPath(k))
      .filter(Boolean) as any[];

  editor.setHiddenAreas(hidden);

  if (!rg) {
    dec!.clear();
    return;
  }

  dec!.set([
    {
      range: rg,
      options: { isWholeLine: true, className: "jm__hlLine" },
    },
  ]);

  editor.revealRangeInCenter(rg);
}

function openFind() {
  editor?.trigger("keyboard", "actions.find", null);
}

onMounted(async () => {
  if (!el.value) return;

  monaco = await import("monaco-editor");

  editor = monaco.editor.create(el.value, {
    value: currentText(),
    language: props.mode === "json" ? "json" : "plaintext",
    readOnly: props.readonly,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: "on",
    folding: true,
    renderLineHighlight: "none",
    fontSize: 12,
    lineNumbersMinChars: 3,
    padding: { top: 10, bottom: 10 },
  });

  editor.onDidChangeModelContent((e) => {
    if (!editor || props.readonly) return;
    if (e.isFlush || isProgrammatic) return;
    emit("update:modelValue", editor.getValue());
  });

  editor.onMouseDown((e) => {
    if (!editor) return;
    const pos = e.target.position;
    if (!pos) return;

    const m = model();
    if (!m) return;

    if (props.mode === "flat") {
      const line = m.getLineContent(pos.lineNumber);
      const key = line.split("=")[0]?.trim();
      if (key) emit("select", key);
      return;
    }

    const offset = m.getOffsetAt(pos);
    const path = getJsonPathAtOffset(offset);
    if (path) emit("select", path);
  });

  emit("ready", { openFind, revealKey: (k) => emit("select", k) });

  applySelected();
});

watch(
    () => props.readonly,
    (ro) => editor?.updateOptions({ readOnly: ro })
);

watch(
    () => props.mode,
    (mode) => {
      editor?.updateOptions({ language: mode === "json" ? "json" : "plaintext" } as any);
    }
);

watch(
    () => currentText(),
    (v) => {
      if (!editor) return;
      const cur = editor.getValue();
      if (cur === v) return;

      isProgrammatic = true;
      editor.setValue(v);
      isProgrammatic = false;

      applySelected();
    }
);

watch(
    () => [props.selectedKey, props.hiddenKeys, props.mode],
    () => applySelected(),
    { deep: true }
);

onBeforeUnmount(() => {
  editor?.dispose();
  editor = null;
  monaco = null;
});
</script>

<template>
  <div class="jm" ref="el" />
</template>

<style scoped>
.jm {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
}
:global(.jm__hlLine) {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35) inset;
}
</style>
