<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import {computed, onMounted, ref, watch} from "vue";
import SignatureOverlay from "~/components/pdfEditor/SignatureOverlay.vue";
import TextOverlay from "~/components/pdfEditor/TextOverlay.vue";
import {v4 as uuidv4} from "uuid";

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

/** ---------------------------
 *  Elements model (UI-only)
 *  --------------------------*/
type BaseEl = {
  id: string;
  page: number;
  xRel: number;
  yRel: number;
  wRel: number;
  hRel: number;
};

type TextEl = BaseEl & {
  type: "text";
  value: string;
  opacity: number;
  fontSize: number;
  color: string;
  font: PdfFont;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;
  autoFit: boolean;
};

type SigEl = BaseEl & {
  type: "signature";
  strokes: Array<Array<[number, number]>>;
  strokeWidth: number;
  opacity: number;
  color: string;
};

type PdfEl = TextEl | SigEl;

const elements = ref<PdfEl[]>([]);
const selectedId = ref<string | null>(null);

/** ---------------------------
 *  UI tool panel state
 *  --------------------------*/
const tool = ref<"none" | "text" | "signature">("none");

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

const previewUrl = computed(() => {
  if (!jobId.value) return "";
  return `${config.public.apiBase}/pdf/preview/${jobId.value}/${page.value}?dpi=${dpi.value}&v=${activeVersion.value}`;
});

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, x));
}

// server clamps to 220, so do it in UI too
watch(dpi, (v) => {
  dpi.value = clampInt(v, 72, 220);
});

/** ---------------------------
 *  Coordinate helpers
 *  --------------------------*/
function relToPdfX(xRel: number) {
  return xRel * pageW.value;
}

// IMPORTANT: your backend assumes PDF origin is bottom-left.
// Our UI yRel is top-based (0 = top).
function relToPdfY(yRel: number) {
  return pageH.value - yRel * pageH.value;
}

/** ---------------------------
 *  Load page info
 *  --------------------------*/
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
    try {
      const st = await $fetch<{ activeVersion: number }>(`${config.public.apiBase}/pdf/status/${jobId.value}`);
      activeVersion.value = st.activeVersion;
    } catch {
      // ignore
    }
  }
}

watch(jobId, async () => {
  if (!jobId.value) return;
  page.value = 1;
  await refreshInfo();
});

watch(page, () => {
  if (!jobId.value) return;
  if (page.value < 1) page.value = 1;
  if (page.value > pages.value) page.value = pages.value;
});

/** ---------------------------
 *  Selection / focus
 *  --------------------------*/
function onStageDown(e: PointerEvent) {
  const t = e.target as HTMLElement;
  // overlays should mark their root with data-el-root="true"
  if (!t.closest("[data-el-root='true']")) selectedId.value = null;
}

const selectedEl = computed(() => elements.value.find((x) => x.id === selectedId.value) ?? null);

function selectEl(id: string) {
  selectedId.value = id;
}

/** ---------------------------
 *  Create elements
 *  --------------------------*/
function addText() {
  const el: TextEl = {
    id: uuidv4(),
    type: "text",
    page: page.value,
    xRel: 0.15,
    yRel: 0.15,
    wRel: 0.35,
    hRel: 0.12,
    value: "Hello!",
    opacity: 80,
    fontSize: 28,
    color: "#ffffff",
    font: "helvetica",
    bold: false,
    italic: false,
    underline: false,
    align: "left",
    autoFit: true,
  };
  elements.value.push(el);
  selectedId.value = el.id;
  tool.value = "text";
}

function addSignature() {
  const el: SigEl = {
    id: uuidv4(),
    type: "signature",
    page: page.value,
    xRel: 0.15,
    yRel: 0.65,
    wRel: 0.45,
    hRel: 0.18,
    strokes: [],
    strokeWidth: 2.0,
    opacity: 100,
    color: "#ffffff",
  };
  elements.value.push(el);
  selectedId.value = el.id;
  tool.value = "signature";
}

function removeSelected() {
  if (!selectedId.value) return;
  elements.value = elements.value.filter((x) => x.id !== selectedId.value);
  selectedId.value = null;
}

/** ---------------------------
 *  Job actions
 *  --------------------------*/
function uploadNew() {
  router.push("/services/pdf-editor");
}

function download() {
  if (!jobId.value) return;
  window.open(`${config.public.apiBase}/pdf/download/${jobId.value}`, "_blank");
}

/** ---------------------------
 *  SAVE FLOW
 *  One click -> apply all overlays.
 *  (For now uses multiple /apply calls; later swap to /apply-batch.)
 *  --------------------------*/
function uiFontToPdf(font: PdfFont) {
  // backend _pick_font supports Helvetica/Times/Courier variants
  if (font === "times") return "Times";
  if (font === "courier") return "Courier";
  return "Helvetica";
}

function approxTextWidthPts(text: string, fontSize: number) {
  // rough but ok for "fit to maxWidth" before going to backend
  return (text || "").length * fontSize * 0.55;
}

function pickFontSizeToFit(text: string, maxWidthPts: number, initial: number) {
  let fs = Math.max(8, Math.min(120, initial));
  while (fs > 8 && approxTextWidthPts(text, fs) > maxWidthPts) fs -= 1;
  return fs;
}

async function saveDocument() {
  if (!jobId.value) return;
  errorMsg.value = null;

  // apply all elements on ALL pages (or you can limit to current page)
  const items = elements.value.slice().sort((a, b) => a.page - b.page);

  if (!items.length) return;

  isBusy.value = true;
  try {
    for (const el of items) {
      if (el.type === "text") {
        if (!el.value.trim()) continue;

        const maxWidth = el.wRel * pageW.value;
        const fittedSize = el.autoFit ? pickFontSizeToFit(el.value, maxWidth, el.fontSize) : el.fontSize;

        const options = {
          text: el.value,
          opacity: el.opacity,
          page: el.page,
          x: relToPdfX(el.xRel),
          y: relToPdfY(el.yRel),
          fontSize: fittedSize,
          color: el.color,
          font: uiFontToPdf(el.font),
          bold: el.bold,
          italic: el.italic,
          underline: el.underline,
          align: el.align,
          maxWidth,
        };

        const form = new FormData();
        form.append("tool", "watermark_text");
        form.append("options", JSON.stringify(options));
        await $fetch(`${config.public.apiBase}/pdf/apply/${jobId.value}`, {method: "POST", body: form});
      }

      if (el.type === "signature") {
        if (!el.strokes.length) continue;

        const options = {
          page: el.page,
          x: relToPdfX(el.xRel),
          // IMPORTANT: signature tool expects y as "bottom of box" in PDF coords
          y: relToPdfY(el.yRel) - el.hRel * pageH.value,
          w: el.wRel * pageW.value,
          h: el.hRel * pageH.value,
          strokes: el.strokes.map((stroke) => stroke.map(([x, y]) => [x, 1 - y])),
          strokeWidth: el.strokeWidth,
          opacity: el.opacity,
          // color for signature: backend currently uses white.
          // When backend adds 'color', include it here.
        };

        const form = new FormData();
        form.append("tool", "draw_signature");
        form.append("options", JSON.stringify(options));
        await $fetch(`${config.public.apiBase}/pdf/apply/${jobId.value}`, {method: "POST", body: form});
      }
    }

    await refreshInfo();
    // after save you may want to keep UI elements (for continuing) or clear them:
    // elements.value = [];
    // selectedId.value = null;
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Save failed";
  } finally {
    isBusy.value = false;
  }
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

              <u-select
                  :disabled="isBusy"
                  v-model="bgColor"
                  :items="[
                  { label: t('services.pdfEditor.bg.white'), value: 'white' },
                  { label: t('services.pdfEditor.bg.black'), value: 'black' },
                  { label: t('services.pdfEditor.bg.transparent'), value: null },
                ]"
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

              <button type="button" class="pdf__icon-btn" @click="download" :disabled="isBusy">
                <u-icon name="i-lucide-download"/>
              </button>

              <custom-button
                  variant="full"
                  class="pdf__save-btn"
                  :class="{ 'opacity-60 pointer-events-none': isBusy }"
                  @click="saveDocument"
              >
                {{ t("services.pdfEditor.saveDocument") || "Save document" }}
              </custom-button>
            </div>
          </div>

          <!-- Toolstrip: creates new elements -->
          <div class="pdf__toolstrip">
            <button type="button" class="services__pill" :class="{ services__pill_active: tool === 'text' }"
                    @click="addText">
              <u-icon name="i-lucide-type"/>
              {{ t("services.pdfEditor.tools.text") }}
            </button>

            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: tool === 'signature' }"
                @click="addSignature"
            >
              <u-icon name="i-lucide-pen-tool"/>
              {{ t("services.pdfEditor.tools.signature") }}
            </button>

            <button type="button" class="services__pill" :disabled="!selectedId" @click="removeSelected">
              <u-icon name="i-lucide-trash-2"/>
              {{ t("services.pdfEditor.removeElement") || "Remove" }}
            </button>
          </div>

          <div v-if="selectedEl && selectedEl.type === 'text'" class="pdf__tool-section">
            <div class="pdf__tool-title">{{ t("services.pdfEditor.text.title") }}</div>

            <div class="pdf__tool-grid4">
              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.valueLabel") }}</div>
                <u-input v-model="selectedEl.value" :placeholder="t('services.pdfEditor.text.valuePlaceholder')"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.fontLabel") }}</div>
                <u-select v-model="selectedEl.font" :items="availableFonts"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.fontSizeLabel") }}</div>
                <u-input v-model.number="selectedEl.fontSize" type="number" min="8" max="120"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.colorLabel") }}</div>
                <u-input v-model="selectedEl.color" type="color"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.opacityLabel") }}</div>
                <u-input v-model.number="selectedEl.opacity" type="number" min="5" max="100"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.text.alignLabel") }}</div>
                <u-select v-model="selectedEl.align" :items="alignOptions"/>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">{{ t("services.pdfEditor.text.styleLabel") }}</div>
                <div class="pdf__style-row">
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: selectedEl.bold }"
                          @click="selectedEl.bold = !selectedEl.bold">
                    B
                  </button>
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: selectedEl.italic }"
                          @click="selectedEl.italic = !selectedEl.italic">
                    I
                  </button>
                  <button
                      type="button"
                      class="pdf__chip"
                      :class="{ pdf__chip_active: selectedEl.underline }"
                      @click="selectedEl.underline = !selectedEl.underline"
                  >
                    U
                  </button>

                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: selectedEl.autoFit }"
                          @click="selectedEl.autoFit = !selectedEl.autoFit">
                    AF
                  </button>
                </div>
                <div class="pdf__help text-muted" style="margin-top:6px">
                  {{ t("services.pdfEditor.text.autoFitHelp") || "AF = auto-fit font size to box width" }}
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedEl && selectedEl.type === 'signature'" class="pdf__tool-section">
            <div class="pdf__tool-title">{{ t("services.pdfEditor.signature.title") }}</div>

            <div class="pdf__tool-grid4">
              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.strokeWidthLabel") }}</div>
                <u-input v-model.number="selectedEl.strokeWidth" type="number" min="0.5" max="8"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.opacityLabel") }}</div>
                <u-input v-model.number="selectedEl.opacity" type="number" min="10" max="100"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.colorLabel") || "Color" }}</div>
                <u-input v-model="selectedEl.color" type="color"/>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">{{ t("services.pdfEditor.signature.actionsLabel") }}</div>
                <button type="button" class="services__pill" :disabled="isBusy" @click="selectedEl.strokes = []">
                  <u-icon name="i-lucide-eraser"/>
                  {{ t("services.pdfEditor.signature.clear") }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="errorMsg" class="pdf__error">{{ errorMsg }}</div>

          <!-- Canvas -->
          <div class="pdf__canvas-wrap">
            <div
                ref="stageRef"
                class="pdf__stage"
                :class="{ pdf__stage_white: bgColor === 'white', pdf__stage_black: bgColor === 'black' }"
                @pointerdown="onStageDown"
            >
              <img :src="previewUrl" class="pdf__preview" alt=""/>

              <!-- Render only elements for current page -->
              <template v-for="el in elements.filter((x) => x.page === page)" :key="el.id">
                <TextOverlay
                    v-if="el.type === 'text'"
                    data-el-root="true"
                    :selected="selectedId === el.id"
                    :disabled="isBusy"
                    :xRel="el.xRel"
                    :yRel="el.yRel"
                    :wRel="el.wRel"
                    :hRel="el.hRel"
                    :value="el.value"
                    :opacity="el.opacity"
                    :color="el.color"
                    :font="el.font"
                    :bold="el.bold"
                    :italic="el.italic"
                    :underline="el.underline"
                    :align="el.align"
                    :fontSize="el.fontSize"
                    :autoFit="el.autoFit"
                    :minFontSize="8"
                    :maxFontSize="120"
                    @pointerdown.stop="selectEl(el.id)"
                    @update:xRel="(v:number) => (el.xRel = v)"
                    @update:yRel="(v:number) => (el.yRel = v)"
                    @update:wRel="(v:number) => (el.wRel = v)"
                    @update:hRel="(v:number) => (el.hRel = v)"
                    @update:fontSize="(v:number) => (el.fontSize = v)"
                />

                <SignatureOverlay
                    v-else
                    data-el-root="true"
                    :selected="selectedId === el.id"
                    :disabled="isBusy"
                    :xRel="el.xRel"
                    :yRel="el.yRel"
                    :wRel="el.wRel"
                    :hRel="el.hRel"
                    :strokes="el.strokes"
                    :strokeWidth="el.strokeWidth"
                    :opacity="el.opacity"
                    :color="el.color"
                    @pointerdown.stop="selectEl(el.id)"
                    @update:xRel="(v: number) => (el.xRel = v)"
                    @update:yRel="(v: number) => (el.yRel = v)"
                    @update:wRel="(v: number) => (el.wRel = v)"
                    @update:hRel="(v: number) => (el.hRel = v)"
                    @update:strokes="(v: Array<Array<[number, number]>>) => (el.strokes = v)"
                />
              </template>
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

.pdf__save-btn {
  min-width: 190px;
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

.pdf__help {
  font-size: 12px;
  line-height: 1.35;
}

.pdf__style-row {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pdf__chip {
  width: 38px;
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
  user-select: none;
  pointer-events: none;
}
</style>
