<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";
import {fabric} from "fabric";

const config = useRuntimeConfig();
const {t} = useI18n();
const route = useRoute();
const router = useRouter();

const jobId = computed(() => String(route.params.jobId || ""));

// --- pdf meta
const pages = ref<number>(1);
const pageW = ref<number>(595);
const pageH = ref<number>(842);
// activeVersion больше не нужен в новом флоу, но оставим, чтобы не рушить preview endpoint прямо сейчас
const activeVersion = ref<number>(1);

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
  pages: Record<number, any>; // fabric json per page
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
let c: fabric.Canvas | null = null;

// --- preview URL
const previewUrl = computed(() => {
  if (!jobId.value) return "";
  // пока оставляем v=activeVersion, чтобы работало с твоим текущим /preview
  return `${config.public.apiBase}/pdf/preview/${jobId.value}/${page.value}?dpi=${dpi.value}&v=${activeVersion.value}`;
});

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? n : min;
  return Math.max(min, Math.min(max, x));
}

watch(dpi, (v) => {
  dpi.value = clampInt(v, 72, 220);
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
  if (!jobId.value) return;
  try {
    // save current page json too
    if (c) pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);
    const draft: PdfDraft = {
      v: 1,
      updatedAt: Date.now(),
      pages: {...pageJson},
      ui: {page: page.value},
    };
    await $fetch(api(`/pdf/draft/${jobId.value}`), {method: "PUT", body: {draft}});
  } catch {
    // не мешаем пользователю работать
  }
}

async function loadDraft() {
  if (!jobId.value) return;
  try {
    const res = await $fetch<{ draft: PdfDraft }>(api(`/pdf/draft/${jobId.value}`));
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
  if (!jobId.value) return;
  const info = await $fetch<{ pages: number; pageW: number; pageH: number; activeVersion?: number }>(
      api(`/pdf/page-info/${jobId.value}`),
  );

  pages.value = info.pages;
  pageW.value = info.pageW;
  pageH.value = info.pageH;
  if (typeof info.activeVersion === "number") activeVersion.value = info.activeVersion;

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

  c = new fabric.Canvas(overlayCanvasRef.value, {
    selection: true,
    preserveObjectStacking: true,
    stopContextMenu: true,
  });

  // slightly nicer corners
  fabric.Object.prototype.transparentCorners = false;
  fabric.Object.prototype.cornerStyle = "circle";

  // History: пушим только на “значимые” события
  const pushHistory = () => {
    if (!c || history.lock) return;

    const snap = c.toJSON(["id", "tool", "opacityPct"]);
    // truncate redo tail
    history.stack = history.stack.slice(0, history.idx + 1);
    history.stack.push(snap);
    history.idx = history.stack.length - 1;

    pageJson[page.value] = snap;
    scheduleSaveDraft();
  };

  c.on("path:created", pushHistory);
  c.on("object:modified", pushHistory);
  // object:added тоже будет срабатывать на loadFromJSON — поэтому блокируем history.lock в loadCanvasForPage()
  c.on("object:added", pushHistory);
  c.on("object:removed", pushHistory);

  applyMode();
}

function resizeToPreview() {
  if (!c || !overlayCanvasRef.value || !previewImgRef.value) return;

  const img = previewImgRef.value;
  const r = img.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  overlayCanvasRef.value.style.width = `${r.width}px`;
  overlayCanvasRef.value.style.height = `${r.height}px`;
  overlayCanvasRef.value.width = Math.max(1, Math.floor(r.width * dpr));
  overlayCanvasRef.value.height = Math.max(1, Math.floor(r.height * dpr));

  c.setWidth(r.width);
  c.setHeight(r.height);
  c.setZoom(1);
  c.renderAll();
}

function loadCanvasForPage(p: number) {
  if (!c) return;

  history.lock = true;
  c.clear();

  const json = pageJson[p];
  if (json) {
    c.loadFromJSON(json, () => {
      history.lock = false;
      c!.renderAll();
      resizeToPreview();

      // init history baseline
      history.stack = [c!.toJSON(["id", "tool", "opacityPct"])];
      history.idx = 0;
    });
  } else {
    history.lock = false;
    resizeToPreview();

    history.stack = [c.toJSON(["id", "tool", "opacityPct"])];
    history.idx = 0;
  }
}

function applyMode() {
  if (!c) return;

  const isMove = editor.mode === "move";
  const isDraw = editor.mode === "pen" || editor.mode === "highlighter" || editor.mode === "signature";

  // select/move mode
  c.selection = isMove;
  c.forEachObject((o) => {
    o.selectable = isMove;
    o.evented = true;
  });

  // drawing mode
  c.isDrawingMode = !isMove && isDraw;

  if (c.isDrawingMode) {
    const alpha = editor.opacity / 100;
    const col =
        editor.mode === "highlighter"
            ? rgbaFromHex(editor.color, alpha * 0.35)
            : rgbaFromHex(editor.color, alpha);

    const brush = c.freeDrawingBrush as any;
    brush.color = col;

    // Pen vs Signature: signature uses its own thickness by default
    if (editor.mode === "signature") brush.width = Math.max(1, editor.signatureSize);
    else brush.width = Math.max(1, editor.size);

    // square brush: Fabric doesn’t provide perfect square brush out of the box.
    // We keep round here; square is used for shapes. (Can add custom brush later.)
  }

  c.defaultCursor = isMove ? "default" : "crosshair";
  c.hoverCursor = isMove ? "move" : "crosshair";
  c.renderAll();
}

// =========================
// Tools actions (add objects)
// =========================
function addRect() {
  if (!c) return;
  const alpha = editor.opacity / 100;

  const fill = rgbaFromHex(editor.color, alpha * 0.25);
  const stroke = rgbaFromHex(editor.color, alpha);

  const rect = new fabric.Rect({
    left: 80,
    top: 80,
    width: 260,
    height: 140,
    fill,
    stroke,
    strokeWidth: 2,
    rx: editor.brushShape === "round" ? 14 : 0,
    ry: editor.brushShape === "round" ? 14 : 0,
  });

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

  const circle = new fabric.Ellipse({
    left: 90,
    top: 90,
    rx: 120,
    ry: 80,
    fill,
    stroke,
    strokeWidth: 2,
  });

  c.add(circle);
  c.setActiveObject(circle);
  c.requestRenderAll();
  editor.mode = "move";
  applyMode();
}

function addTextBox() {
  if (!c) return;
  const alpha = editor.opacity / 100;

  const style: Partial<fabric.Textbox> = {
    left: 80,
    top: 80,
    width: 320,
    fill: rgbaFromHex(editor.color, alpha),
    fontFamily: editor.textFont || "Helvetica",
    fontSize: clampInt(editor.textSize, 8, 120),
    fontWeight: editor.textBold ? ("bold" as any) : ("normal" as any),
    fontStyle: editor.textItalic ? ("italic" as any) : ("normal" as any),
    underline: editor.textUnderline,
  };

  const txt = new fabric.Textbox(editor.textValue || "Text", style);
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

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<fabric.Image>((resolve, reject) => {
      fabric.Image.fromURL(
          url,
          (o) => (o ? resolve(o) : reject(new Error("Image load failed"))),
          {crossOrigin: "anonymous"},
      );
    });

    img.set({
      left: 80,
      top: 80,
      opacity: editor.opacity / 100,
    });

    // auto scale to something sane
    const maxW = 360;
    const maxH = 220;
    const iw = img.width || 1;
    const ih = img.height || 1;
    const s = Math.min(maxW / iw, maxH / ih, 1);
    img.scale(s);

    c.add(img);
    c.setActiveObject(img);
    c.requestRenderAll();

    editor.mode = "move";
    applyMode();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function removeSelected() {
  if (!c) return;
  const obj = c.getActiveObject();
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
    c!.renderAll();
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
    c!.renderAll();
    pageJson[page.value] = history.stack[history.idx];
    scheduleSaveDraft();
  });
}

// =========================
// Page switching
// =========================
async function setPage(p: number) {
  if (!jobId.value) return;
  if (!c) return;

  const nextP = clampInt(p, 1, pages.value);
  if (nextP === page.value) return;

  // save current page json
  pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);

  page.value = nextP;

  // let img update, then load json for that page
  await nextTick();
  loadCanvasForPage(page.value);
  scheduleSaveDraft();
}

watch(page, async () => {
  // clamp
  if (page.value < 1) page.value = 1;
  if (page.value > pages.value) page.value = pages.value;
});

// =========================
// Save flow: export PNG overlays per page -> backend save
// =========================
async function exportOverlaysPngByPage(): Promise<Record<number, string>> {
  if (!c) return {};
  // make sure current page saved
  pageJson[page.value] = c.toJSON(["id", "tool", "opacityPct"]);

  const overlays: Record<number, string> = {};

  const curPage = page.value;
  const curJson = c.toJSON(["id", "tool", "opacityPct"]);

  // render each page json -> dataURL
  for (let p = 1; p <= pages.value; p++) {
    const json = pageJson[p];
    if (!json) continue;

    await new Promise<void>((resolve) => {
      history.lock = true;
      c!.loadFromJSON(json, () => {
        history.lock = false;
        c!.renderAll();
        resizeToPreview();

        // IMPORTANT:
        // toDataURL produces overlay in preview pixel space.
        // backend should paste overlay on full page.
        const r = previewImgRef.value!.getBoundingClientRect();
        const mult = previewImgRef.value!.naturalWidth / Math.max(1, r.width);
        overlays[p] = c!.toDataURL({format: "png", multiplier: mult});
        resolve();
      });
    });
  }

  // restore current
  await new Promise<void>((resolve) => {
    history.lock = true;
    c!.loadFromJSON(curJson, () => {
      history.lock = false;
      c!.renderAll();
      resizeToPreview();
      resolve();
    });
  });
  page.value = curPage;

  return overlays;
}

async function saveDocument() {
  if (!jobId.value) return;
  if (isBusy.value) return;

  errorMsg.value = null;
  isBusy.value = true;

  try {
    const overlays = await exportOverlaysPngByPage();

    const res = await $fetch<{ downloadUrl: string; expiresAtResult?: number }>(api(`/pdf/save/${jobId.value}`), {
      method: "POST",
      body: {
        overlays,
        dpi: dpi.value,
      },
    });

    // обновим инфо (если у тебя пока сохраняется в job/versions — можно убрать позже)
    await refreshInfo();

    // открыть результат
    if (res?.downloadUrl) window.open(api(res.downloadUrl.replace(config.public.apiBase, "")) as any, "_blank");
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
  if (!jobId.value) return;
  window.open(`${config.public.apiBase}/pdf/download/${jobId.value}`, "_blank");
}

// =========================
// Keyboard shortcuts
// =========================
function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = (t.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  return t.isContentEditable === true;
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
async function boot() {
  if (!jobId.value) return;
  isBusy.value = true;
  errorMsg.value = null;

  try {
    await refreshInfo();
    await loadDraft();

    // init fabric
    await nextTick();
    ensureFabric();

    // wait preview load
    await nextTick();
    loadCanvasForPage(page.value);

    // resize listeners
    const onResize = () => resizeToPreview();
    window.addEventListener("resize", onResize);

    // when preview image loads -> resize overlay
    const img = previewImgRef.value;
    if (img) {
      img.addEventListener("load", resizeToPreview, {passive: true});
    }

    // keyboard
    window.addEventListener("keydown", onKeyDown);

    onBeforeUnmount(() => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      if (img) img.removeEventListener("load", resizeToPreview as any);
    });
  } catch (e: any) {
    errorMsg.value = e?.data?.detail?.message || e?.message || "Init failed";
  } finally {
    isBusy.value = false;
  }
}

watch(jobId, async () => {
  // reset
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
  if (c) {
    // flush draft on exit
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

              <button type="button" class="pdf__icon-btn" :disabled="isBusy || page <= 1" @click="setPage(page - 1)">
                <u-icon name="i-lucide-chevron-left"/>
              </button>

              <div class="pdf__page-chip">{{ t("services.pdfEditor.page") }} {{ page }} / {{ pages }}</div>

              <button type="button" class="pdf__icon-btn" :disabled="isBusy || page >= pages"
                      @click="setPage(page + 1)">
                <u-icon name="i-lucide-chevron-right"/>
              </button>

              <div class="pdf__sep"/>

              <div class="pdf__toolbar-mini">
                <span class="text-muted">DPI</span>
                <u-input v-model.number="dpi" type="number" min="72" max="220" class="pdf__dpi"/>
              </div>

              <div class="pdf__sep"/>

              <button type="button" class="pdf__icon-btn" @click="downloadSource" :disabled="isBusy">
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

          <!-- TOOLSTRIP -->
          <div class="pdf__toolstrip">
            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: editor.mode === 'move' }"
                @click="editor.mode = 'move'"
                :disabled="isBusy"
            >
              <u-icon name="i-lucide-move"/>
              Move
            </button>

            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: editor.mode === 'pen' }"
                @click="editor.mode = 'pen'"
                :disabled="isBusy"
            >
              <u-icon name="i-lucide-pencil"/>
              Pen
            </button>

            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: editor.mode === 'highlighter' }"
                @click="editor.mode = 'highlighter'"
                :disabled="isBusy"
            >
              <u-icon name="i-lucide-highlighter"/>
              Highlight
            </button>

            <button
                type="button"
                class="services__pill"
                :class="{ services__pill_active: editor.mode === 'signature' }"
                @click="editor.mode = 'signature'"
                :disabled="isBusy"
            >
              <u-icon name="i-lucide-signature"/>
              Signature
            </button>

            <button type="button" class="services__pill" @click="addRect" :disabled="isBusy">
              <u-icon name="i-lucide-square"/>
              Rect
            </button>

            <button type="button" class="services__pill" @click="addCircle" :disabled="isBusy">
              <u-icon name="i-lucide-circle"/>
              Circle
            </button>

            <button type="button" class="services__pill" @click="addTextBox" :disabled="isBusy">
              <u-icon name="i-lucide-type"/>
              Text
            </button>

            <button type="button" class="services__pill" @click="openImagePicker" :disabled="isBusy">
              <u-icon name="i-lucide-image"/>
              Image
            </button>
            <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="onPickImage"/>

            <div class="pdf__sep pdf__sep_small"/>

            <button type="button" class="services__pill" :disabled="isBusy || !canUndo" @click="undo">
              <u-icon name="i-lucide-undo-2"/>
              Undo
            </button>
            <button type="button" class="services__pill" :disabled="isBusy || !canRedo" @click="redo">
              <u-icon name="i-lucide-redo-2"/>
              Redo
            </button>

            <button type="button" class="services__pill" :disabled="isBusy" @click="removeSelected">
              <u-icon name="i-lucide-trash-2"/>
              Remove
            </button>

            <button type="button" class="services__pill" :disabled="isBusy" @click="clearPage">
              <u-icon name="i-lucide-eraser"/>
              Clear page
            </button>
          </div>

          <!-- PROPS -->
          <div class="pdf__tool-section">
            <div class="pdf__tool-title">Tool settings</div>

            <div class="pdf__tool-grid4">
              <div class="pdf__field">
                <div class="pdf__label">Color</div>
                <u-input v-model="editor.color" type="color"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">Opacity</div>
                <u-input v-model.number="editor.opacity" type="number" min="5" max="100"/>
              </div>

              <div class="pdf__field">
                <div class="pdf__label">Size</div>
                <u-input v-model.number="editor.size" type="number" min="1" max="40"/>
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

              <div class="pdf__field pdf__field_row" v-if="editor.mode === 'text' || true">
                <div class="pdf__label">Text (defaults for new text objects)</div>
                <div class="pdf__style-row">
                  <u-input v-model="editor.textValue" placeholder="Text..." style="min-width: 220px"/>
                  <u-input v-model.number="editor.textSize" type="number" min="8" max="120" style="width: 120px"/>
                  <u-input v-model="editor.textFont" placeholder="Font (e.g. Helvetica)" style="min-width: 200px"/>

                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: editor.textBold }"
                          @click="editor.textBold = !editor.textBold">
                    B
                  </button>
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: editor.textItalic }"
                          @click="editor.textItalic = !editor.textItalic">
                    I
                  </button>
                  <button type="button" class="pdf__chip" :class="{ pdf__chip_active: editor.textUnderline }"
                          @click="editor.textUnderline = !editor.textUnderline">
                    U
                  </button>
                </div>
              </div>

              <div class="pdf__field pdf__field_row">
                <div class="pdf__label">Signature thickness</div>
                <u-input v-model.number="editor.signatureSize" type="number" min="1" max="12" style="width: 140px"/>
              </div>
            </div>

            <div class="pdf__help text-muted">
              Move mode lets you drag / rotate / resize selected objects. Drawing modes paint directly on the overlay
              canvas.
              Draft autosaves to Redis and restores when you reopen.
            </div>
          </div>

          <div v-if="errorMsg" class="pdf__error">{{ errorMsg }}</div>

          <!-- STAGE -->
          <div class="pdf__canvas-wrap">
            <div
                ref="stageRef"
                class="pdf__stage"
                :class="{ pdf__stage_white: bgColor === 'white', pdf__stage_black: bgColor === 'black' }"
            >
              <img ref="previewImgRef" :src="previewUrl" class="pdf__preview" alt=""/>
              <canvas ref="overlayCanvasRef" class="pdf__overlay"/>
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
