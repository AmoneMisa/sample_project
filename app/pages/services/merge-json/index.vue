<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import FileInput from "~/components/common/FileInput.vue";
import JsonTreeView from "~/components/mergeJson/JsonTreeView.vue";
import AddKeyModal from "~/components/mergeJson/AddKeyModal.vue";
import MonacoJsonView from "~/components/mergeJson/MonacoJsonView.client.vue";

import {
  getByPath,
  setByPath,
  cloneDeep,
  collectLeafPaths,
  normalizeLoadedJson,
  loadJsonFromFile,
  safeParseJson,
} from "~/utils/mergeJson/json";
import type { JsonValue } from "~/utils/mergeJson/json";
import { makeDiffSet, leafStatus } from "~/utils/mergeJson/diff";
import type { Truth } from "~/utils/mergeJson/pick";
import { matchesInPane } from "~/utils/mergeJson/search";

import CustomCheckbox from "~/components/common/CustomCheckbox.vue";
import CustomInput from "~/components/common/CustomInput.vue";

type SortMode = "asc" | "desc";
type ViewMode = "json" | "tree" | "flat";
type Pane = "A" | "B" | "R";

const { t } = useI18n();

const viewMode = ref<ViewMode>("json");
const minify = ref(false);

const truth = ref<Truth>("A");
const sortMode = ref<SortMode>("asc");

const onlyDiff = ref(false);
const query = ref("");

const searchInValue = ref(true);
const syncSearch = ref(false);

const selectedKey = ref("");

const errorA = ref<string | null>(null);
const errorB = ref<string | null>(null);
const errorR = ref<string | null>(null);

const jsonA = ref<JsonValue>({});
const jsonB = ref<JsonValue>({});

/** Result — истина */
const resultTextJson = ref<string>("{}");
const resultObj = ref<JsonValue>({});
const isDirty = ref(false);

function jsonStringify(v: any) {
  return minify.value ? JSON.stringify(v) : JSON.stringify(v, null, 2);
}

/** авто-результат (когда “reset”, “takeAllFrom”, загрузка файлов) */
const autoResultTree = computed<JsonValue>(() => {
  const base = cloneDeep(truth.value === "A" ? jsonA.value : jsonB.value);
  const other = truth.value === "A" ? jsonB.value : jsonA.value;

  const keys = new Set<string>([
    ...collectLeafPaths(jsonA.value as any),
    ...collectLeafPaths(jsonB.value as any),
  ]);

  for (const k of keys) {
    const cur = getByPath(base as any, k);
    if (cur === undefined) {
      const ov = getByPath(other as any, k);
      if (ov !== undefined) setByPath(base as any, k, ov);
    }
  }

  return base;
});

function setResultFromAuto() {
  const txt = jsonStringify(autoResultTree.value);
  resultTextJson.value = txt;
  const parsed = safeParseJson(txt);
  resultObj.value = parsed.ok ? (parsed.value as JsonValue) : {};
  errorR.value = null;
  isDirty.value = false;
}

/** A/B diff (для onlyDiff) */
const diffSet = computed(() => makeDiffSet(jsonA.value, jsonB.value));
const statusByLeaf = (p: string) => leafStatus(jsonA.value, jsonB.value, p);

/** union keys для скрытия */
const allLeafKeys = computed(() => {
  const keys = new Set<string>([
    ...collectLeafPaths(jsonA.value as any),
    ...collectLeafPaths(jsonB.value as any),
    ...collectLeafPaths(resultObj.value as any),
  ]);
  const arr = Array.from(keys).filter(Boolean);
  arr.sort((a, b) => a.localeCompare(b));
  if (sortMode.value === "desc") arr.reverse();
  return arr;
});

/** match для поиска */
const matchCfg = (pane: Pane) => ({
  aRoot: jsonA.value,
  bRoot: jsonB.value,
  rRoot: resultObj.value,
  pane,
  path: "",
  query: query.value,
  searchInValue: searchInValue.value,
  syncSearch: syncSearch.value,
});

function match(pane: Pane, path: string) {
  return matchesInPane({ ...matchCfg(pane), path });
}

watch(query, (v) => {
  if (!v.trim()) return;
  const keys = allLeafKeys.value;
  const found = keys.find((k) => match("R", k));
  if (found && found !== selectedKey.value) selectedKey.value = found;
});

/** Скрытые ключи для viewer (onlyDiff + search) */
function hiddenKeysForPane(pane: Pane) {
  const keys = allLeafKeys.value;
  return keys.filter((k) => {
    if (onlyDiff.value && !diffSet.value.has(k)) return true;
    if (query.value.trim() && !match(pane, k)) return true;
    return false;
  });
}

/** flat: a.b.c = "..." */
function toFlatText(root: any) {
  const keys = collectLeafPaths(root as any);
  keys.sort((a, b) => a.localeCompare(b));
  if (sortMode.value === "desc") keys.reverse();

  const lines: string[] = [];
  for (const k of keys) {
    if (!k) continue;
    const v = getByPath(root, k);
    lines.push(`${k} = ${JSON.stringify(v)}`);
  }
  return lines.join("\n");
}

function parseFlatTextToTree(text: string): { ok: true; value: JsonValue } | { ok: false; error: string } {
  const out: any = {};
  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const idx = raw.indexOf("=");
    if (idx === -1) return { ok: false, error: `Line ${i + 1}: expected "="` };

    const key = raw.slice(0, idx).trim();
    const valStr = raw.slice(idx + 1).trim();
    if (!key) return { ok: false, error: `Line ${i + 1}: empty key` };

    const parsed = safeParseJson(valStr);
    if (!parsed.ok) return { ok: false, error: `Line ${i + 1}: ${parsed.error}` };

    setByPath(out, key, parsed.value);
  }

  return { ok: true, value: out as JsonValue };
}

/** viewer texts */
const viewTextA = computed(() => (viewMode.value === "flat" ? toFlatText(jsonA.value) : jsonStringify(jsonA.value)));
const viewTextB = computed(() => (viewMode.value === "flat" ? toFlatText(jsonB.value) : jsonStringify(jsonB.value)));

/** Result editor text depends on viewMode */
const resultTextFlat = computed(() => toFlatText(resultObj.value));

/** actions */
function useA() {
  if (!selectedKey.value) return;
  const v = getByPath(jsonA.value as any, selectedKey.value);
  if (v === undefined) return;
  patchResultValue(selectedKey.value, v);
}

function useB() {
  if (!selectedKey.value) return;
  const v = getByPath(jsonB.value as any, selectedKey.value);
  if (v === undefined) return;
  patchResultValue(selectedKey.value, v);
}

function resetSelected() {
  if (!selectedKey.value) return;
  const v = getByPath(autoResultTree.value as any, selectedKey.value);
  if (v === undefined) return;
  patchResultValue(selectedKey.value, v);
}

function takeAllFrom(which: Truth) {
  truth.value = which;
  setResultFromAuto();
}

function patchResultValue(path: string, value: any) {
  // правим объект-истину, затем сериализуем обратно
  const base = cloneDeep(resultObj.value);
  setByPath(base as any, path, value);

  const txt = jsonStringify(base);
  resultTextJson.value = txt;
  resultObj.value = base as JsonValue;
  errorR.value = null;
  isDirty.value = true;
}

function onResultJsonChange(v: string) {
  resultTextJson.value = v;
  const parsed = safeParseJson(v.trim() || "{}");
  if (!parsed.ok) {
    errorR.value = parsed.error;
    isDirty.value = true;
    return;
  }
  resultObj.value = parsed.value as JsonValue;
  errorR.value = null;
  isDirty.value = true;
}

function onResultFlatChange(v: string) {
  // flat редактирование: парсим → сохраняем как JSON-истину
  const parsed = parseFlatTextToTree(v);
  if (!parsed.ok) {
    errorR.value = parsed.error;
    isDirty.value = true;
    return;
  }
  const txt = jsonStringify(parsed.value);
  resultTextJson.value = txt;
  resultObj.value = parsed.value;
  errorR.value = null;
  isDirty.value = true;
}

/** files */
async function onFilesA(files: File[]) {
  errorA.value = null;
  try {
    if (!files.length) return;
    const { obj } = await loadJsonFromFile(files[0]);
    jsonA.value = obj as JsonValue;
    setResultFromAuto();
  } catch (e: any) {
    errorA.value = e?.message || t("services.mergeJson.errors.invalidFile");
  }
}

async function onFilesB(files: File[]) {
  errorB.value = null;
  try {
    if (!files.length) return;
    const { obj } = await loadJsonFromFile(files[0]);
    jsonB.value = obj as JsonValue;
    setResultFromAuto();
  } catch (e: any) {
    errorB.value = e?.message || t("services.mergeJson.errors.invalidFile");
  }
}

function downloadResultJson() {
  const blob = new Blob([resultTextJson.value], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.json";
  a.click();
  URL.revokeObjectURL(url);
}

/** add key -> patch into result */
const showAddKey = ref(false);

function onAddKey(payload: { key: string; value: string }) {
  const key = payload.key.trim();
  if (!key) return;

  const v = payload.value.trim();
  const parsed = safeParseJson(v);
  if (!parsed.ok) {
    errorR.value = parsed.error;
    return;
  }

  patchResultValue(key, normalizeLoadedJson(parsed.value));
  selectedKey.value = key;
}

onMounted(() => {
  setResultFromAuto();
});
</script>

<template>
  <u-container class="merge">
    <div class="merge__header background-hero text-center space-y-3">
      <page-header title="services.mergeJson.title" headline="services.mergeJson.headline" class="mb-6" />
      <p class="merge__subtitle text-muted mx-auto">{{ t("services.mergeJson.subtitle") }}</p>
    </div>

    <section class="merge__card">
      <div class="merge__toolbar">
        <file-input
            label-key="services.mergeJson.inputs.fileA"
            :error="errorA"
            :max-bytes="50 * 1024 * 1024"
            hint-key="services.mergeJson.inputs.hint"
            @files="onFilesA"
        />

        <u-select
            v-model="viewMode"
            class="merge__select"
            :items="[
            { label: 'JSON', value: 'json' },
            { label: 'Tree', value: 'tree' },
            { label: 'Flat keys', value: 'flat' },
          ]"
            :title="t('services.mergeJson.titles.viewMode')"
        />

        <custom-checkbox
            v-model="minify"
            label-key="services.mergeJson.controls.minify"
            :title="t('services.mergeJson.titles.minify')"
            @update:modelValue="() => {
            // применяем форматирование к текущей истине, если json валиден
            const p = safeParseJson(resultTextJson.trim() || '{}');
            if (p.ok) {
              const txt = jsonStringify(p.value);
              resultTextJson = txt;
              resultObj = p.value;
              errorR = null;
            }
          }"
        />

        <file-input
            label-key="services.mergeJson.inputs.fileB"
            :error="errorB"
            :max-bytes="50 * 1024 * 1024"
            hint-key="services.mergeJson.inputs.hint"
            @files="onFilesB"
        />

        <div class="merge__group">
          <div class="merge__group-label">{{ t("services.mergeJson.controls.truth") }}</div>
          <div class="merge__group-row">
            <custom-button
                variant="secondary"
                :_class="`merge__chip ${truth === 'A' ? 'merge__chip_active' : ''}`"
                @click="takeAllFrom('A')"
                :title="t('services.mergeJson.titles.truthA')"
            >
              {{ t("services.mergeJson.controls.truthA") }}
            </custom-button>

            <custom-button
                variant="secondary"
                :_class="`merge__chip ${truth === 'B' ? 'merge__chip_active' : ''}`"
                @click="takeAllFrom('B')"
                :title="t('services.mergeJson.titles.truthB')"
            >
              {{ t("services.mergeJson.controls.truthB") }}
            </custom-button>
          </div>
        </div>

        <div class="merge__group">
          <div class="merge__group-label">{{ t("services.mergeJson.controls.sort") }}</div>
          <div class="merge__group-row">
            <custom-button
                variant="ghost"
                :_class="`merge__chip ${sortMode === 'asc' ? 'merge__chip_active' : ''}`"
                @click="sortMode = 'asc'"
                :title="t('services.mergeJson.titles.sortAsc')"
            >
              {{ t("services.mergeJson.controls.sortAsc") }}
            </custom-button>

            <custom-button
                variant="ghost"
                :_class="`merge__chip ${sortMode === 'desc' ? 'merge__chip_active' : ''}`"
                @click="sortMode = 'desc'"
                :title="t('services.mergeJson.titles.sortDesc')"
            >
              {{ t("services.mergeJson.controls.sortDesc") }}
            </custom-button>
          </div>
        </div>

        <custom-checkbox
            v-model="onlyDiff"
            label-key="services.mergeJson.controls.onlyDiff"
            :title="t('services.mergeJson.titles.onlyDiff')"
        />

        <custom-checkbox
            v-model="searchInValue"
            label-key="services.mergeJson.controls.searchInValue"
            :title="t('services.mergeJson.titles.searchInValue')"
        />

        <custom-checkbox
            v-model="syncSearch"
            label-key="services.mergeJson.controls.sync"
            :title="t('services.mergeJson.titles.sync')"
        />

        <custom-input
            v-model="query"
            class="merge__search"
            label-key="services.mergeJson.controls.search"
            placeholder-key="services.mergeJson.controls.searchPh"
            :title="t('services.mergeJson.titles.search')"
            clearable
        />

        <div class="merge__spacer" />

        <custom-button
            variant="secondary"
            :_class="'merge__btn'"
            :disabled="!selectedKey"
            @click="useA"
            :title="t('services.mergeJson.titles.useA')"
        >
          {{ t("services.mergeJson.row.useA") }}
        </custom-button>

        <custom-button
            variant="secondary"
            :_class="'merge__btn'"
            :disabled="!selectedKey"
            @click="useB"
            :title="t('services.mergeJson.titles.useB')"
        >
          {{ t("services.mergeJson.row.useB") }}
        </custom-button>

        <custom-button
            variant="ghost"
            :_class="'merge__btn'"
            :disabled="!selectedKey"
            @click="resetSelected"
            :title="t('services.mergeJson.titles.reset')"
        >
          {{ t("services.mergeJson.row.reset") }}
        </custom-button>

        <custom-button
            variant="ghost"
            :_class="'merge__btn'"
            @click="showAddKey = true"
            :title="t('services.mergeJson.titles.addKey')"
        >
          {{ t("services.mergeJson.actions.addKey") }}
        </custom-button>

        <custom-button
            variant="primary"
            :_class="'merge__btn'"
            @click="downloadResultJson"
            :title="t('services.mergeJson.titles.download')"
        >
          {{ t("services.mergeJson.actions.downloadJson") }}
        </custom-button>
      </div>

      <div class="merge__triple">
        <!-- A -->
        <div class="merge__pane">
          <div class="merge__pane-head">
            <div class="merge__pane-title">{{ t("services.mergeJson.table.colA") }}</div>
            <div class="merge__pane-sub" v-if="selectedKey">
              <span class="merge__sel">{{ selectedKey }}</span>
            </div>
          </div>

          <div class="merge__pane-body">
            <template v-if="viewMode === 'tree'">
              <json-tree-view
                  v-model="selectedKey"
                  :value="jsonA"
                  :sort="sortMode"
                  :filter="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :status-by-leaf="statusByLeaf"
                  :highlight="{ aRoot: jsonA, bRoot: jsonB, truth, pickByKey: {}, addedKeys: new Set(), editedKeys: new Set(), pane: 'A' }"
                  :search="{ aRoot: jsonA, bRoot: jsonB, rRoot: resultObj, pane: 'A', query, searchInValue, syncSearch }"
              />
            </template>

            <template v-else>
              <ClientOnly>
                <MonacoJsonView
                    :text="viewTextA"
                    :mode="viewMode === 'flat' ? 'flat' : 'json'"
                    :selected-key="selectedKey"
                    :hidden-keys="hiddenKeysForPane('A')"
                    readonly
                    @select="selectedKey = $event"
                />
              </ClientOnly>
            </template>
          </div>
        </div>

        <!-- Result -->
        <div class="merge__pane merge__pane_center">
          <div class="merge__pane-head">
            <div class="merge__pane-title">{{ t("services.mergeJson.table.colResult") }}</div>
            <div class="merge__pane-sub" v-if="selectedKey">
              <span class="merge__sel">{{ selectedKey }}</span>
            </div>
          </div>

          <div class="merge__pane-body">
            <template v-if="viewMode === 'tree'">
              <json-tree-view
                  v-model="selectedKey"
                  :value="resultObj"
                  :sort="sortMode"
                  :filter="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :status-by-leaf="statusByLeaf"
                  :highlight="{ aRoot: jsonA, bRoot: jsonB, truth, pickByKey: {}, addedKeys: new Set(), editedKeys: new Set(), pane: 'R' }"
                  :search="{ aRoot: jsonA, bRoot: jsonB, rRoot: resultObj, pane: 'R', query, searchInValue, syncSearch }"
              />
            </template>

            <template v-else>
              <ClientOnly>
                <MonacoJsonView
                    :mode="viewMode === 'flat' ? 'flat' : 'json'"
                    :selected-key="selectedKey"
                    :hidden-keys="hiddenKeysForPane('R')"
                    :readonly="false"
                    :model-value="viewMode === 'flat' ? resultTextFlat : resultTextJson"
                    @update:modelValue="viewMode === 'flat' ? onResultFlatChange($event) : onResultJsonChange($event)"
                    @select="selectedKey = $event"
                />
              </ClientOnly>
            </template>

            <div v-if="errorR" class="merge__err">{{ errorR }}</div>
          </div>
        </div>

        <!-- B -->
        <div class="merge__pane">
          <div class="merge__pane-head">
            <div class="merge__pane-title">{{ t("services.mergeJson.table.colB") }}</div>
            <div class="merge__pane-sub" v-if="selectedKey">
              <span class="merge__sel">{{ selectedKey }}</span>
            </div>
          </div>

          <div class="merge__pane-body">
            <template v-if="viewMode === 'tree'">
              <json-tree-view
                  v-model="selectedKey"
                  :value="jsonB"
                  :sort="sortMode"
                  :filter="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :status-by-leaf="statusByLeaf"
                  :highlight="{ aRoot: jsonA, bRoot: jsonB, truth, pickByKey: {}, addedKeys: new Set(), editedKeys: new Set(), pane: 'B' }"
                  :search="{ aRoot: jsonA, bRoot: jsonB, rRoot: resultObj, pane: 'B', query, searchInValue, syncSearch }"
              />
            </template>

            <template v-else>
              <ClientOnly>
                <MonacoJsonView
                    :text="viewTextB"
                    :mode="viewMode === 'flat' ? 'flat' : 'json'"
                    :selected-key="selectedKey"
                    :hidden-keys="hiddenKeysForPane('B')"
                    readonly
                    @select="selectedKey = $event"
                />
              </ClientOnly>
            </template>
          </div>
        </div>
      </div>
    </section>

    <AddKeyModal v-model="showAddKey" @submit="onAddKey" />
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

.merge__select {
  min-width: 160px;
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

.merge__search {
  min-width: 240px;
}

.merge__triple {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr;
  gap: 12px;
  min-width: 0;
}

.merge__pane {
  border-radius: 16px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  padding: 10px;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.merge__pane_center {
  box-shadow: 0 0 0 1px rgba(128, 90, 245, 0.18) inset;
}

.merge__pane-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.merge__pane-title {
  font-weight: 900;
  font-size: 12px;
  color: var(--ui-text-muted);
}

.merge__pane-sub {
  font-size: 12px;
  font-weight: 900;
  opacity: 0.75;
  min-width: 0;
}

.merge__sel {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merge__pane-body {
  min-height: 420px;
  height: 420px;
}

.merge__err {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 900;
  color: var(--color-error);
  opacity: 0.95;
}

@media (max-width: 1100px) {
  .merge__triple {
    grid-template-columns: 1fr;
  }

  .merge__pane-body {
    min-height: 360px;
    height: 360px;
  }

  .merge__search {
    min-width: 180px;
  }
}
</style>
