<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { BaseFabricObject, Canvas, Ellipse, FabricImage, FabricObject, PencilBrush, Rect, Textbox } from "fabric";

(BaseFabricObject as any).ownDefaults.originX = "center";
(BaseFabricObject as any).ownDefaults.originY = "center";

const config = useRuntimeConfig();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const docId = computed(() => String(route.params.docId || ""));

// --- pdf meta
const pages = ref<number>(1);
const pageW = ref<number>(595);
const pageH = ref<number>(842);

const page = ref<number>(1);
const dpi = ref<number>(144);

const isBusy = ref(false);
const errorMsg = ref<string | null>(null);

const stageRef = ref<HTMLDivElement | null>(null);
const previewImgRef = ref<HTMLImageElement | null>(null);
const overlayCanvasRef = ref<HTMLCanvasElement | null>(null);

const bgColor = ref<string | null>(null);

// --- editor tool state
type Mode = "move" | "pen" | "highlighter" | "signature" | "rect" | "circle" | "text" | "image";
type BrushShape = "round" | "square";

function setByTopLeft(obj: any, left: number, top: number) {
  // IMPORTANT: sizes must be known (after width/height/scale)
  const w = obj.getScaledWidth?.() ?? obj.width ?? 0;
  const h = obj.getScaledHeight?.() ?? obj.height ?? 0;

  obj.set({
    left: left + w / 2,
    top: top + h / 2,
  });
  obj.setCoords?.();
}

const editor = reactive({
  mode: "move" as Mode,
  color: "#7c3aed",
  opacity: 80, // 0..100
  size: 6, // brush width
  brushShape: "round" as BrushShape,

  // text defaults
  textValue: "Hello!",
  textFont: "Helvetica",
  textSize: 32,
  textBold: false,
  textItalic: false,
  textUnderline: false,

  // signature defaults
  signatureSize: 2.0,
});

// --- draft (per-page json)
type PdfDraft = {
  v: 1;
  updatedAt: number;
  pages: Record<number, any>;
  ui?: { page?: number; zoom?: number };
};

const pageJson = reactive<Record<number, any>>({});

// --- history (per current page)
const history = reactive({
  stack: [] as any[],
  idx: -1,
  lock: false,
});

// fabric canvas instance
let c: Canvas | null = null;

// --- preview URL
const previewUrl = computed(() => {
  if (!docId.value) return "";
  return `${config.public.apiBase}/pdf/preview/${docId.value}/${page.value}?dpi=${dpi.value}`;
});

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, x));
}

watch(dpi, () => {
  dpi.value = clampInt(dpi.value, 72, 220);
});

// --- API helpers
function api(path: string) {
  return `${config.public.apiBase}${path}`;
}

// =========================
// Draft: load/save Redis
// =========================
let saveDraftTimer: any = null;

function scheduleSaveDraft() {
  clearTimeout(saveDraftTimer);
  saveDraftTimer = setTimeout(saveDraftNow, 650);
}

async function saveDraftNow() {
  if (!docId.value) return;
  try {
    if (c) pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);
    const draft: PdfDraft = {
      v: 1,
      updatedAt: Date.now(),
      pages: { ...pageJson },
      ui: { page: page.value },
    };
    await $fetch(api(`/pdf/draft/${docId.value}`), { method: "PUT", body: { draft } });
  } catch {
    // ignore
  }
}

async function loadDraft() {
  if (!docId.value) return;
  try {
    const res = await $fetch<{ draft: PdfDraft }>(api(`/pdf/draft/${docId.value}`));
    if (res?.draft?.pages) {
      Object.assign(pageJson, res.draft.pages);
      if (res.draft.ui?.page) page.value = clampInt(res.draft.ui.page, 1, 9999);
    }
  } catch {
    // 404 ok
  }
}

// =========================
// PDF info
// =========================
async function refreshInfo() {
  if (!docId.value) return;

  const info = await $fetch<{ pages: number; pageW: number; pageH: number }>(api(`/pdf/page-info/${docId.value}`));
  pages.value = info.pages;
  pageW.value = info.pageW;
  pageH.value = info.pageH;

  if (page.value > pages.value) page.value = pages.value;
  if (page.value < 1) page.value = 1;
}

// =========================
// Fabric helpers
// =========================
function rgbaFromHex(hex: string, alpha01: number) {
  const v = (hex || "").replace("#", "").trim();
  const s = v.length === 3 ? v.split("").map((x) => x + x).join("") : v;
  const n = parseInt(s || "ffffff", 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const a = Math.max(0, Math.min(1, alpha01));
  return `rgba(${r},${g},${b},${a})`;
}

function ensureFabric() {
  if (!overlayCanvasRef.value) return;

  if (c) {
    c.dispose();
    c = null;
  }

  c = new Canvas(overlayCanvasRef.value, {
    selection: true,
    preserveObjectStacking: true,
    stopContextMenu: true,
  });

  // Ensure brush exists (Fabric v7 may not create it until needed)
  if (!c.freeDrawingBrush) c.freeDrawingBrush = new PencilBrush(c);

  FabricObject.prototype.transparentCorners = false;
  FabricObject.prototype.cornerStyle = "circle";

  const pushHistory = () => {
    if (!c || history.lock) return;

    const snap = c.toJSON(["id", "tool", "opacityPct"]);
    history.stack = history.stack.slice(0, history.idx + 1);
    history.stack.push(snap);
    history.idx = history.stack.length - 1;

    pageJson[page.value] = snap;
    scheduleSaveDraft();
  };

  c.on("path:created", pushHistory);
  c.on("object:modified", pushHistory);
  c.on("object:removed", pushHistory);

  applyMode();
}

function resizeToPreview() {
  if (!c || !previewImgRef.value) return;

  const r = previewImgRef.value.getBoundingClientRect();
  const w = Math.max(1, r.width);
  const h = Math.max(1, r.height);

  // Fabric handles retina scaling internally
  c.setDimensions({ width: w, height: h });
  c.calcOffset();
  c.requestRenderAll();
}

function loadCanvasForPage(p: number) {
  if (!c) return;

  history.lock = true;
  c.clear();

  resizeToPreview();

  const json = pageJson[p];
  if (json) {
    c.loadFromJSON(json, () => {
      history.lock = false;
      history.stack = [c!.toJSON(["id", "tool", "opacityPct"])];
      history.idx = 0;
      c!.requestRenderAll();
    });
  } else {
    history.lock = false;
    history.stack = [c.toJSON(["id", "tool", "opacityPct"])];
    history.idx = 0;
    c.requestRenderAll();
  }
}

function applyMode() {
  if (!c) return;

  const isMove = editor.mode === "move";
  const isDraw = editor.mode === "pen" || editor.mode === "highlighter" || editor.mode === "signature";

  c.selection = isMove;
  c.forEachObject((o) => {
    o.selectable = isMove;
    o.evented = true;
  });

  c.isDrawingMode = !isMove && isDraw;

  if (c.isDrawingMode) {
    if (!c.freeDrawingBrush) c.freeDrawingBrush = new PencilBrush(c);

    const alpha = editor.opacity / 100;
    c.freeDrawingBrush.color =
        editor.mode === "highlighter" ? rgbaFromHex(editor.color, alpha * 0.35) : rgbaFromHex(editor.color, alpha);

    c.freeDrawingBrush.width = Math.max(1, editor.mode === "signature" ? editor.signatureSize : editor.size);
  }

  c.defaultCursor = isMove ? "default" : "crosshair";
  c.hoverCursor = isMove ? "move" : "crosshair";
  c.requestRenderAll();
}

// =========================
// Tools actions (add objects)
// =========================
function addRect() {
  if (!c) return;

  const alpha = editor.opacity / 100;
  const fill = rgbaFromHex(editor.color, alpha * 0.25);
  const stroke = rgbaFromHex(editor.color, alpha);

  const rect = new Rect({
    width: 260,
    height: 140,
    fill,
    stroke,
    strokeWidth: 2,
    rx: editor.brushShape === "round" ? 14 : 0,
    ry: editor.brushShape === "round" ? 14 : 0,
  });

  setByTopLeft(rect, 80, 80);
  c.add(rect);
  c.setActiveObject(rect);
  c.requestRenderAll();

  editor.mode = "move";
  applyMode();
}

function addCircle() {
  if (!c) return;

  const alpha = editor.opacity / 100;
  const fill = rgbaFromHex(editor.color, alpha * 0.25);
  const stroke = rgbaFromHex(editor.color, alpha);

  const circle = new Ellipse({
    rx: 120,
    ry: 80,
    fill,
    stroke,
    strokeWidth: 2,
  });

  setByTopLeft(circle, 90, 90);
  c.add(circle);
  c.setActiveObject(circle);
  c.requestRenderAll();

  editor.mode = "move";
  applyMode();
}

function addTextBox() {
  if (!c) return;

  const alpha = editor.opacity / 100;

  const txt = new Textbox(editor.textValue || "Text", {
    width: 320,
    fill: rgbaFromHex(editor.color, alpha),
    fontFamily: editor.textFont || "Helvetica",
    fontSize: clampInt(editor.textSize, 8, 120),
    fontWeight: editor.textBold ? "bold" : "normal",
    fontStyle: editor.textItalic ? "italic" : "normal",
    underline: editor.textUnderline,
  });

  setByTopLeft(txt, 80, 80);
  c.add(txt);
  c.setActiveObject(txt);
  c.requestRenderAll();

  editor.mode = "move";
  applyMode();
}

const imageInput = ref<HTMLInputElement | null>(null);

function openImagePicker() {
  imageInput.value?.click();
}

async function onPickImage(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || !c) return;

  const reader = new FileReader();
  reader.onload = async () => {
    const img = await FabricImage.fromURL(reader.result as string);
    img.set({ opacity: editor.opacity / 100 });

    const maxW = 360;
    const maxH = 220;
    const iw = img.width || 1;
    const ih = img.height || 1;
    const s = Math.min(maxW / iw, maxH / ih, 1);
    img.scale(s);

    setByTopLeft(img, 80, 80);
    c!.add(img);
    c!.setActiveObject(img);
    c!.requestRenderAll();

    editor.mode = "move";
    applyMode();
  };
  reader.readAsDataURL(file);
}

function removeSelected() {
  if (!c) return;
  const obj: any = c.getActiveObject();
  if (!obj) return;

  c.remove(obj);
  c.discardActiveObject();
  c.requestRenderAll();
}

function clearPage() {
  if (!c) return;
  c.clear();
  c.requestRenderAll();
  pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);
  scheduleSaveDraft();
}

// =========================
// Undo/Redo (local)
// =========================
const canUndo = computed(() => history.idx > 0);
const canRedo = computed(() => history.idx >= 0 && history.idx < history.stack.length - 1);

function undo() {
  if (!c || !canUndo.value) return;
  history.idx -= 1;

  history.lock = true;
  c.loadFromJSON(history.stack[history.idx], () => {
    history.lock = false;
    c!.requestRenderAll();
    pageJson[page.value] = history.stack[history.idx];
    scheduleSaveDraft();
  });
}

function redo() {
  if (!c || !canRedo.value) return;
  history.idx += 1;

  history.lock = true;
  c.loadFromJSON(history.stack[history.idx], () => {
    history.lock = false;
    c!.requestRenderAll();
    pageJson[page.value] = history.stack[history.idx];
    scheduleSaveDraft();
  });
}

// =========================
// Page switching
// =========================
async function setPage(p: number) {
  if (!docId.value || !c) return;

  const nextP = clampInt(p, 1, pages.value);
  if (nextP === page.value) return;

  pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);
  page.value = nextP;

  await nextTick();
  loadCanvasForPage(page.value);
  scheduleSaveDraft();
}

watch(page, () => {
  if (page.value < 1) page.value = 1;
  if (page.value > pages.value) page.value = pages.value;
});

// =========================
// Save flow: export PNG overlays per page -> backend save
// =========================
function calcMultiplier(): number {
  const img = previewImgRef.value;
  if (!img) return 1;

  const r = img.getBoundingClientRect();
  const displayedW = Math.max(1, r.width);

  const naturalW = img.naturalWidth || 0;
  if (naturalW <= 0) return 1;

  const m = naturalW / displayedW;
  return Number.isFinite(m) && m > 0 ? m : 1;
}

async function exportOverlaysPngByPage(): Promise<Record<number, string>> {
  if (!c) return {};

  // save current page json
  pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);

  const overlays: Record<number, string> = {};

  const curPage = page.value;
  const curJson = c.toJSON(["id", "tool", "opacityPct"]);

  for (let p = 1; p <= pages.value; p++) {
    const json = pageJson[p];
    if (!json) continue;

    await new Promise<void>((resolve, reject) => {
      history.lock = true;
      c!.loadFromJSON(json, () => {
        history.lock = false;

        try {
          resizeToPreview();
          const mult = calcMultiplier();
          overlays[p] = c!.toDataURL({ format: "png", multiplier: mult });
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // restore current
  await new Promise<void>((resolve, reject) => {
    history.lock = true;
    c!.loadFromJSON(curJson, () => {
      history.lock = false;
      try {
        resizeToPreview();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  page.value = curPage;
  return overlays;
}

async function saveDocument() {
  if (!docId.value) return;
  if (isBusy.value) return;

  // prevent "save while preview not loaded"
  const img = previewImgRef.value;
  if (!img || !img.complete || img.naturalWidth === 0) {
    errorMsg.value = "Preview is not loaded yet. Please wait a moment.";
    return;
  }

  errorMsg.value = null;
  isBusy.value = true;

  try {
    const overlays = await exportOverlaysPngByPage();

    const res = await $fetch<{ downloadUrl: string; expiresAtResult?: number }>(api(`/pdf/save/${docId.value}`), {
      method: "POST",
      body: { overlays, dpi: dpi.value },
    });

    await refreshInfo();

    if (res?.downloadUrl) {
      window.open(api(res.downloadUrl.replace(config.public.apiBase, "")) as any, "_blank");
    }
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Save failed";
  } finally {
    isBusy.value = false;
  }
}

// =========================
// Other actions
// =========================
function uploadNew() {
  router.push("/services/pdf-editor");
}

function downloadSource() {
  if (!docId.value) return;
  window.open(`${config.public.apiBase}/pdf/download/${docId.value}`, "_blank");
}

// =========================
// Keyboard shortcuts
// =========================
function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = (t.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  return t.isContentEditable;
}

function onKeyDown(e: KeyboardEvent) {
  if (isBusy.value) return;
  if (isTypingTarget(e.target)) return;

  if ((e.key === "Delete" || e.key === "Backspace") && c?.getActiveObject()) {
    e.preventDefault();
    removeSelected();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    undo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
    e.preventDefault();
    redo();
    return;
  }
}

watch(
    () => [editor.mode, editor.color, editor.opacity, editor.size, editor.signatureSize, editor.brushShape],
    () => applyMode(),
);

// =========================
// Lifecycle
// =========================
let onResize: any = null;

async function boot() {
  if (!docId.value) return;
  isBusy.value = true;
  errorMsg.value = null;

  try {
    await refreshInfo();
    await loadDraft();

    await nextTick();
    ensureFabric();

    // initial resize even if image already cached
    resizeToPreview();

    await nextTick();
    loadCanvasForPage(page.value);

    onResize = () => resizeToPreview();
    window.addEventListener("resize", onResize);

    const img = previewImgRef.value;
    if (img) {
      img.addEventListener("load", resizeToPreview, { passive: true });
      if (img.complete) resizeToPreview();
    }

    window.addEventListener("keydown", onKeyDown);
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Init failed";
  } finally {
    isBusy.value = false;
  }
}

watch(docId, async () => {
  page.value = 1;
  Object.keys(pageJson).forEach((k) => delete pageJson[Number(k)]);
  history.stack = [];
  history.idx = -1;
  errorMsg.value = null;

  await nextTick();
  await boot();
});

onMounted(boot);

onBeforeUnmount(() => {
  clearTimeout(saveDraftTimer);

  window.removeEventListener("keydown", onKeyDown);
  if (onResize) window.removeEventListener("resize", onResize);

  const img = previewImgRef.value;
  if (img) img.removeEventListener("load", resizeToPreview as any);

  if (c) {
    pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);
    saveDraftNow();
    c.dispose();
    c = null;
  }
});
</script>

<template>
  <u-container class="pdf">
    <div class="pdf__header text-center space-y-3">
      <page-header title="services.pdfEditor.title" headline="services.pdfEditor.headline" class="mb-6" />
      <p class="pdf__subtitle text-muted mx-auto">{{ t("services.pdfEditor.subtitle") }}</p>
    </div>

    <div class="pdf__grid">
      <section class="ui-anim-border pdf__panel pdf__panel_preview">
        <div class="ui-anim-border__inner pdf__panel-inner">
          <div class="pdf__panel-head">
            <div class="pdf__panel-title">
              <u-icon name="i-lucide-file-image" />
              <span>{{ t("services.pdfEditor.preview") }}</span>
            </div>

            <div class="pdf__top-actions">
              <button type="button" class="ui-pill-btn" @click="uploadNew" :disabled="isBusy">
                <span class="ui-pill-btn__inner">
                  <u-icon name="i-lucide-upload" />
                  {{ t("services.pdfEditor.upload.new") }}
                </span>
              </button>

              <div class="pdf__sep" />

              <u-select
                  :disabled="isBusy"
                  v-model="bgColor"
                  :items="[
                  { label: t('services.pdfEditor.bg.white'), value: 'white' },
                  { label: t('services.pdfEditor.bg.black'), value: 'black' },
                  { label: t('services.pdfEditor.bg.transparent'), value: null },
                ]"
              />

              <div class="pdf__sep" />

              <button type="button" class="pdf__icon-btn" :disabled="isBusy || page <= 1" @click="setPage(page - 1)">
                <u-icon name="i-lucide-chevron-left" />
              </button>

              <div class="pdf__page-chip">{{ t("services.pdfEditor.page") }} {{ page }} / {{ pages }}</div>

              <button type="button" class="pdf__icon-btn" :disabled="isBusy || page >= pages" @click="setPage(page + 1)">
                <u-icon name="i-lucide-chevron-right" />
              </button>

              <div class="pdf__sep" />

              <div class="pdf__toolbar-mini">
                <span class="text-muted">DPI</span>
                <u-input v-model.number="dpi" type="number" min="72" max="220" class="pdf__dpi" />
              </div>

              <div class="pdf__sep" />

              <button type="button" class="pdf__icon-btn" @click="downloadSource" :disabled="isBusy">
                <u-icon name="i-lucide-download" />
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

          <!-- TOOLSTRIP -->
          <div class="pdf__toolstrip">
            <button type="button" class="services__pill" :class="{ services__pill_active: editor.mode === 'move' }" @click="editor.mode = 'move'" :disabled="isBusy">
              <u-icon name="i-lucide-move" />
              Move
            </button>

            <button type="button" class="services__pill" :class="{ services__pill_active: editor.mode === 'pen' }" @click="editor.mode = 'pen'" :disabled="isBusy">
              <u-icon name="i-lucide-pencil" />
              Pen
            </button>

            <button type="button" class="services__pill" :class="{ services__pill_active: editor.mode === 'highlighter' }" @click="editor.mode = 'highlighter'" :disabled="isBusy">
              <u-icon name="i-lucide-highlighter" />
              Highlight
            </button>

            <button type="button" class="services__pill" :class="{ services__pill_active: editor.mode === 'signature' }" @click="editor.mode = 'signature'" :disabled="isBusy">
              <u-icon name="i-lucide-signature" />
              Signature
            </button>

            <button type="button" class="services__pill" @click="addRect" :disabled="isBusy">
              <u-icon name="i-lucide-square" />
              Rect
            </button>

            <button type="button" class="services__pill" @click="addCircle" :disabled="isBusy">
              <u-icon name="i-lucide-circle" />
              Circle
            </button>

            <button type="button" class="services__pill" @click="addTextBox" :disabled="isBusy">
              <u-icon name="i-lucide-type" />
              Text
            </button>

            <button type="button" class="services__pill" @click="openImagePicker" :disabled="isBusy">
              <u-icon name="i-lucide-image" />
              Image
            </button>
            <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onPickImage" />

            <div class="pdf__sep pdf__sep_small" />

            <button type="button" class="services__pill" :disabled="isBusy || !canUndo" @click="undo">
              <u-icon name="i-lucide-undo-2" />
              Undo
            </button>
            <button type="button" class="services__pill" :disabled="isBusy || !canRedo" @click="redo">
              <u-icon name="i-lucide-redo-2" />
              Redo
            </button>

            <button type="button" class="services__pill" :disabled="isBusy" @click="removeSelected">
              <u-icon name="i-lucide-trash-2" />
              Remove
            </button>

            <button type="button" class="services__pill" :disabled="isBusy" @click="clearPage">
              <u-icon name="i-lucide-eraser" />
              Clear page
            </button>
          </div>

          <!-- PROPS -->
          <div class="pdf__tool-section">
            <div class="pdf__tool-title">Tool settings</div>

            <div class="pdf__tool-grid4">
              <div class="pdf__field">
                <div class="pdf__label">Color</div>
                <u-input v-model="editor.color" type="color" />
              </div>

              <div class="pdf__field">
                <div class="pdf__label">Opacity</div>
                <u-input v-model.number="editor.opacity" type="number" min="5" max="100" />
              </div>

              <div class="pdf__field">
                <div class="pdf__label">Size</div>
                <u-input v-model.number="editor.size" type="number" min="1" max="40" />
              </div>

              <div class="pdf__field">
                <div class="pdf__label">Shape</div>
                <u-select
                    v-model="editor.brushShape"
                    :items="[
                    { label: 'Round', value: 'round' },
                    { label: 'Square', value: 'square' },
                  ]"
                />
                <div class="pdf__help text-muted" style="margin-top: 6px">
                  Square is applied to shapes. Brush remains round.
                </div>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">Text (defaults for new text objects)</div>
                <div class="pdf__style-row">
                  <u-input v-model="editor.textValue" placeholder="Text..." style="min-width: 220px" />
                  <u-input v-model.number="editor.textSize" type="number" min="8" max="120" style="width: 120px" />
                  <u-input v-model="editor.textFont" placeholder="Font (e.g. Helvetica)" style="min-width: 200px" />

                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: editor.textBold }" @click="editor.textBold = !editor.textBold">B</button>
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: editor.textItalic }" @click="editor.textItalic = !editor.textItalic">I</button>
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: editor.textUnderline }" @click="editor.textUnderline = !editor.textUnderline">U</button>
                </div>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">Signature thickness</div>
                <u-input v-model.number="editor.signatureSize" type="number" min="1" max="12" style="width: 140px" />
              </div>
            </div>

            <div class="pdf__help text-muted">
              Move mode lets you drag / rotate / resize selected objects. Drawing modes paint directly on the overlay canvas.
              Draft autosaves to Redis and restores when you reopen.
            </div>
          </div>

          <div v-if="errorMsg" class="pdf__error">{{ errorMsg }}</div>

          <div class="pdf__canvas-wrap">
            <div ref="stageRef" class="pdf__stage" :class="{ pdf__stage_white: bgColor === 'white', pdf__stage_black: bgColor === 'black' }">
              <img ref="previewImgRef" :src="previewUrl" class="pdf__preview" alt="" />
              <canvas ref="overlayCanvasRef" class="pdf__overlay" />
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

  &_small {
    height: 22px;
    margin: 0 2px;
    opacity: 0.7;
  }
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
  align-items: center;
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

/* Keep Fabric canvas-container pinned over the preview */
.pdf__stage :deep(.canvas-container) {
  position: absolute !important;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
}

.pdf__stage :deep(.lower-canvas),
.pdf__stage :deep(.upper-canvas) {
  position: absolute;
  inset: 0;
}

.pdf__preview {
  width: 100%;
  height: auto;
  display: block;
  user-select: none;
  pointer-events: none;
}

.pdf__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
