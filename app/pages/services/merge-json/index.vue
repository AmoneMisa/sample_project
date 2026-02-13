<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import FileInput from "~/components/common/FileInput.vue";
import JsonTreeView from "~/components/common/JsonTreeView.vue";
import FlatKeyList from "~/components/common/FlatKeyList.vue";

type Truth = "A" | "B";
type SortMode = "asc" | "desc";
type ViewMode = "json" | "raw" | "flatkeys";

type JsonValue = null | boolean | number | string | JsonValue[] | Record<string, JsonValue>;
type Status = "same" | "diff" | "onlyA" | "onlyB";

const { t } = useI18n();

const truth = ref<Truth>("A");
const sortMode = ref<SortMode>("asc");
const viewMode = ref<ViewMode>("json");

const onlyDiff = ref(false);
const filter = ref("");

const selectedKey = ref<string>(""); // leaf path always in dot form for all modes

// raw text buffers
const textA = ref<string>("{}");
const textB = ref<string>("{}");
const textR = ref<string>("{}");

// parsed objects
const jsonA = ref<JsonValue>({});
const jsonB = ref<JsonValue>({});
const jsonR = ref<JsonValue>({}); // derived for raw mode preview (optional)

const errorA = ref<string | null>(null);
const errorB = ref<string | null>(null);
const errorR = ref<string | null>(null);

// overrides (mix A/B + edit Result)
const overrides = reactive<Record<string, string | undefined>>({});

// ----------------- utils -----------------
function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function safeParseJson(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    const v = JSON.parse(text);
    return { ok: true, value: v };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Invalid JSON" };
  }
}

function detectJsonMode(obj: any): "flat" | "tree" {
  if (!isPlainObject(obj)) return "tree";
  const keys = Object.keys(obj);
  const looksFlat = keys.some((k) => k.includes("."));
  return looksFlat ? "flat" : "tree";
}

function buildTreeFromFlat(obj: Record<string, any>) {
  const root: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const parts = k.split(".").filter(Boolean);
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const last = i === parts.length - 1;
      if (last) cur[p] = v;
      else {
        if (!isPlainObject(cur[p])) cur[p] = {};
        cur = cur[p];
      }
    }
  }
  return root;
}

function normalizeLoadedJson(obj: any) {
  if (detectJsonMode(obj) === "flat") return buildTreeFromFlat(obj);
  return obj;
}

async function loadJsonFromFile(file: File) {
  const text = await file.text();
  const parsed = safeParseJson(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return { text, obj: normalizeLoadedJson(parsed.value) as JsonValue };
}

function getByPath(root: any, path: string): any {
  if (!path) return root;
  const parts = path.split(".").filter(Boolean);
  let cur = root;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setByPath(root: any, path: string, value: any) {
  const parts = path.split(".").filter(Boolean);
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const last = i === parts.length - 1;
    if (last) cur[p] = value;
    else {
      if (!isPlainObject(cur[p])) cur[p] = {};
      cur = cur[p];
    }
  }
}

function cloneDeep(v: any) {
  return JSON.parse(JSON.stringify(v));
}

function collectLeafPaths(root: any, prefix = "", out: string[] = []) {
  if (isPlainObject(root)) {
    for (const [k, v] of Object.entries(root)) {
      if (k === "_meta") continue;
      const next = prefix ? `${prefix}.${k}` : k;
      collectLeafPaths(v, next, out);
    }
    return out;
  }
  if (Array.isArray(root)) {
    root.forEach((v, i) => {
      const next = prefix ? `${prefix}.${i}` : String(i);
      collectLeafPaths(v, next, out);
    });
    return out;
  }
  out.push(prefix);
  return out;
}

function leafStatus(path: string): Status {
  const a = getByPath(jsonA.value as any, path);
  const b = getByPath(jsonB.value as any, path);

  const hasA = a !== undefined;
  const hasB = b !== undefined;
  if (hasA && !hasB) return "onlyA";
  if (!hasA && hasB) return "onlyB";

  const sa = a == null ? "" : String(a);
  const sb = b == null ? "" : String(b);
  return sa === sb ? "same" : "diff";
}

const diffSet = computed(() => {
  const set = new Set<string>();
  const keys = new Set<string>([
    ...collectLeafPaths(jsonA.value as any),
    ...collectLeafPaths(jsonB.value as any),
  ]);

  for (const k of keys) {
    if (leafStatus(k) !== "same") set.add(k);
  }
  return set;
});

const allLeafKeys = computed(() => {
  const keys = new Set<string>([
    ...collectLeafPaths(jsonA.value as any),
    ...collectLeafPaths(jsonB.value as any),
  ]);
  const arr = Array.from(keys);
  arr.sort((x, y) => x.localeCompare(y));
  if (sortMode.value === "desc") arr.reverse();
  return arr;
});

// ---------- result (tree) ----------
const resultTree = computed<JsonValue>(() => {
  const base = cloneDeep(truth.value === "A" ? jsonA.value : jsonB.value);
  const other = truth.value === "A" ? jsonB.value : jsonA.value;

  // add missing leaves from other
  for (const k of allLeafKeys.value) {
    const cur = getByPath(base as any, k);
    if (cur === undefined) {
      const ov = getByPath(other as any, k);
      if (ov !== undefined) setByPath(base as any, k, ov);
    }
    if (overrides[k] !== undefined) setByPath(base as any, k, overrides[k]);
  }
  return base;
});

// ---------- selected values ----------
const selectedA = computed(() => {
  const v = getByPath(jsonA.value as any, selectedKey.value);
  return v === undefined ? "" : String(v);
});
const selectedB = computed(() => {
  const v = getByPath(jsonB.value as any, selectedKey.value);
  return v === undefined ? "" : String(v);
});
const selectedR = computed({
  get() {
    const k = selectedKey.value;
    if (!k) return "";
    if (overrides[k] !== undefined) return String(overrides[k]);
    const v = getByPath(resultTree.value as any, k);
    return v === undefined ? "" : String(v);
  },
  set(v: string) {
    if (!selectedKey.value) return;
    overrides[selectedKey.value] = v;
  }
});

// ---------- actions ----------
function useA() {
  if (!selectedKey.value) return;
  overrides[selectedKey.value] = selectedA.value;
}
function useB() {
  if (!selectedKey.value) return;
  overrides[selectedKey.value] = selectedB.value;
}
function resetSelected() {
  if (!selectedKey.value) return;
  delete overrides[selectedKey.value];
}

function takeAllFrom(which: Truth) {
  truth.value = which;
  // “полностью выбрать сторону” = очистить микс
  for (const k of Object.keys(overrides)) delete overrides[k];
}

function validateRawAll() {
  errorA.value = null; errorB.value = null; errorR.value = null;

  const pa = safeParseJson(textA.value);
  if (!pa.ok) errorA.value = pa.error;
  const pb = safeParseJson(textB.value);
  if (!pb.ok) errorB.value = pb.error;
  const pr = safeParseJson(textR.value);
  if (!pr.ok) errorR.value = pr.error;

  if (pa.ok) jsonA.value = normalizeLoadedJson(pa.value);
  if (pb.ok) jsonB.value = normalizeLoadedJson(pb.value);
  if (pr.ok) jsonR.value = normalizeLoadedJson(pr.value);
}

watch(viewMode, (m) => {
  // при переключении в raw — синхронизируем текст из текущих объектов
  if (m === "raw") {
    textA.value = JSON.stringify(jsonA.value, null, 2);
    textB.value = JSON.stringify(jsonB.value, null, 2);
    textR.value = JSON.stringify(resultTree.value, null, 2);
    validateRawAll();
  }
});

// ---------- file handlers ----------
async function onFilesA(files: File[]) {
  errorA.value = null;
  try {
    if (!files.length) return;
    const { text, obj } = await loadJsonFromFile(files[0]);
    textA.value = text;
    jsonA.value = obj;
    if (viewMode.value === "raw") validateRawAll();
  } catch (e: any) {
    errorA.value = e?.message || t("services.mergeJSON.errors.invalidFile");
  }
}

async function onFilesB(files: File[]) {
  errorB.value = null;
  try {
    if (!files.length) return;
    const { text, obj } = await loadJsonFromFile(files[0]);
    textB.value = text;
    jsonB.value = obj;
    if (viewMode.value === "raw") validateRawAll();
  } catch (e: any) {
    errorB.value = e?.message || t("services.mergeJSON.errors.invalidFile");
  }
}

// ---------- export (always nested tree) ----------
function downloadResultJson() {
  // всегда сохраняем деревом
  const payload = resultTree.value;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.json";
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <u-container class="merge">
    <div class="merge__header background-hero text-center space-y-3">
      <PageHeader title="services.mergeJSON.title" headline="services.mergeJSON.headline" class="mb-6" />
      <p class="merge__subtitle text-muted mx-auto">
        {{ t("services.mergeJSON.subtitle") }}
      </p>
    </div>

    <section class="merge__card">
      <div class="merge__toolbar">
        <FileInput
            label-key="services.mergeJSON.inputs.fileA"
            :error="errorA"
            hint-key="services.mergeJSON.inputs.hint"
            @files="onFilesA"
        />
        <FileInput
            label-key="services.mergeJSON.inputs.fileB"
            :error="errorB"
            hint-key="services.mergeJSON.inputs.hint"
            @files="onFilesB"
        />

        <div class="merge__group">
          <div class="merge__group-label">{{ t("services.mergeJSON.controls.view") }}</div>
          <div class="merge__group-row">
            <CustomButton variant="ghost" :_class="`merge__chip ${viewMode==='json' ? 'merge__chip_active' : ''}`" @click="viewMode='json'">
              JSON
            </CustomButton>
            <CustomButton variant="ghost" :_class="`merge__chip ${viewMode==='raw' ? 'merge__chip_active' : ''}`" @click="viewMode='raw'">
              Raw
            </CustomButton>
            <CustomButton variant="ghost" :_class="`merge__chip ${viewMode==='flatkeys' ? 'merge__chip_active' : ''}`" @click="viewMode='flatkeys'">
              Flat keys
            </CustomButton>
          </div>
        </div>

        <div class="merge__group">
          <div class="merge__group-label">{{ t("services.mergeJSON.controls.truth") }}</div>
          <div class="merge__group-row">
            <CustomButton variant="secondary" :_class="`merge__chip ${truth==='A' ? 'merge__chip_active' : ''}`" @click="truth='A'">
              {{ t("services.mergeJSON.controls.truthA") }}
            </CustomButton>
            <CustomButton variant="secondary" :_class="`merge__chip ${truth==='B' ? 'merge__chip_active' : ''}`" @click="truth='B'">
              {{ t("services.mergeJSON.controls.truthB") }}
            </CustomButton>
          </div>
        </div>

        <div class="merge__group">
          <div class="merge__group-label">{{ t("services.mergeJSON.controls.sort") }}</div>
          <div class="merge__group-row">
            <CustomButton variant="ghost" :_class="`merge__chip ${sortMode==='asc' ? 'merge__chip_active' : ''}`" @click="sortMode='asc'">
              {{ t("services.mergeJSON.controls.sortAsc") }}
            </CustomButton>
            <CustomButton variant="ghost" :_class="`merge__chip ${sortMode==='desc' ? 'merge__chip_active' : ''}`" @click="sortMode='desc'">
              {{ t("services.mergeJSON.controls.sortDesc") }}
            </CustomButton>
          </div>
        </div>

        <label class="merge__toggle">
          <input type="checkbox" v-model="onlyDiff" />
          {{ t("services.mergeJSON.controls.onlyDiff") }}
        </label>

        <UInput
            v-model="filter"
            class="merge__search"
            :placeholder="t('services.mergeJSON.controls.filterPh')"
        />

        <div class="merge__spacer" />

        <CustomButton variant="secondary" :_class="'merge__btn'" @click="takeAllFrom('A')">
          {{ t("services.mergeJSON.actions.takeAllA") }}
        </CustomButton>
        <CustomButton variant="secondary" :_class="'merge__btn'" @click="takeAllFrom('B')">
          {{ t("services.mergeJSON.actions.takeAllB") }}
        </CustomButton>

        <CustomButton variant="primary" :_class="'merge__btn'" @click="downloadResultJson">
          {{ t("services.mergeJSON.actions.downloadJson") }}
        </CustomButton>
      </div>

      <!-- BODY -->
      <div class="merge__body">
        <!-- LEFT: key browser -->
        <div class="merge__browser">
          <div class="merge__browser-title">
            {{ viewMode === 'flatkeys' ? 'Flat keys' : 'JSON Tree' }}
          </div>

          <div v-if="viewMode === 'json'" class="merge__browser-body">
            <JsonTreeView
                v-model="selectedKey"
                :value="resultTree"
                :sort="sortMode"
                :filter="filter"
                :only-diff="onlyDiff"
                :diff-set="diffSet"
                :status-by-leaf="(p) => leafStatus(p)"
            />
          </div>

          <div v-else-if="viewMode === 'flatkeys'" class="merge__browser-body">
            <FlatKeyList
                v-model="selectedKey"
                :keys="allLeafKeys"
                :filter="filter"
                :only-diff="onlyDiff"
                :diff-set="diffSet"
                :status-by-key="(k) => leafStatus(k)"
            />
          </div>

          <div v-else class="merge__browser-body">
            <!-- raw mode: тут можно показать подсказку -->
            <div class="merge__hint">
              Raw mode: редактируешь JSON текстом. Ошибки подсвечиваются под textarea.
            </div>
          </div>
        </div>

        <!-- RIGHT: 3 textarea -->
        <div class="merge__edit">
          <div class="merge__edit-top">
            <div class="merge__picked" v-if="selectedKey">
              <span class="merge__picked-label">Selected:</span>
              <span class="merge__picked-key">{{ selectedKey }}</span>
            </div>

            <div class="merge__actions">
              <CustomButton variant="secondary" :_class="'merge__btn'" :disabled="!selectedKey" @click="useA">
                {{ t("services.mergeJSON.row.useA") }}
              </CustomButton>
              <CustomButton variant="secondary" :_class="'merge__btn'" :disabled="!selectedKey" @click="useB">
                {{ t("services.mergeJSON.row.useB") }}
              </CustomButton>
              <CustomButton variant="ghost" :_class="'merge__btn'" :disabled="!selectedKey" @click="resetSelected">
                {{ t("services.mergeJSON.row.reset") }}
              </CustomButton>
            </div>
          </div>

          <div class="merge__three">
            <div class="merge__box">
              <div class="merge__box-title">{{ t("services.mergeJSON.table.colA") }}</div>

              <textarea
                  v-if="viewMode==='raw'"
                  class="merge__ta"
                  v-model="textA"
                  rows="10"
                  @input="validateRawAll"
              />
              <textarea
                  v-else
                  class="merge__ta"
                  :value="selectedA"
                  rows="10"
                  readonly
              />

              <div v-if="viewMode==='raw' && errorA" class="merge__err">{{ errorA }}</div>
            </div>

            <div class="merge__box">
              <div class="merge__box-title">{{ t("services.mergeJSON.table.colB") }}</div>

              <textarea
                  v-if="viewMode==='raw'"
                  class="merge__ta"
                  v-model="textB"
                  rows="10"
                  @input="validateRawAll"
              />
              <textarea
                  v-else
                  class="merge__ta"
                  :value="selectedB"
                  rows="10"
                  readonly
              />

              <div v-if="viewMode==='raw' && errorB" class="merge__err">{{ errorB }}</div>
            </div>

            <div class="merge__box">
              <div class="merge__box-title">{{ t("services.mergeJSON.table.colResult") }}</div>

              <textarea
                  v-if="viewMode==='raw'"
                  class="merge__ta"
                  v-model="textR"
                  rows="10"
                  @input="validateRawAll"
              />
              <textarea
                  v-else
                  class="merge__ta"
                  v-model="selectedR"
                  rows="10"
                  :readonly="!selectedKey"
              />

              <div v-if="viewMode==='raw' && errorR" class="merge__err">{{ errorR }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </u-container>
</template>

<style scoped>
.merge { padding-top: 24px; padding-bottom: 96px; }
.merge__subtitle { max-width: 760px; font-size: 14px; }

.merge__card {
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.merge__toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
.merge__spacer { flex: 1 1 auto; }
.merge__btn { height: 34px; }

.merge__chip { height: 32px; padding: 0 12px; border-radius: 999px; }
.merge__chip_active { background-color: var(--color-primary); }

.merge__group {
  display: flex; flex-direction: column; gap: 6px;
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
}

.merge__group-label { font-weight: 900; font-size: 12px; color: var(--ui-text-muted); }
.merge__group-row { display: flex; gap: 8px; flex-wrap: wrap; }

.merge__toggle {
  display: inline-flex; gap: 8px; align-items: center;
  font-size: 12px; font-weight: 900; color: var(--ui-text-muted);
  padding: 8px 10px; border-radius: 14px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.02);
}

.merge__search { min-width: 240px; }

.merge__body {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.15fr 1.85fr;
  gap: 12px;
  min-width: 0;
}

.merge__browser, .merge__edit {
  border-radius: 16px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  padding: 10px;
  min-width: 0;
}

.merge__browser-title, .merge__box-title {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
  margin-bottom: 8px;
}

.merge__browser-body {
  max-height: 70vh;
  overflow: auto;
  padding-right: 6px;
  scrollbar-width: thin;
}

.merge__hint { font-size: 12px; opacity: .75; }

.merge__edit-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.merge__picked { display: inline-flex; gap: 8px; align-items: center; }
.merge__picked-label { font-weight: 900; font-size: 12px; opacity: .75; }
.merge__picked-key { font-weight: 900; font-size: 12px; word-break: break-word; }

.merge__actions { display: flex; gap: 8px; flex-wrap: wrap; }

.merge__three {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.merge__box { min-width: 0; }

.merge__ta {
  width: 100%;
  border-radius: 14px;
  padding: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  color: var(--ui-text);
  outline: none;
  resize: vertical;
  min-height: 220px;
  font-size: 12px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.merge__ta:focus {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.merge__err {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  color: var(--error);
  opacity: .95;
}

@media (max-width: 980px) {
  .merge__body { grid-template-columns: 1fr; }
  .merge__three { grid-template-columns: 1fr; }
}
</style>
