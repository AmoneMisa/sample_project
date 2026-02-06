<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import {computed, reactive, ref, watch, onMounted} from "vue";
import SignatureOverlay from "~/components/pdfEditor/SignatureOverlay.vue";

const config = useRuntimeConfig();
const {t} = useI18n();
const route = useRoute();
const router = useRouter();

const jobId = computed(() => String(route.params.jobId || ""));

type TextAlign = "left" | "center" | "right" | "justify";
type PdfFont = "helvetica" | "times" | "courier";

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
  color: "#ffffff",

  // ✅ фикс: отправляем на сервер только стандартные pdf-шрифты
  font: "helvetica" as PdfFont,

  bold: false,
  italic: false,
  underline: false,
  align: "left" as TextAlign,

  xRel: 0.15,
  yRel: 0.15,
});

const availableFonts: Array<{ label: string; value: PdfFont }> = [
  {label: "Helvetica", value: "helvetica"},
  {label: "Times", value: "times"},
  {label: "Courier", value: "courier"},
];

const alignOptions: Array<{ label: string; value: TextAlign }> = [
  {label: "Left", value: "left"},
  {label: "Center", value: "center"},
  {label: "Right", value: "right"},
  {label: "Justify", value: "justify"},
];

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
  // v — как cache-buster, сервер его игнорирует, но браузер не будет держать старые картинки
  return `${config.public.apiBase}/pdf/preview/${jobId.value}/${page.value}?dpi=${dpi.value}&v=${activeVersion.value}`;
});

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function relToPdfX(xRel: number) {
  return xRel * pageW.value;
}

function relToPdfY(yRel: number) {
  return pageH.value - yRel * pageH.value;
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
    if (page.value < 1) page.value = 1;
  } catch (e: any) {
    // fallback to status, если вдруг page-info падает
    try {
      const st = await $fetch<{ activeVersion: number }>(`${config.public.apiBase}/pdf/status/${jobId.value}`);
      activeVersion.value = st.activeVersion;
    } catch {
      // ignore
    }
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

      // расширенные поля (их должен поддерживать бэк; иначе вернёт 400 — это ок, просто увидишь ошибку)
      color: textBox.color,
      font: textBox.font,
      bold: textBox.bold,
      italic: textBox.italic,
      underline: textBox.underline,
      align: textBox.align,
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

function uploadNew() {
  router.push("/services/pdf-editor");
}

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, x));
}

// server clamps to 220, so do it in UI too
watch(dpi, (v) => {
  dpi.value = clampInt(v, 72, 220);
});

watch(jobId, async () => {
  if (!jobId.value) return;
  page.value = 1;
  await refreshInfo();
});

watch(page, async () => {
  if (!jobId.value) return;
  if (page.value < 1) page.value = 1;
  if (page.value > pages.value) page.value = pages.value;
});

// Drag text overlay
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

onMounted(async () => {
  if (!jobId.value) return;
  await refreshInfo();
});
</script>

<template>
  <u-container class="pdf">
    <div class="pdf__header text-center space-y-3">
      <page-header title="services.pdfEditor.title" headline="services.pdfEditor.headline" class="mb-6"/>
      <p class="pdf__subtitle text-muted mx-auto">{{ t("services.pdfEditor.subtitle") }}</p>
    </div>

    <div class="pdf__grid">
      <section class="ui-anim-border pdf__panel pdf__panel_preview">
        <div class="ui-anim-border__inner pdf__panel-inner">
          <div class="pdf__panel-head">
            <div class="pdf__panel-title">
              <u-icon name="i-lucide-file-image"/>
              <span>{{ t("services.pdfEditor.preview") }}</span>
            </div>

            <div class="pdf__top-actions">
              <button type="button" class="ui-pill-btn" @click="uploadNew" :disabled="isBusy">
                <span class="ui-pill-btn__inner">
                  <u-icon name="i-lucide-upload"/>
                  {{ t("services.pdfEditor.upload.new") }}
                </span>
              </button>
              <div class="pdf__sep"/>
              <USelect
                  :disabled="isBusy"
                  v-model="bgColor"
                  :options="[
    { label: t('services.pdfEditor.bg.white'), value: 'white' },
    { label: t('services.pdfEditor.bg.black'), value: 'black' },
    { label: t('services.pdfEditor.bg.transparent'), value: null }]"
              />
              <div class="pdf__sep"/>

              <button type="button" class="pdf__icon-btn" :disabled="isBusy || page <= 1" @click="page--">
                <u-icon name="i-lucide-chevron-left"/>
              </button>

              <div class="pdf__page-chip">{{ t("services.pdfEditor.page") }} {{ page }} / {{ pages }}</div>

              <button type="button" class="pdf__icon-btn" :disabled="isBusy || page >= pages" @click="page++">
                <u-icon name="i-lucide-chevron-right"/>
              </button>

              <div class="pdf__sep"/>

              <div class="pdf__toolbar-mini">
                <span class="text-muted">DPI</span>
                <u-input v-model.number="dpi" type="number" min="72" max="220" class="pdf__dpi"/>
              </div>

              <div class="pdf__sep"/>

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

          <div class="pdf__toolstrip">
            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: textBox.enabled }"
                @click="textBox.enabled = !textBox.enabled"
            >
              <u-icon name="i-lucide-type"/>
              {{ t("services.pdfEditor.tools.text") }}
            </button>

            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: signature.enabled }"
                @click="signature.enabled = !signature.enabled"
            >
              <u-icon name="i-lucide-pen-tool"/>
              {{ t("services.pdfEditor.tools.signature") }}
            </button>
          </div>

          <div v-if="textBox.enabled" class="pdf__tool-section">
            <div class="pdf__tool-title">{{ t("services.pdfEditor.text.title") }}</div>

            <div class="pdf__tool-grid4">
              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.valueLabel") }}</div>
                <u-input v-model="textBox.value" :placeholder="t('services.pdfEditor.text.valuePlaceholder')"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.fontLabel") }}</div>
                <u-select v-model="textBox.font" :options="availableFonts"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.fontSizeLabel") }}</div>
                <u-input v-model.number="textBox.fontSize" type="number" min="8" max="120"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.colorLabel") }}</div>
                <u-input v-model="textBox.color" type="color"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.opacityLabel") }}</div>
                <u-input v-model.number="textBox.opacity" type="number" min="5" max="100"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.alignLabel") }}</div>
                <u-select v-model="textBox.align" :options="alignOptions"/>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">{{ t("services.pdfEditor.text.styleLabel") }}</div>
                <div class="pdf__style-row">
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: textBox.bold }"
                          @click="textBox.bold = !textBox.bold">
                    B
                  </button>
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: textBox.italic }"
                          @click="textBox.italic = !textBox.italic">
                    I
                  </button>
                  <button
                      type="button"
                      class="pdf__chip"
                      :class="{ pdf__chip_active: textBox.underline }"
                      @click="textBox.underline = !textBox.underline"
                  >
                    U
                  </button>
                </div>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">{{ t("services.pdfEditor.text.applyLabel") }}</div>
                <custom-button
                    variant="full"
                    class="pdf__run-btn"
                    :class="{ 'opacity-60 pointer-events-none': isBusy || !textBox.value.trim() }"
                    @click="applyText"
                >
                  {{ t("services.pdfEditor.applyText") }}
                </custom-button>
              </div>
            </div>
          </div>

          <div v-if="signature.enabled" class="pdf__tool-section">
            <div class="pdf__tool-title">{{ t("services.pdfEditor.signature.title") }}</div>

            <div class="pdf__tool-grid4">
              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.strokeWidthLabel") }}</div>
                <u-input v-model.number="signature.strokeWidth" type="number" min="0.5" max="8"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.opacityLabel") }}</div>
                <u-input v-model.number="signature.opacity" type="number" min="10" max="100"/>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.actionsLabel") }}</div>
                <button type="button" class="services__pill" :disabled="isBusy" @click="signature.strokes = []">
                  <u-icon name="i-lucide-eraser"/>
                  {{ t("services.pdfEditor.signature.clear") }}
                </button>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.applyLabel") }}</div>
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

          <div v-if="errorMsg" class="pdf__error">{{ errorMsg }}</div>

          <div class="pdf__canvas-wrap">
            <div ref="stageRef" class="pdf__stage"
                 :class="{ pdf__stage_white: bgColor === 'white', pdf__stage_black: bgColor === 'black' }">
              <img :src="previewUrl" class="pdf__preview" alt=""/>

              <div
                  v-if="textBox.enabled"
                  class="pdf__overlay-textbox"
                  :style="{
                  left: `${textBox.xRel * 100}%`,
                  top: `${textBox.yRel * 100}%`,
                  opacity: textBox.opacity / 100,
                  color: textBox.color,
                  fontSize: `${textBox.fontSize}px`,
                  fontFamily: textBox.font === 'helvetica' ? 'Arial, Helvetica, sans-serif' : (textBox.font === 'times' ? 'Times New Roman, Times, serif' : 'Courier New, Courier, monospace'),
                  fontWeight: textBox.bold ? '900' : '700',
                  fontStyle: textBox.italic ? 'italic' : 'normal',
                  textDecoration: textBox.underline ? 'underline' : 'none',
                  textAlign: textBox.align,
                }"
                  @pointerdown="onTextDown"
                  @pointermove="onTextMove"
                  @pointerup="onTextUp"
                  @pointercancel="onTextUp"
              >
                {{ textBox.value }}
              </div>

              <SignatureOverlay
                  v-if="signature.enabled"
                  :xRel="signature.xRel"
                  :yRel="signature.yRel"
                  :wRel="signature.wRel"
                  :hRel="signature.hRel"
                  :strokes="signature.strokes"
                  :strokeWidth="signature.strokeWidth"
                  @update:xRel="(v: number) => (signature.xRel = v)"
                  @update:yRel="(v: number) => (signature.yRel = v)"
                  @update:wRel="(v: number) => (signature.wRel = v)"
                  @update:hRel="(v: number) => (signature.hRel = v)"
                  @update:strokes="(v: Array<Array<[number, number]>>) => (signature.strokes = v)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  </u-container>
</template>

<style scoped lang="scss">
.pdf__page-chip {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--ui-border);
  background: rgba(255, 255, 255, 0.03);
  font-weight: 900;
}

.pdf__top-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pdf__sep {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 6px;
}

.pdf__toolbar-mini {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pdf__dpi {
  width: 120px;
}

.pdf__toolstrip {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
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

.pdf__tool-grid4 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 10px;

  @media (min-width: 860px) {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
}

.pdf__field {
  display: grid;
  gap: 6px;
}

.pdf__field_row {
  grid-column: 1 / -1;
}

.pdf__label {
  font-weight: 900;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
}

.light .pdf__label {
  color: rgba(21, 22, 42, 0.86);
}

.pdf__style-row {
  display: inline-flex;
  gap: 8px;
}

.pdf__chip {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
}

.pdf__chip_active {
  border-color: rgba(128, 90, 245, 0.35);
  background: rgba(128, 90, 245, 0.18);
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

.pdf__overlay-textbox {
  position: absolute;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  user-select: none;
  max-width: 70%;
  cursor: grab;
  white-space: pre-wrap;
  word-break: break-word;
}

.pdf__overlay-textbox:active {
  cursor: grabbing;
}
</style>
