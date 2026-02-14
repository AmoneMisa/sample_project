<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import FileInput from "~/components/common/FileInput.vue";
import JsonTreeView from "~/components/mergeJson/JsonTreeView.vue";
import AddKeyModal from "~/components/mergeJson/AddKeyModal.vue";
import JsonTextOutput from "~/components/mergeJson/JsonTextOutput.vue";
import FlatKeysTextOutput from "~/components/mergeJson/FlatKeysTextOutput.vue";

import {
  getByPath,
  setByPath,
  cloneDeep,
  collectLeafPaths,
  normalizeLoadedJson,
  loadJsonFromFile,
  safeParseJson
} from "~/utils/mergeJson/json";
import type {JsonValue} from "~/utils/mergeJson/json";
import {makeDiffSet, leafStatus} from "~/utils/mergeJson/diff";
import type {Pick, Truth} from "~/utils/mergeJson/pick";
import {highlightFor} from "~/utils/mergeJson/highlight";
import {matchesInPane} from "~/utils/mergeJson/search";
import CustomCheckbox from "~/components/common/CustomCheckbox.vue";
import CustomInput from "~/components/common/CustomInput.vue";

type SortMode = "asc" | "desc";
type ViewMode = "json" | "tree" | "flat";
type Pane = "A" | "B" | "R";

const {t} = useI18n();

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

const overrides = reactive<Record<string, string | undefined>>({});
const pickByKey = reactive<Partial<Record<string, Pick>>>({});
const addedKeys = reactive(new Set<string>());
const editedKeys = reactive(new Set<string>());

const showAddKey = ref(false);

function jsonStringify(v: any) {
  return minify.value ? JSON.stringify(v) : JSON.stringify(v, null, 2);
}

const diffSet = computed(() => makeDiffSet(jsonA.value, jsonB.value));
const statusByLeaf = (p: string) => leafStatus(jsonA.value, jsonB.value, p);

const allLeafKeys = computed(() => {
  const keys = new Set<string>([
    ...collectLeafPaths(jsonA.value as any),
    ...collectLeafPaths(jsonB.value as any),
    ...Object.keys(overrides),
  ]);
  const arr = Array.from(keys).filter(Boolean);
  arr.sort((a, b) => a.localeCompare(b));
  if (sortMode.value === "desc") arr.reverse();
  return arr;
});

const resultTree = computed<JsonValue>(() => {
  const base = cloneDeep(truth.value === "A" ? jsonA.value : jsonB.value);
  const other = truth.value === "A" ? jsonB.value : jsonA.value;

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

const selectedA = computed(() => {
  const v = getByPath(jsonA.value as any, selectedKey.value);
  return v === undefined ? "" : jsonStringify(v);
});

const selectedB = computed(() => {
  const v = getByPath(jsonB.value as any, selectedKey.value);
  return v === undefined ? "" : jsonStringify(v);
});

const selectedR = computed({
  get() {
    const k = selectedKey.value;
    if (!k) return "";
    const ov = overrides[k];
    if (ov !== undefined) return String(ov);
    const v = getByPath(resultTree.value as any, k);
    return v === undefined ? "" : jsonStringify(v);
  },
  set(v: string) {
    if (!selectedKey.value) return;
    overrides[selectedKey.value] = v;
    editedKeys.add(selectedKey.value);
    pickByKey[selectedKey.value] = "EDITED";
    errorR.value = validateResultValue(v);
  },
});

function validateResultValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = safeParseJson(trimmed);
  if (!parsed.ok) return parsed.error;
  return null;
}

function useA() {
  if (!selectedKey.value) return;
  overrides[selectedKey.value] = selectedA.value;
  pickByKey[selectedKey.value] = "A";
  editedKeys.delete(selectedKey.value);
  errorR.value = null;
}

function useB() {
  if (!selectedKey.value) return;
  overrides[selectedKey.value] = selectedB.value;
  pickByKey[selectedKey.value] = "B";
  editedKeys.delete(selectedKey.value);
  errorR.value = null;
}

function resetSelected() {
  if (!selectedKey.value) return;
  delete overrides[selectedKey.value];
  delete pickByKey[selectedKey.value];
  editedKeys.delete(selectedKey.value);
  addedKeys.delete(selectedKey.value);
  errorR.value = null;
}

function setKeyTruth(mode: "AUTO" | "A" | "B") {
  if (!selectedKey.value) return;
  if (mode === "AUTO") delete pickByKey[selectedKey.value];
  else pickByKey[selectedKey.value] = mode;
}

const keyTruth = computed<"AUTO" | "A" | "B">({
  get() {
    if (!selectedKey.value) return "AUTO";
    const p = pickByKey[selectedKey.value];
    if (p === "A" || p === "B") return p;
    return "AUTO";
  },
  set(v) {
    setKeyTruth(v);
  }
});

function takeAllFrom(which: Truth) {
  truth.value = which;
  for (const k of Object.keys(overrides)) delete overrides[k];
  for (const k of Object.keys(pickByKey)) delete pickByKey[k];
  addedKeys.clear();
  editedKeys.clear();
  errorR.value = null;
}

async function onFilesA(files: File[]) {
  errorA.value = null;
  try {
    if (!files.length) return;
    const {obj} = await loadJsonFromFile(files[0]);
    jsonA.value = obj as JsonValue;
  } catch (e: any) {
    errorA.value = e?.message || t("services.mergeJson.errors.invalidFile");
  }
}

async function onFilesB(files: File[]) {
  errorB.value = null;
  try {
    if (!files.length) return;
    const {obj} = await loadJsonFromFile(files[0]);
    jsonB.value = obj as JsonValue;
  } catch (e: any) {
    errorB.value = e?.message || t("services.mergeJson.errors.invalidFile");
  }
}

function downloadResultJson() {
  const payload = resultTree.value;
  const blob = new Blob([jsonStringify(payload)], {type: "application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "merged.json";
  a.click();
  URL.revokeObjectURL(url);
}

function onAddKey(payload: { key: string; value: string }) {
  const key = payload.key.trim();
  if (!key) return;

  const v = payload.value;
  const parsed = safeParseJson(v.trim());
  const finalVal = parsed.ok ? JSON.stringify(normalizeLoadedJson(parsed.value)) : v;

  overrides[key] = finalVal;
  addedKeys.add(key);
  pickByKey[key] = "ADDED";
  selectedKey.value = key;
  errorR.value = validateResultValue(finalVal);
}

const paneProps = computed(() => ({
  aRoot: jsonA.value,
  bRoot: jsonB.value,
  rRoot: resultTree.value,
}));

const matchCfg = (pane: Pane) => ({
  aRoot: paneProps.value.aRoot,
  bRoot: paneProps.value.bRoot,
  rRoot: paneProps.value.rRoot,
  pane,
  query: query.value,
  searchInValue: searchInValue.value,
  syncSearch: syncSearch.value,
});

const hlCfg = (pane: Pane) => ({
  aRoot: jsonA.value,
  bRoot: jsonB.value,
  truth: truth.value,
  pickByKey,
  addedKeys,
  editedKeys,
  pane,
});

function hl(pane: Pane, path: string) {
  return highlightFor({...hlCfg(pane), path});
}

function match(pane: Pane, path: string) {
  return matchesInPane({...matchCfg(pane), path});
}

watch(query, (v) => {
  if (!v.trim()) return;
  const keys = allLeafKeys.value;
  const found = keys.find((k) => match("R", k));
  if (found) selectedKey.value = found;
});
</script>

<template>
  <u-container class="merge">
    <div class="merge__header background-hero text-center space-y-3">
      <page-header title="services.mergeJson.title" headline="services.mergeJson.headline" class="mb-6"/>
      <p class="merge__subtitle text-muted mx-auto">{{ t("services.mergeJson.subtitle") }}</p>
    </div>

    <section class="merge__card">
      <div class="merge__toolbar">
        <file-input
            label-key="services.mergeJson.inputs.fileA"
            :error="errorA"
            hint-key="services.mergeJson.inputs.hint"
            @files="onFilesA"
        />

        <u-select
            v-model="viewMode"
            class="merge__select"
            :items="[
            { label: 'JSON', value: 'json' },
            { label: 'Tree', value: 'tree' },
            { label: 'Flat keys', value: 'flat' }
          ]"
            :title="t('services.mergeJson.titles.viewMode')"
        />

        <custom-checkbox
            v-model="minify"
            label-key="services.mergeJson.controls.minify"
            :title="t('services.mergeJson.titles.minify')"
        />

        <file-input
            label-key="services.mergeJson.inputs.fileB"
            :error="errorB"
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
            label-key="services.mergeJson.controls.syncSearch"
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

        <div class="merge__spacer"/>

        <u-select
            v-model="keyTruth"
            class="merge__select merge__select_small"
            :disabled="!selectedKey"
            :items="[
            { label: t('services.mergeJson.controls.keyTruthAuto'), value: 'AUTO' },
            { label: t('services.mergeJson.controls.keyTruthA'), value: 'A' },
            { label: t('services.mergeJson.controls.keyTruthB'), value: 'B' }
          ]"
            :title="
            keyTruth === 'AUTO'
              ? t('services.mergeJson.titles.keyTruthAuto')
              : keyTruth === 'A'
                ? t('services.mergeJson.titles.keyTruthA')
                : t('services.mergeJson.titles.keyTruthB')
          "
        />

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
        <div class="merge__pane">
          <div class="merge__pane-head">
            <div class="merge__pane-title">{{ t("services.mergeJson.table.colA") }}</div>
            <div class="merge__pane-sub" v-if="selectedKey"><span class="merge__sel">{{ selectedKey }}</span></div>
          </div>

          <div class="merge__pane-body">
            <template v-if="viewMode === 'json'">
              <json-text-output
                  :value="jsonA"
                  :minify="minify"
                  :selected="selectedKey"
                  :query="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :highlight-by-leaf="(p) => hl('A', p)"
                  @select="selectedKey = $event"
              />
            </template>

            <template v-else-if="viewMode === 'flat'">
              <flat-keys-text-output
                  :value="jsonA"
                  :minify="minify"
                  :sort="sortMode"
                  :selected="selectedKey"
                  :query="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :highlight-by-leaf="(p) => hl('A', p)"
                  @select="selectedKey = $event"
              />
            </template>

            <template v-else>
              <json-tree-view
                  v-model="selectedKey"
                  :value="jsonA"
                  :sort="sortMode"
                  :filter="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :status-by-leaf="statusByLeaf"
                  :highlight="{ ...hlCfg('A') }"
                  :search="{ ...matchCfg('A') }"
              />
            </template>

            <textarea class="merge__ta merge__ta_small" :value="selectedA" rows="6" readonly/>
          </div>
        </div>

        <div class="merge__pane merge__pane_center">
          <div class="merge__pane-head">
            <div class="merge__pane-title">{{ t("services.mergeJson.table.colResult") }}</div>
            <div class="merge__pane-sub" v-if="selectedKey"><span class="merge__sel">{{ selectedKey }}</span></div>
          </div>

          <div class="merge__pane-body">
            <template v-if="viewMode === 'json'">
              <json-text-output
                  :value="resultTree"
                  :minify="minify"
                  :selected="selectedKey"
                  :query="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :highlight-by-leaf="(p) => hl('R', p)"
                  @select="selectedKey = $event"
              />
            </template>

            <template v-else-if="viewMode === 'flat'">
              <flat-keys-text-output
                  :value="resultTree"
                  :minify="minify"
                  :sort="sortMode"
                  :selected="selectedKey"
                  :query="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :highlight-by-leaf="(p) => hl('R', p)"
                  @select="selectedKey = $event"
              />
            </template>

            <template v-else>
              <json-tree-view
                  v-model="selectedKey"
                  :value="resultTree"
                  :sort="sortMode"
                  :filter="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :status-by-leaf="statusByLeaf"
                  :highlight="{ ...hlCfg('R') }"
                  :search="{ ...matchCfg('R') }"
              />
            </template>

            <textarea class="merge__ta merge__ta_small" v-model="selectedR" rows="6" :readonly="!selectedKey"/>
            <div v-if="errorR" class="merge__err">{{ errorR }}</div>
          </div>
        </div>

        <div class="merge__pane">
          <div class="merge__pane-head">
            <div class="merge__pane-title">{{ t("services.mergeJson.table.colB") }}</div>
            <div class="merge__pane-sub" v-if="selectedKey"><span class="merge__sel">{{ selectedKey }}</span></div>
          </div>

          <div class="merge__pane-body">
            <template v-if="viewMode === 'json'">
              <json-text-output
                  :value="jsonB"
                  :minify="minify"
                  :selected="selectedKey"
                  :query="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :highlight-by-leaf="(p) => hl('B', p)"
                  @select="selectedKey = $event"
              />
            </template>

            <template v-else-if="viewMode === 'flat'">
              <flat-keys-text-output
                  :value="jsonB"
                  :minify="minify"
                  :sort="sortMode"
                  :selected="selectedKey"
                  :query="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :highlight-by-leaf="(p) => hl('B', p)"
                  @select="selectedKey = $event"
              />
            </template>

            <template v-else>
              <json-tree-view
                  v-model="selectedKey"
                  :value="jsonB"
                  :sort="sortMode"
                  :filter="query"
                  :only-diff="onlyDiff"
                  :diff-set="diffSet"
                  :status-by-leaf="statusByLeaf"
                  :highlight="{ ...hlCfg('B') }"
                  :search="{ ...matchCfg('B') }"
              />
            </template>
            <textarea class="merge__ta merge__ta_small" :value="selectedB" rows="6" readonly/>
          </div>
        </div>
      </div>
    </section>

    <AddKeyModal v-model="showAddKey" @submit="onAddKey"/>
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

.merge__select_small {
  min-width: 170px;
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
  opacity: .75;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 420px;
}

.merge__ta {
  width: 100%;
  border-radius: 14px;
  padding: 10px;
  border: 1px solid var(--ui-border);
  background: rgba(0, 0, 0, 0.12);
  color: var(--ui-text);
  outline: none;
  resize: vertical;
  min-height: 260px;
  font-size: 12px;
  line-height: 1.55;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.merge__ta_small {
  min-height: 120px;
}

.merge__ta:focus {
  box-shadow: 0 0 0 2px rgba(128, 90, 245, 0.30), 0 0 0 6px rgba(128, 90, 245, 0.14);
}

.merge__err {
  margin-top: -4px;
  font-size: 12px;
  font-weight: 900;
  color: var(--error);
  opacity: .95;
}

@media (max-width: 1100px) {
  .merge__triple {
    grid-template-columns: 1fr;
  }

  .merge__pane-body {
    min-height: 360px;
  }

  .merge__search {
    min-width: 180px;
  }
}
</style>
