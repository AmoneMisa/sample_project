<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";

type Mode = "media" | "data" | "document";
type MediaTarget = "png" | "jpg" | "jpeg" | "webp";
type DataTarget = "csv" | "json" | "xml" | "xlsx";
type DocTarget = "docx" | "pdf";

const config = useRuntimeConfig();

const mode = ref<Mode>("media");

const targets = computed(() => {
  if (mode.value === "media") return ["png", "jpeg", "jpg", "webp"] as MediaTarget[];
  if (mode.value === "data") return ["csv", "json", "xml", "xlsx"] as DataTarget[];
  return ["docx", "pdf"] as DocTarget[];
});

const target = ref<string>("webp");

watch(mode, (m) => {
  if (m === "media") target.value = "webp";
  if (m === "data") target.value = "json";
  if (m === "document") target.value = "pdf";
  clearFiles();
});

const accept = computed(() => {
  if (mode.value === "media") return ".png,.jpg,.jpeg,.webp";
  if (mode.value === "data") return ".csv,.json,.xml";
  return ".docx,.pdf";
});

const maxFiles = computed(() => (mode.value === "media" ? 20 : 1));
const isMultiple = computed(() => mode.value === "media");

const files = ref<File[]>([]);
const isDragging = ref(false);
const isLoading = ref(false);

const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const fileInputRef = ref<HTMLInputElement | null>(null);

function clearMessages() {
  errorMessage.value = null;
  successMessage.value = null;
}

function clearFiles() {
  files.value = [];
  clearMessages();
}

function humanSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function openPicker() {
  clearMessages();
  fileInputRef.value?.click();
}

function pickFilesFromInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const list = Array.from(input.files || []);
  addFiles(list);
  input.value = "";
}

function addFiles(list: File[]) {
  clearMessages();
  if (!list.length) return;

  if (!isMultiple.value) {
    files.value = [list[0]];
    return;
  }

  const combined = [...files.value, ...list].slice(0, maxFiles.value);
  files.value = combined;

  if (combined.length >= maxFiles.value && (files.value.length + list.length) > maxFiles.value) {
    successMessage.value = `Взял первые ${maxFiles.value} файлов 🙂`;
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const list = Array.from(e.dataTransfer?.files || []);
  addFiles(list);
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
}

function removeFile(idx: number) {
  files.value = files.value.filter((_, i) => i !== idx);
}

function fileExt(name: string) {
  const p = name.split(".");
  return (p[p.length - 1] || "").toLowerCase();
}

function validate(): boolean {
  clearMessages();

  if (!files.value.length) {
    errorMessage.value = "Добавь файл(ы) для конвертации.";
    return false;
  }

  if (mode.value !== "media" && files.value.length !== 1) {
    errorMessage.value = "В этом режиме можно загрузить только один файл.";
    return false;
  }

  if (mode.value === "media" && files.value.length > 20) {
    errorMessage.value = "Для изображений максимум 20 файлов.";
    return false;
  }

  const allowed =
      mode.value === "media" ? ["png", "jpg", "jpeg", "webp"]
          : mode.value === "data" ? ["csv", "json", "xml"]
              : ["docx", "pdf"];

  const bad = files.value.find(f => !allowed.includes(fileExt(f.name)));
  if (bad) {
    errorMessage.value = `Неподдерживаемый файл: ${bad.name}`;
    return false;
  }

  return true;
}

function getFilenameFromContentDisposition(cd: string | null) {
  if (!cd) return null;

  const mStar = cd.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (mStar?.[1]) {
    try {
      return decodeURIComponent(mStar[1].replace(/"/g, ""));
    } catch {
      return mStar[1].replace(/"/g, "");
    }
  }

  const m = cd.match(/filename\s*=\s*"([^"]+)"/i) || cd.match(/filename\s*=\s*([^;]+)/i);
  if (m?.[1]) return m[1].trim().replace(/(^"|"$)/g, "");

  return null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const endpoint = computed(() => {
  if (mode.value === "media") return `${config.public.apiBase}/convert/media`;
  if (mode.value === "data") return `${config.public.apiBase}/convert/data`;
  return `${config.public.apiBase}/convert/document`;
});

async function convert() {
  if (!validate()) return;

  isLoading.value = true;
  clearMessages();

  try {
    const fd = new FormData();

    if (mode.value === "media") {
      for (const f of files.value) fd.append("files", f);
      fd.append("target", target.value);
    } else {
      fd.append("file", files.value[0]);
      fd.append("target", target.value);
    }

    const res = await fetch(endpoint.value, {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    if (!res.ok) {
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
      }
      errorMessage.value = payload?.detail?.message || payload?.message || `Ошибка: ${res.status}`;
      return;
    }

    const blob = await res.blob();
    const cd = res.headers.get("content-disposition");
    const serverName = getFilenameFromContentDisposition(cd);

    const normalizedTarget = target.value === "jpeg" ? "jpg" : target.value;

    const fallback =
        mode.value === "media"
            ? (files.value.length > 1 ? "converted_media.zip" : `${files.value[0].name.replace(/\.[^.]+$/, "")}.${normalizedTarget}`)
            : `${files.value[0].name.replace(/\.[^.]+$/, "")}.${normalizedTarget}`;

    downloadBlob(blob, serverName || fallback);
    successMessage.value = "Готово! Файл скачался 👌";
  } catch (e: any) {
    errorMessage.value = e?.message || "Не удалось выполнить конвертацию.";
  } finally {
    isLoading.value = false;
  }
}

const modeCards = computed(() => ([
  {
    key: "media" as const,
    title: "Изображения",
    desc: "PNG/JPEG/WEBP → один формат. До 20 файлов, вернём zip.",
    icon: "i-lucide-image"
  },
  {
    key: "data" as const,
    title: "Данные",
    desc: "CSV/JSON/XML → CSV/JSON/XML/XLSX. По одному файлу.",
    icon: "i-lucide-database"
  },
  {
    key: "document" as const,
    title: "Документы",
    desc: "DOCX ↔ PDF (best effort для PDF→DOCX). По одному файлу.",
    icon: "i-lucide-file-text"
  },
]));

const targetItems = computed(() =>
    targets.value.map(v => ({
      label: v.toUpperCase(),
      value: v
    }))
);
</script>

<template>
  <u-page :ui="{ center: 'flex flex-col gap-[28px] lg:gap-[32px] xl:gap-[40px] py-12' }">
    <div class="converter-hero">
      <h1 class="page-main-header mx-auto max-w-[26ch] text-center font-bold tracking-tight leading-[0.95] text-[clamp(2.1rem,5vw,3.4rem)]">
        <span class="block dark:text-white/90 text-[var(--ui-text)]/90">Конвертер файлов</span>
        <span
            class="mt-2 block dark:text-white/90 text-[var(--ui-text)]/90">быстро, аккуратно и без лишней магии ✨</span>
      </h1>
      <page-header
          class="mt-2"
          :description="`Загрузи файл, выбери формат — и получишь результат. Для изображений можно пачкой до 20 штук.`"
          descriptionSize="20"
      />
    </div>

    <u-page-body class="mt-4 pb-0 gap-16 flex flex-col justify-center">
      <u-container class="max-w-6xl mx-auto mb-0">
        <div class="mode-grid">
          <button
              v-for="c in modeCards"
              :key="c.key"
              class="mode-card"
              :class="{ 'is-active': mode === c.key }"
              type="button"
              @click="mode = c.key"
          >
            <span class="mode-card__top">
              <icon class="mode-card__icon" :name="c.icon"/>
              <span class="mode-card__title">{{ c.title }}</span>
            </span>
            <span class="mode-card__desc">{{ c.desc }}</span>
          </button>
        </div>
      </u-container>

      <u-container class="max-w-6xl mx-auto mb-0">
        <div class="panel">
          <div class="panel__header">
            <page-header
                :title="mode === 'media' ? 'Изображения' : mode === 'data' ? 'Данные' : 'Документы'"
                :description="mode === 'media'
                ? 'Поддержка: png, jpg/jpeg, webp. До 20 файлов. Если файлов > 1 — вернём zip.'
                : mode === 'data'
                  ? 'Поддержка: csv, json, xml. Цели: csv/json/xml/xlsx. По одному файлу.'
                  : 'Поддержка: docx и pdf. DOCX→PDF стабильно (через LibreOffice), PDF→DOCX best effort.'"
                descriptionSize="18"
                class="border-none"
            />

            <div class="panel__controls">
              <div class="control">
                <span class="control__label">Формат результата</span>

                <div class="ui-pill-btn ui-pill-btn_animated">
                  <div class="ui-pill-btn__inner w-fill-available">
                    <u-select-menu
                        v-model="target"
                        :items="targetItems"
                        value-key="value"
                        label-key="label"
                        class="format-select ui-locale"
                        :ui="{
                          base: 'w-fill-available p-0 bg-transparent rounded-none ring-0 border-0'
                        }"
                    />
                  </div>
                </div>
              </div>
              <custom-button
                  variant="primary"
                  class="control__btn"
                  :disabled="isLoading"
                  @click="convert"
              >
                <span v-if="!isLoading">Convert</span>
                <span v-else>Converting…</span>
              </custom-button>
            </div>
          </div>

          <div
              class="dropzone"
              :class="{ 'is-dragging': isDragging }"
              @drop="onDrop"
              @dragover="onDragOver"
              @dragleave="onDragLeave"
          >
            <div class="dropzone__inner">
              <div class="dropzone__badge">
                <icon name="i-lucide-upload" class="dropzone__badge-icon"/>
              </div>

              <div class="dropzone__text">
                <div class="dropzone__title">
                  Перетащи файл сюда
                  <span class="dropzone__muted">или выбери вручную</span>
                </div>

                <div class="dropzone__meta">
                  <span>Поддержка: <b>{{ accept }}</b></span>
                  <span>Лимит: <b>{{ maxFiles }}</b> файл(ов)</span>
                </div>
              </div>

              <div class="dropzone__actions">
                <input
                    ref="fileInputRef"
                    class="visually-hidden"
                    type="file"
                    :multiple="isMultiple"
                    :accept="accept"
                    @change="pickFilesFromInput"
                />

                <custom-button
                    :buttonType="'white'"
                    class="dropzone__pick"
                    @click="openPicker"
                >
                  Загрузить
                </custom-button>

                <custom-button
                    :buttonType="'link'"
                    class="dropzone__clear"
                    :disabled="isLoading"
                    @click="clearFiles"
                >
                  Очистить
                </custom-button>
              </div>
            </div>
          </div>

          <div v-if="errorMessage" class="msg msg--error">
            <icon name="i-lucide-alert-triangle" class="msg__icon"/>
            <span>{{ errorMessage }}</span>
          </div>
          <div v-if="successMessage" class="msg msg--ok">
            <icon name="i-lucide-check-circle-2" class="msg__icon"/>
            <span>{{ successMessage }}</span>
          </div>

          <div class="files" v-if="files.length">
            <div class="files__head">
              <span class="files__title">Файлы</span>
              <span class="files__hint" v-if="mode === 'media'">Если файлов больше одного — результат будет zip.</span>
            </div>

            <div class="files__list">
              <div v-for="(f, idx) in files" :key="`${f.name}-${idx}`" class="file">
                <div class="file__meta">
                  <span class="file__name">{{ f.name }}</span>
                  <span class="file__size">{{ humanSize(f.size) }}</span>
                </div>

                <button class="file__remove" type="button" @click="removeFile(idx)" :disabled="isLoading">
                  <icon name="i-lucide-x"/>
                </button>
              </div>
            </div>
          </div>

          <div class="tips">
            <div class="tip">
              <icon name="i-lucide-sparkles" class="tip__icon"/>
              <span>PNG → JPEG: прозрачность заменится белым фоном.</span>
            </div>
            <div class="tip">
              <icon name="i-lucide-info" class="tip__icon"/>
              <span>PDF → DOCX: может отличаться от оригинала — это нормально.</span>
            </div>
          </div>
        </div>
      </u-container>
    </u-page-body>
  </u-page>
</template>

<style scoped lang="scss">
.converter-hero {
  position: relative;

  &:before {
    content: "";
    position: absolute;
    inset: -40px -20px auto -20px;
    height: 220px;
    border-radius: 28px;
    background: var(--color-primary-gradient);
    filter: blur(48px);
    opacity: 0.18;
    z-index: -1;
  }
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

.mode-card {
  text-align: left;
  padding: 18px 18px 16px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--secondary-bg-gradient);
  box-shadow: var(--shadow-light);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
  color: var(--text-white);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-primary);
    border-color: rgba(128, 90, 245, 0.38);
  }

  &.is-active {
    border-color: rgba(128, 90, 245, 0.55);
    box-shadow: var(--shadow-primary);

    .mode-card__icon {
      background: var(--color-primary-gradient);
      color: #fff;
    }
  }

  .light & {
    background: var(--surface-1);
  }
}

.mode-card__top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.mode-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(128, 90, 245, 0.14);
  border: 1px solid var(--ui-border);
}

.mode-card__title {
  font-size: 18px;
  font-weight: 700;
}

.mode-card__desc {
  color: var(--ui-text-muted);
  font-size: 14px;
  line-height: 1.4;
}

.panel {
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: var(--secondary-bg-gradient);
  box-shadow: var(--shadow-light);
  padding: 18px;

  .light & {
    background: var(--surface-1);
  }

  @media (min-width: 1024px) {
    padding: 22px;
  }
}

.panel__header {
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }
}

.panel__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: flex-end;
  }
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 240px;
}

.control__label {
  font-size: 13px;
  color: var(--ui-text-muted);
}

.format-select {
  width: 200px;
}

:deep(.format-select [data-slot="trigger"]) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  min-height: unset !important;
  height: 40px !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

.light :deep(.format-select [data-slot="trigger"]) {
  color: var(--ui-text) !important;
}

:deep(.format-select [data-slot="content"]) {
  /* keep your global .ui-locale styles; this is just a safety net */
  border-radius: 14px;
}

.control__btn {
  height: 48px;
  width: 100%;

  @media (min-width: 640px) {
    width: 180px;
  }
}

.dropzone {
  margin-top: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(128, 90, 245, 0.45);
  background: rgba(128, 90, 245, 0.08);
  padding: 16px;
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;

  .light & {
    background: rgba(128, 90, 245, 0.06);
  }

  &.is-dragging {
    transform: translateY(-2px);
    border-color: rgba(128, 90, 245, 0.8);
    background: rgba(128, 90, 245, 0.12);
  }
}

.dropzone__inner {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: center;

  @media (min-width: 1024px) {
    grid-template-columns: auto 1fr auto;
    gap: 18px;
  }
}

.dropzone__badge {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-gradient);
  box-shadow: var(--shadow-primary);
}

.dropzone__badge-icon {
  font-size: 22px;
  color: #fff;
}

.dropzone__title {
  font-weight: 800;
  font-size: 16px;
  color: var(--text-white);

  .light & {
    color: var(--ui-text);
  }
}

.dropzone__muted {
  font-weight: 600;
  margin-left: 6px;
  color: var(--ui-text-muted);
}

.dropzone__meta {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--ui-text-muted);
  font-size: 13px;

  b {
    color: var(--text-white);

    .light & {
      color: var(--ui-text);
    }
  }
}

.dropzone__actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;

  @media (min-width: 1024px) {
    justify-content: flex-end;
  }
}

.dropzone__pick {
  height: 44px;
}

/* CustomButton "link" already handles visuals; spacing only */
.dropzone__clear {
  height: 44px;
  display: inline-flex;
  align-items: center;
}

.msg {
  margin-top: 14px;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border: 1px solid var(--color-border);

  &--error {
    background: rgba(255, 77, 109, 0.10);
  }

  &--ok {
    background: rgba(90, 245, 160, 0.10);
  }
}

.msg__icon {
  margin-top: 1px;
  font-size: 18px;
}

.files {
  margin-top: 16px;
}

.files__head {
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
  }
}

.files__title {
  font-weight: 800;
  color: var(--text-white);

  .light & {
    color: var(--ui-text);
  }
}

.files__hint {
  font-size: 13px;
  color: var(--ui-text-muted);
}

.files__list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  background: rgba(0, 0, 0, 0.16);

  .light & {
    background: var(--surface-2);
  }
}

.file__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file__name {
  font-weight: 700;
  color: var(--text-white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70vw;

  .light & {
    color: var(--ui-text);
  }

  @media (min-width: 1024px) {
    max-width: 520px;
  }
}

.file__size {
  font-size: 12px;
  color: var(--ui-text-muted);
}

.file__remove {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--ui-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: rgba(255, 77, 109, 0.35);
    color: rgba(255, 77, 109, 0.9);
  }
}

.tips {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
}

.tip {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  color: var(--ui-text-muted);
  background: rgba(0, 0, 0, 0.10);

  .light & {
    background: var(--surface-2);
  }
}

.tip__icon {
  font-size: 18px;
  margin-top: 2px;
  color: rgba(128, 90, 245, 0.95);
}

:deep(.format-select [data-slot="trigger"]) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 2px !important;
  height: 40px !important;
  min-height: 40px !important;
}

:deep(.format-select [data-slot="value"]) {
  font-weight: 650;
}

:deep(.format-select [data-slot="trailing"]) {
  opacity: .9;
}
</style>
