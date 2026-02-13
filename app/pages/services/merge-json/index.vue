<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import FileInput from "~/components/common/FileInput.vue";
import ValueWindow from "~/components/common/ValueWindow.vue";

type Truth = "A" | "B";
type Choice = "A" | "B" | "CUSTOM";
type SortMode = "asc" | "desc";
type ViewMode = "flat" | "tree";
type RowStatus = "same" | "diff" | "onlyA" | "onlyB";
const rowHeight = ref(260);
const viewportHeight = ref(720);
const scrollTop = ref(0);

const listRef = ref<HTMLElement | null>(null);
function csvEscapeCell(s: string) {
  const v = s ?? "";
  const mustQuote = /[",\n\r;]/.test(v);
  if (!mustQuote) return v;
  return `"${v.replace(/"/g, '""')}"`;
}

function toCsvKeyValue(map: Record<string, string>) {
  const lines: string[] = [];
  lines.push(["key", "value"].map(csvEscapeCell).join(","));

  const keys = Object.keys(map);
  keys.sort((a, b) => a.localeCompare(b));
  if (sortMode.value === "desc") keys.reverse();

  for (const k of keys) {
    lines.push([csvEscapeCell(k), csvEscapeCell(map[k] ?? "")].join(","));
  }
  return lines.join("\n");
}

function xmlEscapeText(s: string) {
  return (s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
}

// Android string: нужно экранировать апострофы/кавычки, но “по жизни” главное — &,<,>
// Плюс: Android не любит необработанные переносы — лучше оставить как \n
function androidEscapeValue(s: string) {
  const v = (s ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return xmlEscapeText(v).replace(/\n/g, "\\n");
}

function toAndroidStringsXml(map: Record<string, string>) {
  const keys = Object.keys(map);
  keys.sort((a, b) => a.localeCompare(b));
  if (sortMode.value === "desc") keys.reverse();

  const lines: string[] = [];
  lines.push(`<?xml version="1.0" encoding="utf-8"?>`);
  lines.push(`<resources>`);

  for (const k of keys) {
    const name = xmlEscapeText(k);
    const value = androidEscapeValue(map[k] ?? "");
    lines.push(`  <string name="${name}">${value}</string>`);
  }

  lines.push(`</resources>`);
  return lines.join("\n");
}

function downloadAndroidXml() {
  const xml = toAndroidStringsXml(resultFlat.value);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "strings.xml";
  a.click();

  URL.revokeObjectURL(url);
}


function downloadCsv() {
  const csv = toCsvKeyValue(resultFlat.value);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.csv";
  a.click();

  URL.revokeObjectURL(url);
}

function onScroll() {
  if (!listRef.value) return;
  scrollTop.value = listRef.value.scrollTop;
}

function updateRowHeightByWidth() {
  const w = window.innerWidth;
  rowHeight.value = w <= 980 ? 420 : 260;
}

function measureViewport() {
  if (!listRef.value) return;
  viewportHeight.value = listRef.value.clientHeight;
  updateRowHeightByWidth();
}

onMounted(() => {
  nextTick(measureViewport);
  window.addEventListener("resize", measureViewport);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", measureViewport);
});
const overscan = computed(() => 8);

const totalRows = computed(() => visibleRows.value.length);

const startIndex = computed(() => {
  const s = Math.floor(scrollTop.value / rowHeight.value) - overscan.value;
  return Math.max(0, s);
});

const endIndex = computed(() => {
  const e = Math.ceil((scrollTop.value + viewportHeight.value) / rowHeight.value) + overscan.value;
  return Math.min(totalRows.value, e);
});

const virtualRows = computed(() => visibleRows.value.slice(startIndex.value, endIndex.value));

const padTop = computed(() => startIndex.value * rowHeight.value);
const padBottom = computed(() => (totalRows.value - endIndex.value) * rowHeight.value);

type Row = {
  key: string;
  a?: string;
  b?: string;
};

type RowState = {
  choice: Choice;
  result: string;
};

const {t} = useI18n();

// --------------------
// state
// --------------------
const mapA = ref<Record<string, string>>({});
const mapB = ref<Record<string, string>>({});

const fileErrorA = ref<string | null>(null);
const fileErrorB = ref<string | null>(null);

const truth = ref<Truth>("A");
const sortMode = ref<SortMode>("asc");
const onlyDiff = ref(false);
const viewMode = ref<ViewMode>("tree");

const filter = ref("");
const copiedAll = ref(false);
const copiedRowKey = ref<string | null>(null);

// дерево/сворачивание
const collapsed = reactive(new Set<string>());

// overrides + result
const state = reactive<Record<string, RowState>>({});

// вложенность
type NestIssue = { kind: "leaf_conflicts_with_parent"; leaf: string; parent: string };
const nestingIssuesA = ref<NestIssue[]>([]);
const nestingIssuesB = ref<NestIssue[]>([]);
const nestingIssuesR = ref<NestIssue[]>([]);

// --------------------
// utils: object checks
// --------------------
function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// --------------------
// parsers
// --------------------
function detectJsonMode(obj: any): "flat" | "tree" {
  if (!isPlainObject(obj)) return "flat";
  const keys = Object.keys(obj);
  const looksFlat = keys.some((k) => k.includes("."));
  return looksFlat ? "flat" : "tree";
}

function flattenTreeToStrings(tree: any, prefix = "", out: Record<string, string> = {}) {
  if (isPlainObject(tree)) {
    for (const [k, v] of Object.entries(tree)) {
      if (k === "_meta") continue;
      const next = prefix ? `${prefix}.${k}` : k;
      flattenTreeToStrings(v, next, out);
    }
    return out;
  }
  out[prefix] = tree == null ? "" : String(tree);
  return out;
}

function buildTreeFromFlatStrings(flat: Record<string, string>) {
  const root: any = {};
  for (const [key, val] of Object.entries(flat)) {
    const parts = key.split(".").filter(Boolean);
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const last = i === parts.length - 1;
      if (last) cur[p] = val;
      else {
        if (!isPlainObject(cur[p])) cur[p] = {};
        cur = cur[p];
      }
    }
  }
  return root;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (ch === "," || ch === ";")) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  row.push(cell);
  rows.push(row);

  return rows.filter((r) => r.some((x) => x.trim() !== ""));
}

type CsvPolicy = "lastWins" | "firstWins" | "lastNonEmptyWins";

function csvToFlatMap(text: string, policy: CsvPolicy = "lastWins"): Record<string, string> {
  const rows = parseCsv(text);
  if (!rows.length) return {};

  const header = rows[0].map((x) => x.trim().toLowerCase());
  const hasHeader = header.includes("key") && (header.includes("value") || header.includes("text"));

  const start = hasHeader ? 1 : 0;
  const map: Record<string, string> = {};

  for (let i = start; i < rows.length; i++) {
    const r = rows[i].map((x) => x ?? "");
    const trimmed = r.map((x) => x.trim());

    const firstIsIndex = /^\d+$/.test(trimmed[0]) && trimmed.length >= 3;

    let key = "";
    let value = "";

    if (firstIsIndex) {
      key = trimmed[1] ?? "";
      value = trimmed[2] ?? "";
    } else {
      key = trimmed[0] ?? "";
      value = trimmed[1] ?? "";
      // key,lang,value
      if (trimmed.length >= 3 && trimmed[1].length <= 5) value = trimmed[2] ?? "";
    }

    if (!key) continue;

    if (policy === "firstWins") {
      if (map[key] === undefined) map[key] = value;
    } else if (policy === "lastNonEmptyWins") {
      if (value !== "" || map[key] === undefined) map[key] = value;
    } else {
      map[key] = value;
    }
  }

  return map;
}

function xmlToFlatMap(text: string): Record<string, string> {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) return {};

  const map: Record<string, string> = {};

  // Android-like <string name="key">value</string>
  doc.querySelectorAll("string[name]").forEach((el) => {
    const key = el.getAttribute("name")?.trim() || "";
    if (!key) return;
    const value = (el.textContent ?? "").trim();
    map[key] = value;
  });

  return map;
}

function normalizeKey(k: string) {
  return (k ?? "").trim();
}

function normalizeValue(v: any) {
  return v == null ? "" : String(v);
}

function normalizeMap(m: Record<string, any>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(m || {})) {
    const key = normalizeKey(k);
    if (!key) continue;
    out[key] = normalizeValue(v);
  }
  return out;
}

async function loadFileAsFlatMap(file: File): Promise<Record<string, string>> {
  const text = await file.text();
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    const obj = JSON.parse(text);
    const mode = detectJsonMode(obj);
    if (mode === "flat") return normalizeMap(obj);
    return normalizeMap(flattenTreeToStrings(obj));
  }

  if (ext === "csv") return normalizeMap(csvToFlatMap(text, "lastWins"));
  if (ext === "xml") return normalizeMap(xmlToFlatMap(text));

  // fallback
  const obj = JSON.parse(text);
  const mode = detectJsonMode(obj);
  if (mode === "flat") return normalizeMap(obj);
  return normalizeMap(flattenTreeToStrings(obj));
}

// --------------------
// nesting validity
// --------------------
function computeNestingIssues(keys: string[]): NestIssue[] {
  const set = new Set(keys);
  const issues: NestIssue[] = [];

  for (const k of keys) {
    const parts = k.split(".").filter(Boolean);
    for (let d = 1; d < parts.length; d++) {
      const parent = parts.slice(0, d).join(".");
      if (set.has(parent)) {
        issues.push({kind: "leaf_conflicts_with_parent", leaf: k, parent});
        break;
      }
    }
  }
  return issues;
}

// --------------------
// rows + tree helpers
// --------------------
function getStatus(a?: string, b?: string): RowStatus {
  const hasA = a !== undefined;
  const hasB = b !== undefined;
  if (hasA && !hasB) return "onlyA";
  if (!hasA && hasB) return "onlyB";
  return (a ?? "") === (b ?? "") ? "same" : "diff";
}

function computeFolders(keys: string[]) {
  const folders = new Set<string>();
  for (const k of keys) {
    const parts = k.split(".").filter(Boolean);
    for (let d = 1; d < parts.length; d++) folders.add(parts.slice(0, d).join("."));
  }
  return folders;
}

function isHiddenByCollapse(key: string, collapsedSet: Set<string>) {
  const parts = key.split(".").filter(Boolean);
  for (let d = 1; d < parts.length; d++) {
    const prefix = parts.slice(0, d).join(".");
    if (collapsedSet.has(prefix)) return true;
  }
  return false;
}

function depth(key: string) {
  return key.split(".").filter(Boolean).length;
}

function parentPrefix(key: string) {
  const parts = key.split(".").filter(Boolean);
  parts.pop();
  return parts.join(".");
}

// --------------------
// computed rows
// --------------------
const allKeys = computed(() => {
  const keys = new Set<string>([...Object.keys(mapA.value), ...Object.keys(mapB.value)]);
  return Array.from(keys);
});

const folders = computed(() => computeFolders(allKeys.value));

const rows = computed<Row[]>(() => {
  const list = allKeys.value.map((k) => ({
    key: k,
    a: mapA.value[k],
    b: mapB.value[k],
  }));

  list.sort((x, y) => x.key.localeCompare(y.key));
  if (sortMode.value === "desc") list.reverse();
  return list;
});

const visibleRows = computed(() => {
  const f = filter.value.trim().toLowerCase();

  return rows.value.filter((r) => {
    if (f && !r.key.toLowerCase().includes(f)) return false;

    const st = getStatus(r.a, r.b);
    if (onlyDiff.value && st === "same") return false;

    if (isHiddenByCollapse(r.key, collapsed)) return false;

    return true;
  });
});

// --------------------
// apply truth + per-row state
// --------------------
function defaultStateForKey(key: string): RowState {
  const a = mapA.value[key];
  const b = mapB.value[key];

  const hasA = a !== undefined;
  const hasB = b !== undefined;

  if (hasA && !hasB) return {choice: "A", result: a ?? ""};
  if (!hasA && hasB) return {choice: "B", result: b ?? ""};

  // both exist
  if ((a ?? "") === (b ?? "")) return {choice: "A", result: a ?? ""};
  return truth.value === "A"
      ? {choice: "A", result: a ?? ""}
      : {choice: "B", result: b ?? ""};
}

function ensureStateKeys() {
  for (const k of allKeys.value) {
    if (!state[k]) state[k] = defaultStateForKey(k);
  }
}

function applyTruthToAllConflicts() {
  for (const r of rows.value) {
    const st = getStatus(r.a, r.b);
    if (st !== "diff") continue;
    if (state[r.key]?.choice === "CUSTOM") continue;
    state[r.key] = defaultStateForKey(r.key);
  }
  recomputeResultNesting();
}

function setChoice(key: string, choice: "A" | "B") {
  const a = mapA.value[key] ?? "";
  const b = mapB.value[key] ?? "";
  state[key] = {choice, result: choice === "A" ? a : b};
  recomputeResultNesting();
}

function resetKey(key: string) {
  state[key] = defaultStateForKey(key);
  recomputeResultNesting();
}

function setCustom(key: string, v: string) {
  state[key] = {choice: "CUSTOM", result: v};
  recomputeResultNesting();
}

function recomputeResultNesting() {
  const keys = Object.keys(resultFlat.value);
  nestingIssuesR.value = computeNestingIssues(keys);
}

const resultFlat = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  for (const k of allKeys.value) out[k] = state[k]?.result ?? "";
  return out;
});

// --------------------
// file handlers
// --------------------
async function onFilesA(files: File[]) {
  fileErrorA.value = null;
  try {
    if (!files.length) return;
    const map = await loadFileAsFlatMap(files[0]);
    mapA.value = map;
    nestingIssuesA.value = computeNestingIssues(Object.keys(map));
    ensureStateKeys();
    recomputeResultNesting();
  } catch {
    fileErrorA.value = t("services.mergeJSON.errors.invalidFile");
  }
}

async function onFilesB(files: File[]) {
  fileErrorB.value = null;
  try {
    if (!files.length) return;
    const map = await loadFileAsFlatMap(files[0]);
    mapB.value = map;
    nestingIssuesB.value = computeNestingIssues(Object.keys(map));
    ensureStateKeys();
    recomputeResultNesting();
  } catch {
    fileErrorB.value = t("services.mergeJSON.errors.invalidFile");
  }
}

watch([mapA, mapB, truth], () => {
  ensureStateKeys();
}, {deep: false});

// --------------------
// collapse controls
// --------------------
function toggleFolder(prefix: string) {
  if (collapsed.has(prefix)) collapsed.delete(prefix);
  else collapsed.add(prefix);
}

function collapseAll() {
  // свернуть все папки
  collapsed.clear();
  for (const f of folders.value) collapsed.add(f);
}

function expandAll() {
  collapsed.clear();
}

// --------------------
// export / copy
// --------------------
function payloadForExport() {
  return viewMode.value === "tree"
      ? buildTreeFromFlatStrings(resultFlat.value)
      : resultFlat.value;
}

function downloadJson() {
  const payload = payloadForExport();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = viewMode.value === "tree" ? "merged.tree.json" : "merged.flat.json";
  a.click();

  URL.revokeObjectURL(url);
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(payloadForExport(), null, 2));
    copiedAll.value = true;
    setTimeout(() => (copiedAll.value = false), 900);
  } catch {
    // ignore
  }
}

function onRowCopied(_v: string, key: string) {
  copiedRowKey.value = key;
  setTimeout(() => (copiedRowKey.value = null), 900);
}

// --------------------
// bulk
// --------------------
function takeAllFrom(which: "A" | "B") {
  for (const k of allKeys.value) {
    if (which === "A" && mapA.value[k] !== undefined) setChoice(k, "A");
    else if (which === "B" && mapB.value[k] !== undefined) setChoice(k, "B");
  }
}

function fillMissingFrom(which: "A" | "B") {
  const src = which === "A" ? mapA.value : mapB.value;
  for (const k of allKeys.value) {
    const cur = state[k]?.result ?? "";
    if (cur === "" && src[k] !== undefined) setChoice(k, which);
  }
}

// --------------------
// counters
// --------------------
const counts = computed(() => {
  let same = 0, diff = 0, onlyA = 0, onlyB = 0;
  for (const r of rows.value) {
    const st = getStatus(r.a, r.b);
    if (st === "same") same++;
    else if (st === "diff") diff++;
    else if (st === "onlyA") onlyA++;
    else onlyB++;
  }
  return {same, diff, onlyA, onlyB, total: rows.value.length};
});

function indentStyle(key: string) {
  const d = Math.max(1, depth(key));
  return {paddingLeft: `${(d - 1) * 12}px`};
}
</script>

<template>
  <u-container class="merge">
    <div class="merge__header background-hero text-center space-y-3">
      <PageHeader
          title="services.mergeJSON.title"
          headline="services.mergeJSON.headline"
          class="mb-6"
      />
      <p class="merge__subtitle text-muted mx-auto">
        {{ t("services.mergeJSON.subtitle") }}
      </p>
    </div>

    <section class="merge__card">
      <div class="merge__top">
        <div class="merge__toolbar">
          <FileInput
              label-key="services.mergeJSON.inputs.fileA"
              :error="fileErrorA"
              hint-key="services.mergeJSON.inputs.hint"
              @files="onFilesA"
          />
          <FileInput
              label-key="services.mergeJSON.inputs.fileB"
              :error="fileErrorB"
              hint-key="services.mergeJSON.inputs.hint"
              @files="onFilesB"
          />

          <div class="merge__group">
            <div class="merge__group-label">{{ t("services.mergeJSON.controls.truth") }}</div>
            <div class="merge__group-row">
              <CustomButton
                  variant="secondary"
                  :_class="`merge__chip ${truth === 'A' ? 'merge__chip_active' : ''}`"
                  @click="truth = 'A'; applyTruthToAllConflicts()"
              >
                {{ t("services.mergeJSON.controls.truthA") }}
              </CustomButton>
              <CustomButton
                  variant="secondary"
                  :_class="`merge__chip ${truth === 'B' ? 'merge__chip_active' : ''}`"
                  @click="truth = 'B'; applyTruthToAllConflicts()"
              >
                {{ t("services.mergeJSON.controls.truthB") }}
              </CustomButton>
            </div>
          </div>

          <div class="merge__group">
            <div class="merge__group-label">{{ t("services.mergeJSON.controls.sort") }}</div>
            <div class="merge__group-row">
              <CustomButton
                  variant="ghost"
                  :_class="`merge__chip ${sortMode === 'asc' ? 'merge__chip_active' : ''}`"
                  @click="sortMode = 'asc'"
              >
                {{ t("services.mergeJSON.controls.sortAsc") }}
              </CustomButton>
              <CustomButton
                  variant="ghost"
                  :_class="`merge__chip ${sortMode === 'desc' ? 'merge__chip_active' : ''}`"
                  @click="sortMode = 'desc'"
              >
                {{ t("services.mergeJSON.controls.sortDesc") }}
              </CustomButton>
            </div>
          </div>

          <div class="merge__group">
            <div class="merge__group-label">{{ t("services.mergeJSON.controls.view") }}</div>
            <div class="merge__group-row">
              <CustomButton
                  variant="ghost"
                  :_class="`merge__chip ${viewMode === 'tree' ? 'merge__chip_active' : ''}`"
                  @click="viewMode = 'tree'"
              >
                {{ t("services.mergeJSON.viewMode.tree") }}
              </CustomButton>
              <CustomButton
                  variant="ghost"
                  :_class="`merge__chip ${viewMode === 'flat' ? 'merge__chip_active' : ''}`"
                  @click="viewMode = 'flat'"
              >
                {{ t("services.mergeJSON.viewMode.flat") }}
              </CustomButton>
            </div>
          </div>

          <label class="merge__toggle">
            <input type="checkbox" v-model="onlyDiff"/>
            {{ t("services.mergeJSON.controls.onlyDiff") }}
          </label>

          <UInput
              v-model="filter"
              class="merge__search"
              :placeholder="t('services.mergeJSON.controls.filterPh')"
          />

          <div class="merge__spacer"/>

          <CustomButton variant="secondary" :_class="'merge__btn'" :disabled="rows.length === 0"
                        @click="takeAllFrom('A')">
            {{ t("services.mergeJSON.actions.takeAllA") }}
          </CustomButton>
          <CustomButton variant="secondary" :_class="'merge__btn'" :disabled="rows.length === 0"
                        @click="takeAllFrom('B')">
            {{ t("services.mergeJSON.actions.takeAllB") }}
          </CustomButton>
          <CustomButton variant="ghost" :_class="'merge__btn'" :disabled="rows.length === 0"
                        @click="fillMissingFrom('A')">
            {{ t("services.mergeJSON.actions.fillMissingA") }}
          </CustomButton>
          <CustomButton variant="ghost" :_class="'merge__btn'" :disabled="rows.length === 0"
                        @click="fillMissingFrom('B')">
            {{ t("services.mergeJSON.actions.fillMissingB") }}
          </CustomButton>

          <CustomButton variant="ghost" :_class="'merge__btn'" :disabled="rows.length === 0" @click="collapseAll">
            {{ t("services.mergeJSON.actions.collapseAll") }}
          </CustomButton>
          <CustomButton variant="ghost" :_class="'merge__btn'" :disabled="rows.length === 0" @click="expandAll">
            {{ t("services.mergeJSON.actions.expandAll") }}
          </CustomButton>

          <CustomButton variant="primary" :_class="'merge__btn'" :disabled="rows.length === 0" @click="downloadJson">
            {{ t("services.mergeJSON.actions.downloadJson") }}
          </CustomButton>
          <CustomButton variant="primary" :_class="'merge__btn'" :disabled="rows.length === 0" @click="downloadCsv">
            {{ t("services.mergeJSON.actions.downloadCsv") }}
          </CustomButton>
          <CustomButton variant="primary" :_class="'merge__btn'" :disabled="rows.length === 0" @click="downloadAndroidXml">
            {{ t("services.mergeJSON.actions.downloadXml") }}
          </CustomButton>

          <CustomButton variant="primary" :_class="'merge__btn'" :disabled="rows.length === 0" @click="copyAll">
            {{ copiedAll ? t("services.mergeJSON.actions.copied") : t("services.mergeJSON.actions.copyAll") }}
          </CustomButton>
        </div>

        <div class="merge__meta">
          <span>{{ t("services.mergeJSON.meta.total") }}: <b>{{ counts.total }}</b></span>
          <span class="merge__dot">•</span>
          <span>{{ t("services.mergeJSON.meta.diff") }}: <b>{{ counts.diff }}</b></span>
          <span class="merge__dot">•</span>
          <span>{{ t("services.mergeJSON.meta.same") }}: <b>{{ counts.same }}</b></span>
          <span class="merge__dot">•</span>
          <span>{{ t("services.mergeJSON.meta.onlyA") }}: <b>{{ counts.onlyA }}</b></span>
          <span class="merge__dot">•</span>
          <span>{{ t("services.mergeJSON.meta.onlyB") }}: <b>{{ counts.onlyB }}</b></span>
        </div>

        <div v-if="nestingIssuesA.length || nestingIssuesB.length || nestingIssuesR.length" class="merge__nest">
          <div class="merge__nest-title">{{ t("services.mergeJSON.nesting.title") }}</div>

          <div v-if="nestingIssuesA.length" class="merge__nest-block">
            <div class="merge__nest-label">{{ t("services.mergeJSON.nesting.fileA") }}</div>
            <div class="merge__nest-list">
              <div v-for="(x, i) in nestingIssuesA.slice(0, 6)" :key="`a-${i}`" class="merge__nest-item">
                {{ t("services.mergeJSON.nesting.issue", {parent: x.parent, leaf: x.leaf}) }}
              </div>
              <div v-if="nestingIssuesA.length > 6" class="merge__nest-more">
                {{ t("services.mergeJSON.nesting.more", {n: nestingIssuesA.length - 6}) }}
              </div>
            </div>
          </div>

          <div v-if="nestingIssuesB.length" class="merge__nest-block">
            <div class="merge__nest-label">{{ t("services.mergeJSON.nesting.fileB") }}</div>
            <div class="merge__nest-list">
              <div v-for="(x, i) in nestingIssuesB.slice(0, 6)" :key="`b-${i}`" class="merge__nest-item">
                {{ t("services.mergeJSON.nesting.issue", {parent: x.parent, leaf: x.leaf}) }}
              </div>
              <div v-if="nestingIssuesB.length > 6" class="merge__nest-more">
                {{ t("services.mergeJSON.nesting.more", {n: nestingIssuesB.length - 6}) }}
              </div>
            </div>
          </div>

          <div v-if="nestingIssuesR.length" class="merge__nest-block">
            <div class="merge__nest-label">{{ t("services.mergeJSON.nesting.result") }}</div>
            <div class="merge__nest-list">
              <div v-for="(x, i) in nestingIssuesR.slice(0, 6)" :key="`r-${i}`" class="merge__nest-item">
                {{ t("services.mergeJSON.nesting.issue", {parent: x.parent, leaf: x.leaf}) }}
              </div>
              <div v-if="nestingIssuesR.length > 6" class="merge__nest-more">
                {{ t("services.mergeJSON.nesting.more", {n: nestingIssuesR.length - 6}) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="merge__grid-head">
        <div>{{ t("services.mergeJSON.table.colA") }}</div>
        <div>{{ t("services.mergeJSON.table.colB") }}</div>
        <div>{{ t("services.mergeJSON.table.colResult") }}</div>
      </div>

      <div
          ref="listRef"
          class="merge__rows merge__rows_virtual"
          @scroll.passive="onScroll"
      >
        <div :style="{ height: padTop + 'px' }"/>
        <div
            v-for="r in virtualRows"
            :key="r.key"
            class="merge__row"
        >
          <div class="merge__keyline">
            <button
                v-if="folders.has(r.key)"
                class="merge__fold"
                type="button"
                @click="toggleFolder(r.key)"
                :title="collapsed.has(r.key) ? t('services.mergeJSON.tree.expand') : t('services.mergeJSON.tree.collapse')"
            >
              {{ collapsed.has(r.key) ? "▸" : "▾" }}
            </button>
            <span class="merge__key" :style="indentStyle(r.key)">
              {{ r.key }}
            </span>

            <span v-if="folders.has(parentPrefix(r.key))" class="merge__subhint">
              <!-- просто визуально -->
            </span>

            <span class="merge__status">
              {{ t(`services.mergeJSON.badges.${getStatus(r.a, r.b)}`) }}
            </span>

            <div class="merge__key-actions">
              <CustomButton
                  variant="secondary"
                  :_class="'merge__mini'"
                  type="button"
                  @click="setChoice(r.key, 'A')"
                  :disabled="r.a === undefined"
              >
                {{ t("services.mergeJSON.row.useA") }}
              </CustomButton>
              <CustomButton
                  variant="secondary"
                  :_class="'merge__mini'"
                  type="button"
                  @click="setChoice(r.key, 'B')"
                  :disabled="r.b === undefined"
              >
                {{ t("services.mergeJSON.row.useB") }}
              </CustomButton>
              <CustomButton
                  variant="ghost"
                  :_class="'merge__mini'"
                  type="button"
                  @click="resetKey(r.key)"
              >
                {{ t("services.mergeJSON.row.reset") }}
              </CustomButton>
            </div>
          </div>

          <div class="merge__grid">
            <ValueWindow
                title-key="services.mergeJSON.table.colA"
                :key-text="''"
                :value="r.a ?? ''"
                :readonly="true"
                :active="state[r.key]?.choice === 'A'"
                :status="getStatus(r.a, r.b)"
            />

            <ValueWindow
                title-key="services.mergeJSON.table.colB"
                :key-text="''"
                :value="r.b ?? ''"
                :readonly="true"
                :active="state[r.key]?.choice === 'B'"
                :status="getStatus(r.a, r.b)"
            />

            <ValueWindow
                title-key="services.mergeJSON.table.colResult"
                :key-text="''"
                :value="state[r.key]?.result ?? ''"
                :readonly="false"
                :active="state[r.key]?.choice === 'CUSTOM'"
                :status="getStatus(r.a, r.b)"
                :show-copy="true"
                @update:value="(v) => setCustom(r.key, v)"
                @copy="(v) => onRowCopied(v, r.key)"
            />

            <div v-if="copiedRowKey === r.key" class="merge__copied">
              {{ t("services.mergeJSON.actions.copied") }}
            </div>
          </div>
        </div>
        <div :style="{ height: padBottom + 'px' }"/>
      </div>
    </section>
  </u-container>
</template>

<style scoped>
.merge {
  padding-top: 24px;
  padding-bottom: 96px;
}

.merge__subtitle {
  max-width: 760px;
  font-size: 14px;
}

.merge__card {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.merge__top {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.merge__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}

.merge__spacer {
  flex: 1 1 auto;
}

.merge__btn {
  height: 34px;
}

.merge__mini {
  height: 32px;
  padding: 0 10px;
}

.merge__chip {
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
}

.merge__chip_active {
  background-color: var(--color-primary);
}

.merge__group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
}

.merge__group-label {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.merge__group-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.merge__toggle {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  font-weight: 900;
  color: var(--ui-text-muted);
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
}

.merge__search {
  min-width: 240px;
}

.merge__meta {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 12px;
  color: var(--ui-text-muted);
  font-weight: 900;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
}

.merge__dot {
  opacity: .6;
}

.merge__nest {
  margin-top: 10px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
}

.merge__nest-title {
  font-weight: 900;
  margin-bottom: 8px;
}

.merge__nest-block {
  margin-top: 10px;
}

.merge__nest-label {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
  margin-bottom: 6px;
}

.merge__nest-item {
  font-size: 12px;
  font-weight: 800;
  opacity: .95;
}

.merge__nest-more {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  color: var(--ui-text-muted);
}

/* head */
.merge__grid-head {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.merge__rows {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.merge__rows_virtual {
  max-height: 72vh;
  overflow: auto;
  padding-right: 6px;
  scrollbar-width: thin;
}

.merge__row {
  border-radius: 16px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  padding: 10px;
}

.merge__keyline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.merge__fold {
  height: 28px;
  min-width: 28px;
  border-radius: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
  color: var(--ui-text);
  cursor: pointer;
  font-weight: 900;
}

.merge__key {
  font-weight: 900;
  font-size: 13px;
  word-break: break-word;
}

.merge__status {
  margin-left: auto;
  font-size: 12px;
  font-weight: 900;
  color: var(--ui-text-muted);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
}

.merge__key-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.merge__grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.merge__copied {
  grid-column: 3 / 4;
  margin-top: -6px;
  font-size: 12px;
  font-weight: 900;
  color: var(--ui-text-muted);
}

/* responsive */
@media (max-width: 980px) {
  .merge__grid-head {
    display: none;
  }

  .merge__grid {
    grid-template-columns: 1fr;
  }

  .merge__copied {
    grid-column: 1 / 2;
  }

  .merge__status {
    margin-left: 0;
  }
}

/* light overrides */
.light .merge__card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px) saturate(180%);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12),
  inset 0 1px 0 rgba(255, 255, 255, 0.65),
  inset 0 -4px 12px rgba(0, 0, 0, 0.06),
  inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.light .merge__row,
.light .merge__toggle,
.light .merge__group,
.light .merge__meta,
.light .merge__status,
.light .merge__fold {
  background: rgba(255, 255, 255, 0.65);
  border-color: rgba(0, 0, 0, 0.08);
  color: rgba(21, 22, 42, 0.82);
}
</style>
