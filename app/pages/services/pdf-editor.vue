<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import SignatureOverlay from "~/components/pdfEditor/SignatureOverlay.vue";

const config = useRuntimeConfig();
const {t} = useI18n();
const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const qJob = route.query.job;

  if (typeof qJob === "string" && qJob.length > 10) {
    jobId.value = qJob;
    await refreshInfo();
  }
});
type TextAlign = "left" | "center" | "right" | "justify";

const textBox = reactive({
  enabled: false,
  value: "Hello!",
  opacity: 30,
  fontSize: 28,
  color: "#ffffff",
  font: "inter",
  bold: false,
  italic: false,
  underline: false,
  align: "left" as TextAlign,
  xRel: 0.15,
  yRel: 0.15,
});

const iconBox = reactive({
  enabled: false,
  name: "file",
  size: 42,
  opacity: 100,
  color: "#ffffff",
  xRel: 0.2,
  yRel: 0.2,
});

const availableFonts = [
  {label: "Inter", value: "inter"},
  {label: "Arial", value: "arial"},
  {label: "Times", value: "times"},
  {label: "Courier", value: "courier"},
];

const alignOptions = [
  {label: "Left", value: "left"},
  {label: "Center", value: "center"},
  {label: "Right", value: "right"},
  {label: "Justify", value: "justify"},
];

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);

const jobId = ref<string | null>(null);
const pages = ref<number>(1);
const pageW = ref<number>(595);
const pageH = ref<number>(842);
const activeVersion = ref<number>(1);

const page = ref<number>(1);
const dpi = ref<number>(144);

const isBusy = ref(false);
const errorMsg = ref<string | null>(null);

const stageRef = ref<HTMLDivElement | null>(null);

const bgColor = ref<string | null>(null);

const textBox = reactive({
  enabled: false,
  value: "Hello!",
  opacity: 30,
  fontSize: 28,
  xRel: 0.15,
  yRel: 0.15,
});

const signature = reactive({
  enabled: false,
  strokes: [] as Array<Array<[number, number]>>,
  xRel: 0.15,
  yRel: 0.25,
  wRel: 0.45,
  hRel: 0.18,
  strokeWidth: 2.0,
  opacity: 100,
});

const previewUrl = computed(() => {
  if (!jobId.value) return "";
  return `${config.public.apiBase}/pdf/preview/${jobId.value}/${page.value}?dpi=${dpi.value}&v=${activeVersion.value}`;
});

function openPicker() {
  fileInput.value?.click();
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement;
  const list = Array.from(input.files ?? []);
  if (!list.length) return;
  addFiles(list);
  input.value = "";
}

function addFiles(files: File[]) {
  const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  if (!pdfs.length) return;
  selectedFiles.value = [...selectedFiles.value, ...pdfs];
}

async function clearAll() {
  selectedFiles.value = [];
  jobId.value = null;
  pages.value = 1;
  page.value = 1;
  activeVersion.value = 1;
  errorMsg.value = null;

  await router.replace({
    query: {...route.query, job: undefined},
  });

  selectedFiles.value = [];
}

function removeFile(i: number) {
  selectedFiles.value = selectedFiles.value.filter((_, idx) => idx !== i);
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function relToPdfX(xRel: number) {
  return xRel * pageW.value;
}

function relToPdfY(yRel: number) {
  return pageH.value - yRel * pageH.value;
}

async function createJob() {
  errorMsg.value = null;
  if (!selectedFiles.value.length) return;

  isBusy.value = true;
  try {
    const form = new FormData();
    for (const f of selectedFiles.value) form.append("files", f);

    const res = await $fetch<{ jobId: string }>(`${config.public.apiBase}/pdf/create`, {
      method: "POST",
      body: form,
    });

    jobId.value = res.jobId;

    await router.replace({
      query: {
        ...route.query,
        job: res.jobId,
      },
    });

    page.value = 1;
    await refreshInfo();
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Create failed";
  } finally {
    isBusy.value = false;
  }
}

async function refreshInfo() {
  if (!jobId.value) return;
  try {
    const info = await $fetch<{ pages: number; pageW: number; pageH: number; activeVersion: number }>(
        `${config.public.apiBase}/pdf/page-info/${jobId.value}`,
    );
    pages.value = info.pages;
    pageW.value = info.pageW;
    pageH.value = info.pageH;
    activeVersion.value = info.activeVersion;
    if (page.value > pages.value) page.value = pages.value;
  } catch {
    const st = await $fetch<{ activeVersion: number }>(`${config.public.apiBase}/pdf/status/${jobId.value}`);
    activeVersion.value = st.activeVersion;
  }
}

async function applyText() {
  if (!jobId.value) return;
  if (!textBox.value.trim()) return;

  isBusy.value = true;
  errorMsg.value = null;
  try {
    const options = {
      text: textBox.value,
      opacity: textBox.opacity,
      page: page.value,
      x: relToPdfX(textBox.xRel),
      y: relToPdfY(textBox.yRel),
      fontSize: textBox.fontSize,
    };

    const form = new FormData();
    form.append("tool", "watermark_text");
    form.append("options", JSON.stringify(options));

    await $fetch(`${config.public.apiBase}/pdf/apply/${jobId.value}`, {method: "POST", body: form});
    await refreshInfo();
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Apply text failed";
  } finally {
    isBusy.value = false;
  }
}

async function applySignature() {
  if (!jobId.value) return;
  if (!signature.strokes.length) return;

  isBusy.value = true;
  errorMsg.value = null;
  try {
    const options = {
      page: page.value,
      x: relToPdfX(signature.xRel),
      y: relToPdfY(signature.yRel) - signature.hRel * pageH.value,
      w: signature.wRel * pageW.value,
      h: signature.hRel * pageH.value,
      strokes: signature.strokes.map((stroke) => stroke.map(([x, y]) => [x, 1 - y])),
      strokeWidth: signature.strokeWidth,
      opacity: signature.opacity,
    };

    const form = new FormData();
    form.append("tool", "draw_signature");
    form.append("options", JSON.stringify(options));

    await $fetch(`${config.public.apiBase}/pdf/apply/${jobId.value}`, {method: "POST", body: form});
    await refreshInfo();
    signature.strokes = [];
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Apply signature failed";
  } finally {
    isBusy.value = false;
  }
}

async function undo() {
  if (!jobId.value) return;
  isBusy.value = true;
  errorMsg.value = null;
  try {
    await $fetch(`${config.public.apiBase}/pdf/undo/${jobId.value}`, {method: "POST"});
    await refreshInfo();
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Undo failed";
  } finally {
    isBusy.value = false;
  }
}

async function redo() {
  if (!jobId.value) return;
  isBusy.value = true;
  errorMsg.value = null;
  try {
    await $fetch(`${config.public.apiBase}/pdf/redo/${jobId.value}`, {method: "POST"});
    await refreshInfo();
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Redo failed";
  } finally {
    isBusy.value = false;
  }
}

function download() {
  if (!jobId.value) return;
  window.open(`${config.public.apiBase}/pdf/download/${jobId.value}`, "_blank");
}

const dragText = reactive({
  active: false,
  pointerId: -1,
  dx: 0,
  dy: 0,
});

function onTextDown(e: PointerEvent) {
  if (!stageRef.value) return;
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  dragText.active = true;
  dragText.pointerId = e.pointerId;

  const r = stageRef.value.getBoundingClientRect();
  const xPx = textBox.xRel * r.width;
  const yPx = textBox.yRel * r.height;

  dragText.dx = e.clientX - (r.left + xPx);
  dragText.dy = e.clientY - (r.top + yPx);
}

function onTextMove(e: PointerEvent) {
  if (!dragText.active) return;
  if (dragText.pointerId !== e.pointerId) return;
  if (!stageRef.value) return;

  const r = stageRef.value.getBoundingClientRect();
  const x = e.clientX - r.left - dragText.dx;
  const y = e.clientY - r.top - dragText.dy;

  textBox.xRel = clamp01(x / r.width);
  textBox.yRel = clamp01(y / r.height);
}

function onTextUp(e: PointerEvent) {
  if (dragText.pointerId !== e.pointerId) return;
  dragText.active = false;
  dragText.pointerId = -1;

  const target = e.currentTarget as HTMLElement;
  if (target?.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture(e.pointerId);
}

watch([page, jobId], async () => {
  await nextTick();
});

onMounted(() => {
  nextTick(() => {
  });
});

onBeforeUnmount(() => {
});
</script>

<template>
  <u-container class="pdf">
    <div class="pdf__header text-center space-y-3">
      <page-header title="services.pdfEditor.title" headline="services.pdfEditor.headline" class="mb-6"/>
      <p class="pdf__subtitle text-muted mx-auto">{{ t("services.pdfEditor.subtitle") }}</p>
    </div>

    <div class="pdf__grid">
      <section class="ui-anim-border pdf__panel">
        <div class="ui-anim-border__inner pdf__panel-inner">
          <div class="pdf__panel-head">
            <div class="pdf__panel-title">
              <u-icon name="i-lucide-upload"/>
              <span>{{ t("services.pdfEditor.upload.title") }}</span>
            </div>

            <button type="button" class="ui-pill-btn ui-pill-btn_animated" @click="openPicker">
              <span class="ui-pill-btn__inner">
                <u-icon name="i-lucide-plus"/>
                {{ t("services.pdfEditor.upload.add") }}
              </span>
            </button>

            <input ref="fileInput" type="file" accept="application/pdf,.pdf" multiple class="hidden" @change="onPick"/>
          </div>

          <div v-if="selectedFiles.length" class="pdf__files">
            <ul class="pdf__file-list">
              <li v-for="(f, i) in selectedFiles" :key="f.name + i" class="pdf__file">
                <div class="pdf__file-left">
                  <div class="pdf__file-ico">
                    <u-icon name="i-lucide-file-text"/>
                  </div>
                  <div class="pdf__file-meta">
                    <div class="pdf__file-name">{{ f.name }}</div>
                    <div class="pdf__file-size text-muted">
                      {{ Math.max(1, Math.round((f.size / 1024 / 1024) * 10) / 10) }} MB
                    </div>
                  </div>
                </div>

                <button type="button" class="pdf__icon-btn pdf__icon-btn_danger" @click="removeFile(i)">
                  <u-icon name="i-lucide-x"/>
                </button>
              </li>
            </ul>

            <div class="pdf__upload-actions">
              <custom-button variant="full" class="pdf__run-btn" :class="{ 'opacity-60 pointer-events-none': isBusy }"
                             @click="createJob">
                {{ jobId ? t("services.pdfEditor.upload.replace") : t("services.pdfEditor.upload.start") }}
              </custom-button>

              <button type="button" class="ui-pill-btn" @click="clearAll">
                <span class="ui-pill-btn__inner">
                  <u-icon name="i-lucide-trash-2"/>
                  {{ t("services.pdfEditor.upload.clear") }}
                </span>
              </button>
            </div>
          </div>

          <div v-else class="pdf__hint text-muted">
            {{ t("services.pdfEditor.upload.hint") }}
          </div>

          <div v-if="jobId" class="pdf__pages">
            <div class="pdf__pages-head">
              <div class="pdf__pages-title">
                {{ t("services.pdfEditor.pages") }}: <b>{{ pages }}</b>
              </div>
              <div class="text-muted">v<b>{{ activeVersion }}</b></div>
            </div>

            <div class="pdf__pages-nav">
              <button type="button" class="pdf__icon-btn" :disabled="page <= 1" @click="page--">
                <u-icon name="i-lucide-chevron-left"/>
              </button>

              <div class="pdf__page-chip">{{ t("services.pdfEditor.page") }} {{ page }} / {{ pages }}</div>

              <button type="button" class="pdf__icon-btn" :disabled="page >= pages" @click="page++">
                <u-icon name="i-lucide-chevron-right"/>
              </button>
            </div>
          </div>

          <div v-if="errorMsg" class="pdf__error">{{ errorMsg }}</div>
        </div>
      </section>

      <section class="ui-anim-border pdf__panel">
        <div class="ui-anim-border__inner pdf__panel-inner">
          <div class="pdf__panel-head">
            <div class="pdf__panel-title">
              <u-icon name="i-lucide-file-image"/>
              <span>{{ t("services.pdfEditor.preview") }}</span>
            </div>

            <div v-if="jobId" class="pdf__top-actions">
              <USelect
                  title="Заливка фона"
                  v-model="bgColor"
                  :disabled="isBusy"
                  :options="[
                    { label: 'Белый', value: 'white' },
                    { label: 'Чёрный', value: 'black' },
                    { label: 'Прозрачный', value: null }
                  ]"
              />
              <button type="button" class="pdf__icon-btn" @click="undo" :disabled="isBusy">
                <u-icon name="i-lucide-undo-2"/>
              </button>
              <button type="button" class="pdf__icon-btn" @click="redo" :disabled="isBusy">
                <u-icon name="i-lucide-redo-2"/>
              </button>
              <button type="button" class="pdf__icon-btn" @click="download" :disabled="isBusy">
                <u-icon name="i-lucide-download"/>
              </button>
            </div>
          </div>

          <div v-if="!jobId" class="pdf__hint text-muted">
            {{ t("services.pdfEditor.previewHint") }}
          </div>

          <div v-else class="pdf__canvas-wrap">
            <div ref="stageRef" class="pdf__stage"
                 :class="{'pdf__stage_white': bgColor === 'white', 'pdf__stage_black': bgColor === 'black',}">
              <img :src="previewUrl" class="pdf__preview" alt=""/>

              <div
                  v-if="textBox.enabled"
                  class="pdf__overlay-box"
                  :style="{ left: `${textBox.xRel * 100}%`, top: `${textBox.yRel * 100}%` }"
                  @pointerdown="onTextDown"
                  @pointermove="onTextMove"
                  @pointerup="onTextUp"
                  @pointercancel="onTextUp"
              >
                <div class="pdf__overlay-text">{{ textBox.value }}</div>
              </div>

              <SignatureOverlay
                  v-if="signature.enabled"
                  :xRel="signature.xRel"
                  :yRel="signature.yRel"
                  :wRel="signature.wRel"
                  :hRel="signature.hRel"
                  :strokes="signature.strokes"
                  :strokeWidth="signature.strokeWidth"
                  :opacity="signature.opacity"
                  :disabled="isBusy"
                  @update:xRel="(v) => (signature.xRel = v)"
                  @update:yRel="(v) => (signature.yRel = v)"
                  @update:wRel="(v) => (signature.wRel = v)"
                  @update:hRel="(v) => (signature.hRel = v)"
                  @update:strokes="(v) => (signature.strokes = v)"
              />
            </div>
          </div>

          <div v-if="jobId" class="pdf__toolbar">
            <div class="pdf__toolbar-left">
              <button type="button" class="services__pill" :class="{ services__pill_active: textBox.enabled }"
                      @click="textBox.enabled = !textBox.enabled">
                <u-icon name="i-lucide-type"/>
                {{ t("services.pdfEditor.tools.text") }}
              </button>

              <button type="button" class="services__pill" :class="{ services__pill_active: signature.enabled }"
                      @click="signature.enabled = !signature.enabled">
                <u-icon name="i-lucide-pen-tool"/>
                {{ t("services.pdfEditor.tools.signature") }}
              </button>

              <div class="pdf__toolbar-spacer"></div>

              <div class="pdf__toolbar-mini">
                <span class="text-muted">DPI</span>
                <u-input v-model.number="dpi" type="number" min="72" max="300" class="pdf__dpi"/>
              </div>
            </div>

            <div v-if="textBox.enabled" class="pdf__tool-section">
              <div class="pdf__tool-title">{{ t("services.pdfEditor.text.title") }}</div>

              <div class="pdf__tool-grid">
                <div class="pdf__field">
                  <div class="pdf__label">{{ t("services.pdfEditor.text.valueLabel") }}</div>
                  <u-input v-model="textBox.value" :placeholder="t('services.pdfEditor.text.valuePlaceholder')"/>
                </div>

                <div class="pdf__field">
                  <div class="pdf__label">{{ t("services.pdfEditor.text.fontSizeLabel") }}</div>
                  <u-input v-model.number="textBox.fontSize" type="number" min="8" max="72"
                           :placeholder="t('services.pdfEditor.text.fontSizePlaceholder')"/>
                  <div class="pdf__help text-muted">{{ t("services.pdfEditor.text.fontSizeHelp") }}</div>
                </div>

                <div class="pdf__field">
                  <div class="pdf__label">{{ t("services.pdfEditor.text.opacityLabel") }}</div>
                  <u-input v-model.number="textBox.opacity" type="number" min="5" max="60"
                           :placeholder="t('services.pdfEditor.text.opacityPlaceholder')"/>
                  <div class="pdf__help text-muted">{{ t("services.pdfEditor.text.opacityHelp") }}</div>
                </div>
              </div>

              <div class="pdf__tool-hint text-muted">
                {{ t("services.pdfEditor.text.hintDrag") }}
              </div>

              <custom-button
                  variant="full"
                  class="pdf__run-btn"
                  :class="{ 'opacity-60 pointer-events-none': isBusy || !textBox.value.trim() }"
                  @click="applyText"
              >
                {{ t("services.pdfEditor.applyText") }}
              </custom-button>
            </div>

            <div v-if="signature.enabled" class="pdf__tool-section">
              <div class="pdf__tool-title">{{ t("services.pdfEditor.signature.title") }}</div>

              <div class="pdf__tool-grid">
                <div class="pdf__field">
                  <div class="pdf__label">{{ t("services.pdfEditor.signature.strokeWidthLabel") }}</div>
                  <u-input v-model.number="signature.strokeWidth" type="number" min="0.5" max="8"
                           :placeholder="t('services.pdfEditor.signature.strokeWidthPlaceholder')"/>
                  <div class="pdf__help text-muted">{{ t("services.pdfEditor.signature.strokeWidthHelp") }}</div>
                </div>

                <div class="pdf__field">
                  <div class="pdf__label">{{ t("services.pdfEditor.signature.opacityLabel") }}</div>
                  <u-input v-model.number="signature.opacity" type="number" min="10" max="100"
                           :placeholder="t('services.pdfEditor.signature.opacityPlaceholder')"/>
                  <div class="pdf__help text-muted">{{ t("services.pdfEditor.signature.opacityHelp") }}</div>
                </div>

                <div class="pdf__field">
                  <div class="pdf__label">{{ t("services.pdfEditor.signature.actionsLabel") }}</div>
                  <button type="button" class="services__pill" :disabled="isBusy" @click="signature.strokes = []">
                    <u-icon name="i-lucide-eraser"/>
                    {{ t("services.pdfEditor.signature.clear") }}
                  </button>
                </div>
              </div>

              <div class="pdf__tool-hint text-muted">
                {{ t("services.pdfEditor.signature.hintDrawMove") }}
              </div>

              <custom-button
                  variant="full"
                  class="pdf__run-btn"
                  :class="{ 'opacity-60 pointer-events-none': isBusy || !signature.strokes.length }"
                  @click="applySignature"
              >
                {{ t("services.pdfEditor.applySignature") }}
              </custom-button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </u-container>
</template>

<style scoped lang="scss">
.pdf {
  padding-top: 24px;
  padding-bottom: 96px;
}

.pdf__subtitle {
  max-width: 760px;
  font-size: 14px;
}

.pdf__grid {
  margin-top: 28px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  @media (min-width: 1000px) {
    grid-template-columns: 0.9fr 1.1fr;
  }
}

.pdf__panel {
  border-radius: 18px;
}

.pdf__panel-inner {
  border-radius: 16px;
  padding: 16px;
}

.pdf__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.pdf__panel-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.9);
}

.light .pdf__panel-title {
  color: rgba(21, 22, 42, 0.85);
}

.pdf__files {
  margin-top: 6px;
}

.pdf__file-list {
  display: grid;
  gap: 8px;
}

.pdf__file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pdf__file-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.pdf__file-ico {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pdf__file-name {
  font-weight: 800;
  color: rgba(255, 255, 255, 0.88);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 36ch;
}

.light .pdf__file-name {
  color: rgba(21, 22, 42, 0.86);
}

.pdf__icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
  transition: filter 160ms ease, transform 140ms ease;
}

.pdf__icon-btn:hover {
  filter: brightness(1.08);
}

.pdf__icon-btn:active {
  transform: translateY(1px);
}

.pdf__icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pdf__icon-btn_danger {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 80, 120, 0.08);
}

.pdf__upload-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pdf__run-btn {
  min-width: 220px;
}

.pdf__pages {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.pdf__pages-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.pdf__pages-title {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.88);
}

.light .pdf__pages-title {
  color: rgba(21, 22, 42, 0.86);
}

.pdf__pages-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.pdf__page-chip {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.03);
  font-weight: 900;
}

.pdf__error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 80, 120, 0.1);
  border: 1px solid rgba(255, 80, 120, 0.18);
}

.pdf__hint {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pdf__canvas-wrap {
  margin-top: 10px;
}

.pdf__stage {
  position: relative;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);

  &_white {
    background-color: white !important;
  }

  &_black {
    background-color: black !important;
  }
}

.pdf__preview {
  width: 100%;
  height: auto;
  display: block;
}

.pdf__overlay-box {
  position: absolute;
  transform: translate(0%, 0%);
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(128, 90, 245, 0.16);
  border: 1px solid rgba(205, 153, 255, 0.22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  user-select: none;
  max-width: 70%;
  cursor: grab;
}

.pdf__overlay-box:active {
  cursor: grabbing;
}

.pdf__overlay-text {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  white-space: pre-wrap;
  word-break: break-word;
}

.pdf__toolbar {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.pdf__toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pdf__toolbar-spacer {
  flex: 1;
}

.pdf__toolbar-mini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pdf__dpi {
  width: 120px;
}

.pdf__tool-section {
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.pdf__tool-title {
  font-weight: 900;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, 0.9);
}

.light .pdf__tool-title {
  color: rgba(21, 22, 42, 0.86);
}

.pdf__tool-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 10px;
  @media (min-width: 560px) {
    grid-template-columns: 2fr 1fr 1fr;
  }
}

.pdf__top-actions {
  display: inline-flex;
  gap: 8px;
}

.pdf__sig {
  position: absolute;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(205, 153, 255, 0.18);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  transform: translate(0%, 0%);
}

.pdf__sig-head {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  gap: 8px;
  z-index: 3;
}

.pdf__sig-chip {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(14, 12, 21, 0.65);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  transition: filter 160ms ease, transform 140ms ease;
}

.pdf__sig-chip:hover {
  filter: brightness(1.08);
}

.pdf__sig-chip:active {
  transform: translateY(1px);
}

.pdf__sig-chip_active {
  border-color: rgba(128, 90, 245, 0.35);
  background: rgba(128, 90, 245, 0.18);
}

.pdf__sig-canvas {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.pdf__sig-canvas_draw {
  cursor: crosshair;
}

.pdf__sig-canvas_move {
  cursor: grab;
}
</style>
