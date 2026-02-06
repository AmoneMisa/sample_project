<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";

const config = useRuntimeConfig();
const {t} = useI18n();

type ServerTool = "rotate" | "watermark_text" | "watermark_image" | "draw_signature";

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

/** overlay state (in RELATIVE 0..1) */
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
  // strokes: Array<stroke>, stroke: Array<[xRel, yRel]> within signature rect 0..1
  strokes: [] as Array<Array<[number, number]>>,
  xRel: 0.15,
  yRel: 0.25,
  wRel: 0.45,
  hRel: 0.18,
  strokeWidth: 2.0,
  opacity: 100,
});

const previewUrl = computed(() => {
  if (!jobId.value) return ""
  // v param to bust browser cache
  return `${config.public.apiBase}/pdf/preview/${jobId.value}/${page.value}?dpi=${dpi.value}&v=${activeVersion.value}`
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
  const pdfs = files.filter(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
  if (!pdfs.length) return;
  selectedFiles.value = [...selectedFiles.value, ...pdfs];
}

function clearAll() {
  selectedFiles.value = [];
}

async function createJob() {
  errorMsg.value = null;
  if (!selectedFiles.value.length) return;

  isBusy.value = true;
  try {
    const form = new FormData();
    for (const f of selectedFiles.value) form.append("files", f);

    const res = await $fetch<{ jobId: string; expiresAt: number; downloadUrl: string }>(
        `${config.public.apiBase}/pdf/create`,
        {method: "POST", body: form}
    );

    jobId.value = res.jobId;
    await refreshInfo();
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Create failed";
  } finally {
    isBusy.value = false;
  }
}

async function refreshInfo() {
  if (!jobId.value) return;
  // page-info (желательно иметь на бэке)
  try {
    const info = await $fetch<{ pages: number; pageW: number; pageH: number; activeVersion: number }>(
        `${config.public.apiBase}/pdf/page-info/${jobId.value}`
    );
    pages.value = info.pages;
    pageW.value = info.pageW;
    pageH.value = info.pageH;
    activeVersion.value = info.activeVersion;
    if (page.value > pages.value) page.value = pages.value;
  } catch {
    // fallback: хотя бы статус
    const st = await $fetch<{ activeVersion: number }>(`${config.public.apiBase}/pdf/status/${jobId.value}`);
    activeVersion.value = st.activeVersion;
  }
}

function relToPdfX(xRel: number) {
  return xRel * pageW.value;
}

function relToPdfY(yRel: number) {
  // PDF origin bottom-left. На картинке обычно top-left.
  // Поэтому: yPdf = pageH - (yRel * pageH)
  return pageH.value - yRel * pageH.value;
}

/**
 * Apply text as watermark_text on a selected page.
 * We'll treat it as "add text" MVP.
 */
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

    const res = await $fetch<{ activeVersion: number }>(`${config.public.apiBase}/pdf/apply/${jobId.value}`, {
      method: "POST",
      body: form,
    });

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
      y: relToPdfY(signature.yRel) - (signature.hRel * pageH.value), // rect anchored top-left in UI; convert to PDF bottom-left
      w: signature.wRel * pageW.value,
      h: signature.hRel * pageH.value,
      strokes: signature.strokes.map(stroke => stroke.map(([x, y]) => [x, 1 - y])), // invert y inside rect
      strokeWidth: signature.strokeWidth,
      opacity: signature.opacity,
    };

    const form = new FormData();
    form.append("tool", "draw_signature");
    form.append("options", JSON.stringify(options));

    await $fetch(`${config.public.apiBase}/pdf/apply/${jobId.value}`, {method: "POST", body: form});
    await refreshInfo()

    // optional: clear after apply
    signature.strokes = []
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Apply signature failed"
  } finally {
    isBusy.value = false
  }
}

async function undo() {
  if (!jobId.value) return
  isBusy.value = true
  errorMsg.value = null
  try {
    await $fetch(`${config.public.apiBase}/pdf/undo/${jobId.value}`, {method: "POST"})
    await refreshInfo()
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Undo failed"
  } finally {
    isBusy.value = false
  }
}

async function redo() {
  if (!jobId.value) return
  isBusy.value = true
  errorMsg.value = null
  try {
    await $fetch(`${config.public.apiBase}/pdf/redo/${jobId.value}`, {method: "POST"})
    await refreshInfo()
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Redo failed"
  } finally {
    isBusy.value = false
  }
}

function download() {
  if (!jobId.value) return
  window.open(`${config.public.apiBase}/pdf/download/${jobId.value}`, "_blank")
}
</script>

<template>
  <u-container class="pdf">
    <div class="pdf__header text-center space-y-3">
      <page-header
          title="services.pdfEditor.title"
          headline="services.pdfEditor.headline"
          class="mb-6"
      />
      <p class="pdf__subtitle text-muted mx-auto">{{ t("services.pdfEditor.subtitle") }}</p>
    </div>

    <div class="pdf__grid">
      <!-- LEFT: upload + pages -->
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

            <input
                ref="fileInput"
                type="file"
                accept="application/pdf,.pdf"
                multiple
                class="hidden"
                @change="onPick"
            />
          </div>

          <div class="pdf__files" v-if="selectedFiles.length">
            <ul class="pdf__file-list">
              <li class="pdf__file" v-for="(f, i) in selectedFiles" :key="f.name + i">
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
                <button class="pdf__icon-btn pdf__icon-btn_danger" @click="selectedFiles.splice(i, 1)">
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
              <div class="text-muted">
                v<b>{{ activeVersion }}</b>
              </div>
            </div>

            <div class="pdf__pages-nav">
              <button class="pdf__icon-btn" :disabled="page <= 1" @click="page--">
                <u-icon name="i-lucide-chevron-left"/>
              </button>

              <div class="pdf__page-chip">
                {{ t("services.pdfEditor.page") }} {{ page }} / {{ pages }}
              </div>

              <button class="pdf__icon-btn" :disabled="page >= pages" @click="page++">
                <u-icon name="i-lucide-chevron-right"/>
              </button>
            </div>
          </div>

          <div v-if="errorMsg" class="pdf__error">
            {{ errorMsg }}
          </div>
        </div>
      </section>

      <!-- RIGHT: preview + overlay + tools -->
      <section class="ui-anim-border pdf__panel">
        <div class="ui-anim-border__inner pdf__panel-inner">
          <div class="pdf__panel-head">
            <div class="pdf__panel-title">
              <u-icon name="i-lucide-file-image"/>
              <span>{{ t("services.pdfEditor.preview") }}</span>
            </div>

            <div class="pdf__top-actions" v-if="jobId">
              <button class="pdf__icon-btn" @click="undo" :disabled="isBusy">
                <u-icon name="i-lucide-undo-2"/>
              </button>
              <button class="pdf__icon-btn" @click="redo" :disabled="isBusy">
                <u-icon name="i-lucide-redo-2"/>
              </button>
              <button class="pdf__icon-btn" @click="download" :disabled="isBusy">
                <u-icon name="i-lucide-download"/>
              </button>
            </div>
          </div>

          <div v-if="!jobId" class="pdf__hint text-muted">
            {{ t("services.pdfEditor.previewHint") }}
          </div>

          <div v-else class="pdf__canvas-wrap">
            <!-- page preview -->
            <div class="pdf__stage">
              <img :src="previewUrl" class="pdf__preview" alt=""/>

              <!-- Text draggable -->
              <div
                  v-if="textBox.enabled"
                  class="pdf__overlay-box"
                  :style="{
                  left: `${textBox.xRel * 100}%`,
                  top: `${textBox.yRel * 100}%`,
                }"
                  @pointerdown="(e) => $emit"
              >
                <div class="pdf__overlay-text">{{ textBox.value }}</div>
              </div>

              <!-- Signature placement + drawing -->
              <SignatureOverlay
                  v-if="signature.enabled"
                  v-model:xRel="signature.xRel"
                  v-model:yRel="signature.yRel"
                  v-model:wRel="signature.wRel"
                  v-model:hRel="signature.hRel"
                  v-model:strokes="signature.strokes"
              />
            </div>
          </div>

          <div v-if="jobId" class="pdf__toolbox">
            <div class="pdf__tool-row">
              <button class="services__pill" :class="{ services__pill_active: textBox.enabled }"
                      @click="textBox.enabled = !textBox.enabled">
                <u-icon name="i-lucide-type"/>
                {{ t("services.pdfEditor.tools.text") }}
              </button>
              <button class="services__pill" :class="{ services__pill_active: signature.enabled }"
                      @click="signature.enabled = !signature.enabled">
                <u-icon name="i-lucide-pen-tool"/>
                {{ t("services.pdfEditor.tools.signature") }}
              </button>
            </div>

            <div v-if="textBox.enabled" class="pdf__tool-section">
              <div class="pdf__tool-title">{{ t("services.pdfEditor.text.title") }}</div>
              <u-input v-model="textBox.value"/>
              <div class="pdf__tool-row">
                <u-input v-model.number="textBox.fontSize" type="number" min="8" max="72"/>
                <u-input v-model.number="textBox.opacity" type="number" min="5" max="60"/>
              </div>
              <custom-button variant="full" class="pdf__run-btn" :class="{ 'opacity-60 pointer-events-none': isBusy }"
                             @click="applyText">
                {{ t("services.pdfEditor.applyText") }}
              </custom-button>
            </div>

            <div v-if="signature.enabled" class="pdf__tool-section">
              <div class="pdf__tool-title">{{ t("services.pdfEditor.signature.title") }}</div>
              <div class="pdf__tool-row">
                <u-input v-model.number="signature.strokeWidth" type="number" min="0.5" max="8"/>
                <u-input v-model.number="signature.opacity" type="number" min="10" max="100"/>
                <button class="services__pill" @click="signature.strokes = []">
                  <u-icon name="i-lucide-eraser"/>
                  {{ t("services.pdfEditor.signature.clear") }}
                </button>
              </div>
              <custom-button variant="full" class="pdf__run-btn" :class="{ 'opacity-60 pointer-events-none': isBusy }"
                             @click="applySignature">
                {{ t("services.pdfEditor.applySignature") }}
              </custom-button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </u-container>
</template>

<!-- SignatureOverlay component below -->
<script lang="ts">
export default {}
</script>

<style scoped>
/* reuse your styles vibe */
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
  color: rgba(255, 255, 255, .9);
}

.light .pdf__panel-title {
  color: rgba(21, 22, 42, .85);
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
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .06);
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
  background: rgba(255, 255, 255, .05);
  border: 1px solid rgba(255, 255, 255, .08);
}

.pdf__file-name {
  font-weight: 800;
  color: rgba(255, 255, 255, .88);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 36ch;
}

.light .pdf__file-name {
  color: rgba(21, 22, 42, .86);
}

.pdf__icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, .08);
  background: rgba(255, 255, 255, .04);
  color: rgba(255, 255, 255, .85);
}

.pdf__icon-btn:disabled {
  opacity: .45;
  cursor: not-allowed;
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
  border-top: 1px solid rgba(255, 255, 255, .06);
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
  color: rgba(255, 255, 255, .88);
}

.light .pdf__pages-title {
  color: rgba(21, 22, 42, .86);
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
  background: rgba(255, 255, 255, .03);
  font-weight: 900;
}

.pdf__error {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 80, 120, 0.10);
  border: 1px solid rgba(255, 80, 120, 0.18);
}

.pdf__canvas-wrap {
  margin-top: 10px;
}

.pdf__stage {
  position: relative;
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .06);
  background: rgba(255, 255, 255, .02);
}

.pdf__preview {
  width: 100%;
  height: auto;
  display: block;
}

.pdf__overlay-box {
  position: absolute;
  transform: translate(-0%, -0%);
  left: 10%;
  top: 10%;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(128, 90, 245, .16);
  border: 1px solid rgba(205, 153, 255, .22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, .25);
  user-select: none;
  max-width: 70%;
}

.pdf__overlay-text {
  font-weight: 900;
  color: rgba(255, 255, 255, .92);
}

.pdf__toolbox {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, .06);
}

.pdf__tool-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.pdf__tool-section {
  margin-top: 12px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .06);
}

.pdf__tool-title {
  font-weight: 900;
  margin-bottom: 10px;
  color: rgba(255, 255, 255, .9);
}

.light .pdf__tool-title {
  color: rgba(21, 22, 42, .86);
}

.pdf__hint {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, .03);
  border: 1px solid rgba(255, 255, 255, .06);
}
</style>
