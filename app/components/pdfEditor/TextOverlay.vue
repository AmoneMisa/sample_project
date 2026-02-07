<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";

type TextAlign = "left" | "center" | "right" | "justify";

const props = defineProps<{
  // kept for backward-compat; in new flow you can always render and toggle via v-if in parent
  enabled?: boolean;

  // selection (controls рамку/хендлы и возможность двигать/ресайзить)
  selected?: boolean;

  // position & size in stage relative coords (0..1)
  xRel: number;
  yRel: number;
  wRel: number;
  hRel: number;

  // content + style (UI preview)
  value: string;
  opacity: number; // 0..100
  color: string;
  font: string; // UI font family name
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: TextAlign;

  // fontSize is UI preview px; we will also use it as base and can auto-fit
  fontSize: number;

  // behavior
  disabled?: boolean;

  // if true -> fit fontSize to width when box / text changes
  autoFit?: boolean;

  minFontSize?: number;
  maxFontSize?: number;
}>();

const emit = defineEmits<{
  (e: "update:xRel", v: number): void;
  (e: "update:yRel", v: number): void;
  (e: "update:wRel", v: number): void;
  (e: "update:hRel", v: number): void;
  (e: "update:fontSize", v: number): void;
}>();

const boxRef = ref<HTMLDivElement | null>(null);
const measurerRef = ref<HTMLDivElement | null>(null);

const MIN_W = 0.10;
const MIN_H = 0.06;

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function getStageEl(): HTMLElement | null {
  return boxRef.value?.closest(".pdf__stage") as HTMLElement | null;
}

function getStageRect() {
  const stage = getStageEl();
  if (!stage) return null;
  return stage.getBoundingClientRect();
}

// clamp so that whole box stays inside stage
function clampRelXYWH(xRel: number, yRel: number, wRel: number, hRel: number) {
  wRel = Math.max(MIN_W, Math.min(1, wRel));
  hRel = Math.max(MIN_H, Math.min(1, hRel));

  const maxX = Math.max(0, 1 - wRel);
  const maxY = Math.max(0, 1 - hRel);

  xRel = Math.max(0, Math.min(maxX, xRel));
  yRel = Math.max(0, Math.min(maxY, yRel));

  return { xRel, yRel, wRel, hRel };
}

/** ---------------------------
 * Move (drag) — only when selected
 * --------------------------*/
const drag = reactive({
  active: false,
  pointerId: -1,
  dx: 0,
  dy: 0,
});

function onMoveDown(e: PointerEvent) {
  if (props.disabled) return;
  if (props.enabled === false) return;

  // IMPORTANT: if not selected — do NOT start dragging
  // Let parent handle selection by its own @pointerdown.stop on component
  if (!props.selected) return;

  const stageRect = getStageRect();
  if (!stageRect) return;

  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  drag.active = true;
  drag.pointerId = e.pointerId;

  const xPx = props.xRel * stageRect.width;
  const yPx = props.yRel * stageRect.height;

  drag.dx = e.clientX - (stageRect.left + xPx);
  drag.dy = e.clientY - (stageRect.top + yPx);
}

function onMoveMove(e: PointerEvent) {
  if (!drag.active) return;
  if (drag.pointerId !== e.pointerId) return;

  const stageRect = getStageRect();
  if (!stageRect) return;

  const x = e.clientX - stageRect.left - drag.dx;
  const y = e.clientY - stageRect.top - drag.dy;

  const nx = x / stageRect.width;
  const ny = y / stageRect.height;

  const clamped = clampRelXYWH(nx, ny, props.wRel, props.hRel);
  emit("update:xRel", clamped.xRel);
  emit("update:yRel", clamped.yRel);
}

function onMoveUp(e: PointerEvent) {
  if (drag.pointerId !== e.pointerId) return;
  drag.active = false;
  drag.pointerId = -1;

  const el = e.currentTarget as HTMLElement;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

/** ---------------------------
 * Resize — only when selected
 * --------------------------*/
const resizing = reactive({
  active: false,
  pointerId: -1,
  corner: "" as "br" | "tr" | "bl" | "tl" | "",
  startX: 0,
  startY: 0,
  startXRel: 0,
  startYRel: 0,
  startWRel: 0,
  startHRel: 0,
});

function onHandleDown(e: PointerEvent, corner: "br" | "tr" | "bl" | "tl") {
  if (props.disabled) return;
  if (props.enabled === false) return;
  if (!props.selected) return;

  const stageRect = getStageRect();
  if (!stageRect) return;

  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture(e.pointerId);

  resizing.active = true;
  resizing.pointerId = e.pointerId;
  resizing.corner = corner;

  resizing.startX = e.clientX;
  resizing.startY = e.clientY;

  resizing.startXRel = props.xRel;
  resizing.startYRel = props.yRel;
  resizing.startWRel = props.wRel;
  resizing.startHRel = props.hRel;
}

function onHandleMove(e: PointerEvent) {
  if (!resizing.active) return;
  if (resizing.pointerId !== e.pointerId) return;

  const stageRect = getStageRect();
  if (!stageRect) return;

  const dxRel = (e.clientX - resizing.startX) / stageRect.width;
  const dyRel = (e.clientY - resizing.startY) / stageRect.height;

  let xRel = resizing.startXRel;
  let yRel = resizing.startYRel;
  let wRel = resizing.startWRel;
  let hRel = resizing.startHRel;

  if (resizing.corner.includes("r")) wRel = resizing.startWRel + dxRel;
  if (resizing.corner.includes("l")) {
    wRel = resizing.startWRel - dxRel;
    xRel = resizing.startXRel + dxRel;
  }

  if (resizing.corner.includes("b")) hRel = resizing.startHRel + dyRel;
  if (resizing.corner.includes("t")) {
    hRel = resizing.startHRel - dyRel;
    yRel = resizing.startYRel + dyRel;
  }

  const clamped = clampRelXYWH(xRel, yRel, wRel, hRel);

  emit("update:xRel", clamped.xRel);
  emit("update:yRel", clamped.yRel);
  emit("update:wRel", clamped.wRel);
  emit("update:hRel", clamped.hRel);

  nextTick(() => autoFitFont());
}

function onHandleUp(e: PointerEvent) {
  if (resizing.pointerId !== e.pointerId) return;

  resizing.active = false;
  resizing.pointerId = -1;
  resizing.corner = "";

  const el = e.currentTarget as HTMLElement;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

/** ---------------------------
 * Font AutoFit (DOM-based)
 * --------------------------*/
function autoFitFont() {
  if (!props.autoFit) return;
  if (props.enabled === false) return;

  const minFs = props.minFontSize ?? 8;
  const maxFs = props.maxFontSize ?? 120;

  const stage = getStageRect();
  if (!stage) return;

  const boxWpx = Math.max(1, props.wRel * stage.width);
  const m = measurerRef.value;
  if (!m) return;

  const text = (props.value || "").trim();
  if (!text) return;

  let lo = minFs;
  let hi = Math.max(minFs, Math.min(maxFs, props.fontSize || maxFs));
  let best = lo;

  m.style.fontFamily = props.font || "inherit";
  m.style.fontWeight = props.bold ? "900" : "700";
  m.style.fontStyle = props.italic ? "italic" : "normal";
  m.style.whiteSpace = "pre-wrap";
  m.style.wordBreak = "break-word";
  m.style.lineHeight = "1.15";
  m.style.width = `${boxWpx}px`;

  for (let i = 0; i < 14; i++) {
    const mid = Math.floor((lo + hi) / 2);
    m.style.fontSize = `${mid}px`;
    m.textContent = text;

    const needed = m.scrollWidth;
    if (needed <= boxWpx + 0.5) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (best !== props.fontSize) emit("update:fontSize", best);
}

watch(
    () => [props.value, props.wRel, props.font, props.bold, props.italic, props.align],
    () => nextTick(() => autoFitFont()),
);

let ro: ResizeObserver | null = null;
onMounted(() => {
  const stage = getStageEl();
  if (stage) {
    ro = new ResizeObserver(() => nextTick(() => autoFitFont()));
    ro.observe(stage);
  }
  nextTick(() => autoFitFont());
});

onBeforeUnmount(() => {
  if (ro) {
    try {
      const stage = getStageEl();
      if (stage) ro.unobserve(stage);
    } catch {}
  }
  ro = null;
});

const boxStyle = computed(() => ({
  left: `${props.xRel * 100}%`,
  top: `${props.yRel * 100}%`,
  width: `${props.wRel * 100}%`,
  height: `${props.hRel * 100}%`,
  opacity: Math.max(0, Math.min(1, props.opacity / 100)),
  color: props.color,
  fontSize: `${props.fontSize}px`,
  fontFamily: props.font,
  fontWeight: props.bold ? "900" : "700",
  fontStyle: props.italic ? "italic" : "normal",
  textDecoration: props.underline ? "underline" : "none",
  textAlign: props.align,
}));

const isShown = computed(() => props.enabled !== false);
</script>

<template>
  <div
      v-if="isShown"
      ref="boxRef"
      class="pdf__text"
      :class="{ 'pdf__text_selected': !!selected }"
      :style="boxStyle"
      @pointerdown="onMoveDown"
      @pointermove="onMoveMove"
      @pointerup="onMoveUp"
      @pointercancel="onMoveUp"
  >
    <!-- measurer lives INSIDE root (important: single-root component!) -->
    <div ref="measurerRef" class="pdf__text-measure" aria-hidden="true" />

    <div class="pdf__text-inner">
      {{ value }}
    </div>

    <template v-if="selected">
      <div
          class="pdf__text-handle pdf__text-handle_tl"
          @pointerdown.stop.prevent="(e) => onHandleDown(e, 'tl')"
          @pointermove.stop.prevent="onHandleMove"
          @pointerup.stop.prevent="onHandleUp"
          @pointercancel.stop.prevent="onHandleUp"
      />
      <div
          class="pdf__text-handle pdf__text-handle_tr"
          @pointerdown.stop.prevent="(e) => onHandleDown(e, 'tr')"
          @pointermove.stop.prevent="onHandleMove"
          @pointerup.stop.prevent="onHandleUp"
          @pointercancel.stop.prevent="onHandleUp"
      />
      <div
          class="pdf__text-handle pdf__text-handle_bl"
          @pointerdown.stop.prevent="(e) => onHandleDown(e, 'bl')"
          @pointermove.stop.prevent="onHandleMove"
          @pointerup.stop.prevent="onHandleUp"
          @pointercancel.stop.prevent="onHandleUp"
      />
      <div
          class="pdf__text-handle pdf__text-handle_br"
          @pointerdown.stop.prevent="(e) => onHandleDown(e, 'br')"
          @pointermove.stop.prevent="onHandleMove"
          @pointerup.stop.prevent="onHandleUp"
          @pointercancel.stop.prevent="onHandleUp"
      />
    </template>
  </div>
</template>

<style scoped>
.pdf__text {
  position: absolute;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  user-select: none;
  overflow: hidden;
  cursor: default;
}

.pdf__text_selected {
  border-color: rgba(128, 90, 245, 0.42);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25), 0 0 0 2px rgba(128, 90, 245, 0.18) inset;
}

/* only selected -> move cursor */
.pdf__text_selected {
  cursor: grab;
}
.pdf__text_selected:active {
  cursor: grabbing;
}

.pdf__text-inner {
  width: 100%;
  height: 100%;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.15;
  pointer-events: none;
}

.pdf__text-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.12);
  z-index: 4;
}

.pdf__text-handle_tl {
  left: 8px;
  top: 8px;
  cursor: nwse-resize;
}
.pdf__text-handle_tr {
  right: 8px;
  top: 8px;
  cursor: nesw-resize;
}
.pdf__text-handle_bl {
  left: 8px;
  bottom: 8px;
  cursor: nesw-resize;
}
.pdf__text-handle_br {
  right: 8px;
  bottom: 8px;
  cursor: nwse-resize;
}

.pdf__text-measure {
  position: fixed;
  left: -99999px;
  top: -99999px;
  visibility: hidden;
  pointer-events: none;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.15;
}
</style>
