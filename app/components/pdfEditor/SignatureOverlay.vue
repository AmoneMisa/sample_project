<script setup lang="ts">
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from "vue";

type Strokes = Array<Array<[number, number]>>;
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

function onHandleDown(e: PointerEvent, corner: "br" | "tr" | "bl" | "tl") {
  if (props.disabled) return;
  const stageRect = getStageRect();
  if (!stageRect) return;

  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

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

  // corners:
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
  const maxW = 1 - xRel;
  const maxH = 1 - yRel;
  wRel = Math.min(wRel, maxW);
  hRel = Math.min(hRel, maxH);

  const clampedPos = clampRelXY(xRel, yRel);

  emit("update:xRel", clampedPos.xRel);
  emit("update:yRel", clampedPos.yRel);
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

const undoStack = ref<Strokes[]>([]);
const redoStack = ref<Strokes[]>([]);
const mode = ref<"move" | "draw" | "erase">("draw");
const eraser = reactive({radius: 0.06}); // в долях (0..1) от меньшей стороны

function cloneStrokes(s: Strokes): Strokes {
  return s.map(st => st.map(p => [p[0], p[1]] as [number, number]));
}

function eraseAt(x: number, y: number) {
  const rad = eraser.radius;
  const rad2 = rad * rad;

  const next: Strokes = [];
  for (const stroke of props.strokes) {
    const filtered = stroke.filter(([px, py]) => {
      const dx = px - x;
      const dy = py - y;
      return (dx * dx + dy * dy) > rad2;
    });
    if (filtered.length >= 2) next.push(filtered);
  }
  emit("update:strokes", next);
}

function pushUndo() {
  undoStack.value.push(cloneStrokes(props.strokes));
  if (undoStack.value.length > 50) undoStack.value.shift(); // лимит истории
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

function clampRelXY(xRel: number, yRel: number) {
  const x = clamp01(xRel);
  const y = clamp01(yRel);

  const maxX = Math.max(0, 1 - props.wRel);
  const maxY = Math.max(0, 1 - props.hRel);

  return {
    xRel: Math.max(0, Math.min(maxX, x)),
    yRel: Math.max(0, Math.min(maxY, y)),
  };
}

const props = defineProps<{
  xRel: number;
  yRel: number;
  wRel: number;
  hRel: number;
  strokes: Array<Array<[number, number]>>;
  strokeWidth: number;
  opacity?: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:xRel", v: number): void;
  (e: "update:yRel", v: number): void;
  (e: "update:wRel", v: number): void;
  (e: "update:hRel", v: number): void;
  (e: "update:strokes", v: Array<Array<[number, number]>>): void;
}>();

const boxRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const drag = reactive({active: false, dx: 0, dy: 0});
const drawing = reactive({active: false});

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

function resizeCanvas() {
  const c = canvasRef.value;
  const el = boxRef.value;
  if (!c || !el) return;

  const r = el.getBoundingClientRect();
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

function onBoxDown(e: PointerEvent) {
  if (props.disabled) return;
  if (mode.value !== "move") return;

  const stageRect = getStageRect();
  if (!stageRect) return;

  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  drag.active = true;

  const xPx = props.xRel * stageRect.width;
  const yPx = props.yRel * stageRect.height;
  drag.dx = e.clientX - (stageRect.left + xPx);
  drag.dy = e.clientY - (stageRect.top + yPx);
}

function onBoxMove(e: PointerEvent) {
  if (!drag.active) return;

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
  drag.active = false;
  const el = e.currentTarget as HTMLElement;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

function relFromCanvas(e: PointerEvent) {
  const c = canvasRef.value;
  if (!c) return {x: 0, y: 0};

  const r = c.getBoundingClientRect();
  const x = (e.clientX - r.left) / Math.max(1, r.width);
  const y = (e.clientY - r.top) / Math.max(1, r.height);

  return {x: clamp01(x), y: clamp01(y)};
}

function onCanvasDown(e: PointerEvent) {
  if (props.disabled) return;
  if (mode.value !== "draw") return;

  const c = canvasRef.value;
  if (!c) return;
  pushUndo();
  c.setPointerCapture(e.pointerId);
  drawing.active = true;

  const p = relFromCanvas(e);
  emit("update:strokes", [...props.strokes, [[p.x, p.y]]]);

  nextTick(() => redraw());
}

function onCanvasMove(e: PointerEvent) {
  if (!drawing.active) return;

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
  drawing.active = false;
  const c = canvasRef.value;
  if (c?.hasPointerCapture?.(e.pointerId)) c.releasePointerCapture(e.pointerId);
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => resizeCanvas());

  if (boxRef.value) {
    ro = new ResizeObserver(() => resizeCanvas());
    ro.observe(boxRef.value);
  }
});

onBeforeUnmount(() => {
  if (ro && boxRef.value) ro.unobserve(boxRef.value);
  ro = null;
});

watch(
    () => props.strokes,
    () => nextTick(() => redraw()),
    {deep: true},
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
          @click="mode = 'draw';"
      >
        <u-icon name="i-lucide-signature"/>
      </button>

      <button
          type="button"
          class="pdf__sig-chip"
          :class="{ 'pdf__sig-chip_active': mode === 'move' }"
          :disabled="disabled"
          title="Перемещать"
          aria-label="Перемещать"
          @click="mode = 'move';"
      >
        <u-icon name="i-lucide-move-vertical"/>
      </button>
    </div>
    <div
        class="pdf__sig-handle pdf__sig-handle_br"
        @pointerdown.stop.prevent="(e) => onHandleDown(e, 'br')"
        @pointermove.stop.prevent="onHandleMove"
        @pointerup.stop.prevent="onHandleUp"
        @pointercancel.stop.prevent="onHandleUp"
    />

    <canvas
        ref="canvasRef"
        class="pdf__sig-canvas"
        :class="mode === 'draw' ? 'pdf__sig-canvas_draw' : 'pdf__sig-canvas_move'"
        @pointerdown="onCanvasDown"
        @pointermove="onCanvasMove"
        @pointerup="onCanvasUp"
        @pointercancel="onCanvasUp"
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
}

.pdf__sig-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(14, 12, 21, 0.35);
}

.pdf__sig-canvas {
  width: 100%;
  height: calc(100% - 34px);
  display: block;
  touch-action: none;
  cursor: crosshair;
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

.pdf__sig-handle_br {
  right: 8px;
  bottom: 8px;
  cursor: nwse-resize;
}

</style>
