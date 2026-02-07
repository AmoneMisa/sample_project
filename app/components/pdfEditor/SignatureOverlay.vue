<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

type Stroke = Array<[number, number]>;
type Strokes = Array<Stroke>;

const props = defineProps<{
  xRel: number;
  yRel: number;
  wRel: number;
  hRel: number;
  strokes: Strokes;
  strokeWidth: number;
  opacity?: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:xRel", v: number): void;
  (e: "update:yRel", v: number): void;
  (e: "update:wRel", v: number): void;
  (e: "update:hRel", v: number): void;
  (e: "update:strokes", v: Strokes): void;
}>();

const boxRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const mode = ref<"move" | "draw" | "erase">("draw");

const drag = reactive({ active: false, dx: 0, dy: 0, pointerId: -1 });
const drawing = reactive({ active: false, pointerId: -1 });

const eraser = reactive({
  // radius in REL coords (0..1 of overlay box)
  radius: 0.06,
});

const MIN_W = 0.08;
const MIN_H = 0.06;

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

const undoStack = ref<Strokes[]>([]);
const redoStack = ref<Strokes[]>([]);

function cloneStrokes(s: Strokes): Strokes {
  return s.map((st) => st.map((p) => [p[0], p[1]] as [number, number]));
}

function pushUndo() {
  undoStack.value.push(cloneStrokes(props.strokes));
  if (undoStack.value.length > 60) undoStack.value.shift();
  redoStack.value = [];
}

function doUndo() {
  if (!undoStack.value.length) return;
  redoStack.value.push(cloneStrokes(props.strokes));
  const prev = undoStack.value.pop()!;
  emit("update:strokes", prev);
  nextTick(() => redraw());
}

function doRedo() {
  if (!redoStack.value.length) return;
  undoStack.value.push(cloneStrokes(props.strokes));
  const next = redoStack.value.pop()!;
  emit("update:strokes", next);
  nextTick(() => redraw());
}

const style = computed(() => ({
  left: `${props.xRel * 100}%`,
  top: `${props.yRel * 100}%`,
  width: `${props.wRel * 100}%`,
  height: `${props.hRel * 100}%`,
}));

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function getStageRect() {
  const stage = boxRef.value?.closest(".pdf__stage") as HTMLElement | null;
  if (!stage) return null;
  return stage.getBoundingClientRect();
}

// clamp so that WHOLE box stays inside stage
function clampRelXY(xRel: number, yRel: number) {
  const maxX = Math.max(0, 1 - props.wRel);
  const maxY = Math.max(0, 1 - props.hRel);
  return {
    xRel: Math.max(0, Math.min(maxX, xRel)),
    yRel: Math.max(0, Math.min(maxY, yRel)),
  };
}

function resizeCanvas() {
  const c = canvasRef.value;
  const el = boxRef.value;
  if (!c || !el) return;

  // height minus header area – canvas element already is sized via CSS calc,
  // but we set actual pixel buffer based on its real rect.
  const r = c.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  c.width = Math.max(1, Math.floor(r.width * dpr));
  c.height = Math.max(1, Math.floor(r.height * dpr));
  c.style.width = `${r.width}px`;
  c.style.height = `${r.height}px`;

  redraw();
}

function redraw() {
  const c = canvasRef.value;
  if (!c) return;

  const ctx = c.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = c.width / dpr;
  const h = c.height / dpr;

  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = props.strokeWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const alpha = Math.max(0, Math.min(1, (props.opacity ?? 100) / 100));
  ctx.strokeStyle = `rgba(255,255,255,${0.92 * alpha})`;

  for (const stroke of props.strokes) {
    if (!stroke || stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0] * w, stroke[0][1] * h);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i][0] * w, stroke[i][1] * h);
    }
    ctx.stroke();
  }
}

function relFromCanvas(e: PointerEvent) {
  const c = canvasRef.value;
  if (!c) return { x: 0, y: 0 };

  const r = c.getBoundingClientRect();
  const x = (e.clientX - r.left) / Math.max(1, r.width);
  const y = (e.clientY - r.top) / Math.max(1, r.height);

  return { x: clamp01(x), y: clamp01(y) };
}

// ---- MOVE BOX ----
function onBoxDown(e: PointerEvent) {
  if (props.disabled) return;
  if (mode.value !== "move") return;

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

function onBoxMove(e: PointerEvent) {
  if (!drag.active) return;
  if (drag.pointerId !== e.pointerId) return;

  const stageRect = getStageRect();
  if (!stageRect) return;

  const x = e.clientX - stageRect.left - drag.dx;
  const y = e.clientY - stageRect.top - drag.dy;

  const nx = x / stageRect.width;
  const ny = y / stageRect.height;

  const clamped = clampRelXY(nx, ny);
  emit("update:xRel", clamped.xRel);
  emit("update:yRel", clamped.yRel);
}

function onBoxUp(e: PointerEvent) {
  if (drag.pointerId !== e.pointerId) return;
  drag.active = false;
  drag.pointerId = -1;

  const el = e.currentTarget as HTMLElement;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

// ---- RESIZE ----
function onHandleDown(e: PointerEvent, corner: "br" | "tr" | "bl" | "tl") {
  if (props.disabled) return;

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

  wRel = Math.max(MIN_W, wRel);
  hRel = Math.max(MIN_H, hRel);

  // keep inside stage
  xRel = clamp01(xRel);
  yRel = clamp01(yRel);

  const maxW = 1 - xRel;
  const maxH = 1 - yRel;
  wRel = Math.min(wRel, maxW);
  hRel = Math.min(hRel, maxH);

  // Now also clamp pos so that box doesn't jump out when using left/top corners
  const maxX = Math.max(0, 1 - wRel);
  const maxY = Math.max(0, 1 - hRel);
  xRel = Math.max(0, Math.min(maxX, xRel));
  yRel = Math.max(0, Math.min(maxY, yRel));

  emit("update:xRel", xRel);
  emit("update:yRel", yRel);
  emit("update:wRel", wRel);
  emit("update:hRel", hRel);

  nextTick(() => resizeCanvas());
}

function onHandleUp(e: PointerEvent) {
  if (resizing.pointerId !== e.pointerId) return;

  resizing.active = false;
  resizing.pointerId = -1;
  resizing.corner = "";

  const el = e.currentTarget as HTMLElement;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

// ---- DRAW / ERASE ----
function eraseAt(x: number, y: number) {
  const rad = eraser.radius;
  const rad2 = rad * rad;

  const next: Strokes = [];
  for (const stroke of props.strokes) {
    const filtered = stroke.filter(([px, py]) => {
      const dx = px - x;
      const dy = py - y;
      return dx * dx + dy * dy > rad2;
    });
    if (filtered.length >= 2) next.push(filtered);
  }
  emit("update:strokes", next);
}

function onCanvasDown(e: PointerEvent) {
  if (props.disabled) return;
  if (mode.value !== "draw" && mode.value !== "erase") return;

  const c = canvasRef.value;
  if (!c) return;

  pushUndo();

  c.setPointerCapture(e.pointerId);
  drawing.active = true;
  drawing.pointerId = e.pointerId;

  const p = relFromCanvas(e);

  if (mode.value === "draw") {
    emit("update:strokes", [...props.strokes, [[p.x, p.y]]]);
  } else {
    eraseAt(p.x, p.y);
  }

  nextTick(() => redraw());
}

function onCanvasMove(e: PointerEvent) {
  if (!drawing.active) return;
  if (drawing.pointerId !== e.pointerId) return;

  const p = relFromCanvas(e);

  if (mode.value === "erase") {
    eraseAt(p.x, p.y);
    nextTick(() => redraw());
    return;
  }

  const strokes = props.strokes.slice();
  const last = strokes[strokes.length - 1];
  if (!last) return;

  last.push([p.x, p.y]);
  emit("update:strokes", strokes);

  nextTick(() => redraw());
}

function onCanvasUp(e: PointerEvent) {
  if (drawing.pointerId !== e.pointerId) return;

  drawing.active = false;
  drawing.pointerId = -1;

  const c = canvasRef.value;
  if (c?.hasPointerCapture?.(e.pointerId)) c.releasePointerCapture(e.pointerId);
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => resizeCanvas());

  if (canvasRef.value) {
    ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(canvasRef.value);
  }
});

onBeforeUnmount(() => {
  if (ro && canvasRef.value) ro.unobserve(canvasRef.value);
  ro = null;
});

watch(
    () => props.strokes,
    () => nextTick(() => redraw()),
    { deep: true },
);

watch(
    () => [props.strokeWidth, props.opacity],
    () => nextTick(() => redraw()),
);
</script>

<template>
  <div
      ref="boxRef"
      class="pdf__sig"
      :style="style"
      @pointerdown="onBoxDown"
      @pointermove="onBoxMove"
      @pointerup="onBoxUp"
      @pointercancel="onBoxUp"
  >
    <div class="pdf__sig-head" @pointerdown.stop.prevent>
      <button
          type="button"
          class="pdf__sig-chip"
          :class="{ 'pdf__sig-chip_active': mode === 'draw' }"
          :disabled="disabled"
          title="Рисовать"
          aria-label="Рисовать"
          @click="mode = 'draw'"
      >
        <u-icon name="i-lucide-signature" />
      </button>

      <button
          type="button"
          class="pdf__sig-chip"
          :class="{ 'pdf__sig-chip_active': mode === 'erase' }"
          :disabled="disabled"
          title="Ластик"
          aria-label="Ластик"
          @click="mode = 'erase'"
      >
        <u-icon name="i-lucide-eraser" />
      </button>

      <button
          type="button"
          class="pdf__sig-chip"
          :class="{ 'pdf__sig-chip_active': mode === 'move' }"
          :disabled="disabled"
          title="Перемещать"
          aria-label="Перемещать"
          @click="mode = 'move'"
      >
        <u-icon name="i-lucide-move-vertical" />
      </button>

      <div class="pdf__sig-spacer" />

      <button
          type="button"
          class="pdf__sig-chip"
          :disabled="disabled || !undoStack.length"
          title="Undo"
          aria-label="Undo"
          @click="doUndo"
      >
        <u-icon name="i-lucide-undo-2" />
      </button>

      <button
          type="button"
          class="pdf__sig-chip"
          :disabled="disabled || !redoStack.length"
          title="Redo"
          aria-label="Redo"
          @click="doRedo"
      >
        <u-icon name="i-lucide-redo-2" />
      </button>
    </div>

    <canvas
        ref="canvasRef"
        class="pdf__sig-canvas"
        :class="mode === 'draw' ? 'pdf__sig-canvas_draw' : mode === 'erase' ? 'pdf__sig-canvas_erase' : 'pdf__sig-canvas_move'"
        @pointerdown="onCanvasDown"
        @pointermove="onCanvasMove"
        @pointerup="onCanvasUp"
        @pointercancel="onCanvasUp"
    />

    <!-- resize handles -->
    <div
        class="pdf__sig-handle pdf__sig-handle_tl"
        @pointerdown.stop.prevent="(e) => onHandleDown(e, 'tl')"
        @pointermove.stop.prevent="onHandleMove"
        @pointerup.stop.prevent="onHandleUp"
        @pointercancel.stop.prevent="onHandleUp"
    />
    <div
        class="pdf__sig-handle pdf__sig-handle_tr"
        @pointerdown.stop.prevent="(e) => onHandleDown(e, 'tr')"
        @pointermove.stop.prevent="onHandleMove"
        @pointerup.stop.prevent="onHandleUp"
        @pointercancel.stop.prevent="onHandleUp"
    />
    <div
        class="pdf__sig-handle pdf__sig-handle_bl"
        @pointerdown.stop.prevent="(e) => onHandleDown(e, 'bl')"
        @pointermove.stop.prevent="onHandleMove"
        @pointerup.stop.prevent="onHandleUp"
        @pointercancel.stop.prevent="onHandleUp"
    />
    <div
        class="pdf__sig-handle pdf__sig-handle_br"
        @pointerdown.stop.prevent="(e) => onHandleDown(e, 'br')"
        @pointermove.stop.prevent="onHandleMove"
        @pointerup.stop.prevent="onHandleUp"
        @pointercancel.stop.prevent="onHandleUp"
    />
  </div>
</template>

<style scoped>
.pdf__sig {
  position: absolute;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(205, 153, 255, 0.22);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  user-select: none;
}

.pdf__sig-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(14, 12, 21, 0.35);
}

.pdf__sig-spacer {
  flex: 1;
}

.pdf__sig-chip {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(14, 12, 21, 0.55);
  color: rgba(255, 255, 255, 0.9);
  display: grid;
  place-items: center;
  transition: filter 160ms ease, transform 140ms ease;
}
.pdf__sig-chip:hover {
  filter: brightness(1.08);
}
.pdf__sig-chip:active {
  transform: translateY(1px);
}
.pdf__sig-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.pdf__sig-chip_active {
  border-color: rgba(128, 90, 245, 0.35);
  background: rgba(128, 90, 245, 0.18);
}

.pdf__sig-canvas {
  width: 100%;
  height: calc(100% - 51px);
  display: block;
  touch-action: none;
}

.pdf__sig-canvas_draw {
  cursor: crosshair;
}
.pdf__sig-canvas_erase {
  cursor: cell;
}
.pdf__sig-canvas_move {
  cursor: grab;
}

.pdf__sig-handle {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.12);
  z-index: 4;
}
.pdf__sig-handle_tl {
  left: 8px;
  top: 59px;
  cursor: nwse-resize;
}
.pdf__sig-handle_tr {
  right: 8px;
  top: 59px;
  cursor: nesw-resize;
}
.pdf__sig-handle_bl {
  left: 8px;
  bottom: 8px;
  cursor: nesw-resize;
}
.pdf__sig-handle_br {
  right: 8px;
  bottom: 8px;
  cursor: nwse-resize;
}
</style>
