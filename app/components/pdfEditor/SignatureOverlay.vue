<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const props = defineProps<{
  xRel: number;
  yRel: number;
  wRel: number;
  hRel: number;
  strokes: Array<Array<[number, number]>>;
  strokeWidth: number;
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

const mode = ref<"move" | "draw">("draw");

const drag = reactive({ active: false, dx: 0, dy: 0 });
const drawing = reactive({ active: false });

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
  ctx.strokeStyle = "rgba(255,255,255,0.92)";

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

  emit("update:xRel", clamp01(x / stageRect.width));
  emit("update:yRel", clamp01(y / stageRect.height));
}

function onBoxUp(e: PointerEvent) {
  drag.active = false;
  const el = e.currentTarget as HTMLElement;
  if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

function relFromCanvas(e: PointerEvent) {
  const c = canvasRef.value;
  if (!c) return { x: 0, y: 0 };

  const r = c.getBoundingClientRect();
  const x = (e.clientX - r.left) / Math.max(1, r.width);
  const y = (e.clientY - r.top) / Math.max(1, r.height);

  return { x: clamp01(x), y: clamp01(y) };
}

function onCanvasDown(e: PointerEvent) {
  if (mode.value !== "draw") return;
  const c = canvasRef.value;
  if (!c) return;

  c.setPointerCapture(e.pointerId);
  drawing.active = true;

  const p = relFromCanvas(e);
  emit("update:strokes", [...props.strokes, [[p.x, p.y]]]);

  nextTick(() => {
    redraw();
  });
}

function onCanvasMove(e: PointerEvent) {
  if (!drawing.active) return;

  const p = relFromCanvas(e);
  const strokes = props.strokes.slice();
  const last = strokes[strokes.length - 1];
  if (!last) return;

  last.push([p.x, p.y]);
  emit("update:strokes", strokes);

  nextTick(() => {
    redraw();
  });
}

function onCanvasUp(e: PointerEvent) {
  drawing.active = false;
  const c = canvasRef.value;
  if (c?.hasPointerCapture?.(e.pointerId)) c.releasePointerCapture(e.pointerId);
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  nextTick(() => {
    resizeCanvas();
  });

  if (boxRef.value) {
    ro = new ResizeObserver(() => {
      resizeCanvas();
    });
    ro.observe(boxRef.value);
  }
});

onBeforeUnmount(() => {
  if (ro && boxRef.value) ro.unobserve(boxRef.value);
  ro = null;
});

watch(
    () => props.strokes,
    () => {
      nextTick(() => {
        redraw();
      });
    },
    { deep: true },
);

watch(
    () => props.strokeWidth,
    () => {
      nextTick(() => {
        redraw();
      });
    },
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
    <div class="pdf__sig-head">
      <button type="button" class="pdf__sig-chip" :class="{ 'pdf__sig-chip_active': mode === 'draw' }" @click="mode = 'draw'">
        ✍
      </button>
      <button type="button" class="pdf__sig-chip" :class="{ 'pdf__sig-chip_active': mode === 'move' }" @click="mode = 'move'">
        ↕
      </button>
    </div>

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
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(205,153,255,0.22);
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  overflow: hidden;
}
.pdf__sig-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(14, 12, 21, 0.35);
}
.pdf__sig-canvas {
  width: 100%;
  height: calc(100% - 34px);
  display: block;
  touch-action: none;
  cursor: crosshair;
}
</style>
