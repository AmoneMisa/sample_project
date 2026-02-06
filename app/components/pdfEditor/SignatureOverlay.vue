<script setup lang="ts">
const props = defineProps<{
  xRel: number
  yRel: number
  wRel: number
  hRel: number
  strokes: Array<Array<[number, number]>>
}>();

const emit = defineEmits<{
  (e: "update:xRel", v: number): void
  (e: "update:yRel", v: number): void
  (e: "update:wRel", v: number): void
  (e: "update:hRel", v: number): void
  (e: "update:strokes", v: Array<Array<[number, number]>>): void
}>();

const boxRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const drawing = ref(false);
let currentStroke: Array<[number, number]> = [];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function resizeCanvas() {
  const box = boxRef.value;
  const canvas = canvasRef.value;
  if (!box || !canvas) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const rect = box.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  redraw();
}

function redraw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // default white
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2;

  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  for (const stroke of props.strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0] * w, stroke[0][1] * h);
    for (const pt of stroke.slice(1)) {
      ctx.lineTo(pt[0] * w, pt[1] * h);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.stroke();
  }
}

function getRelPoint(e: PointerEvent): [number, number] {
  const box = boxRef.value!;
  const rect = box.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return [clamp01(x), clamp01(y)];
}

function onDown(e: PointerEvent) {
  e.preventDefault();
  drawing.value = true;
  currentStroke = [];
  const pt = getRelPoint(e);
  currentStroke.push(pt);
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId);
}

function onMove(e: PointerEvent) {
  if (!drawing.value) return;
  const pt = getRelPoint(e);
  currentStroke.push(pt);

  // live draw (optimistically)
  emit("update:strokes", [...props.strokes, currentStroke]);
}

function onUp() {
  if (!drawing.value) return;
  drawing.value = false;
  if (currentStroke.length >= 2) {
    emit("update:strokes", [...props.strokes, currentStroke]);
  } else {
    emit("update:strokes", props.strokes);
  }
  currentStroke = [];
}

onMounted(() => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeCanvas);
});

watch(
    () => props.strokes,
    () => redraw(),
    { deep: true }
);
</script>

<template>
  <div
      ref="boxRef"
      class="sig"
      :style="{
      left: `${xRel * 100}%`,
      top: `${yRel * 100}%`,
      width: `${wRel * 100}%`,
      height: `${hRel * 100}%`
    }"
  >
    <div class="sig__head">
      <span class="sig__label">Signature</span>
    </div>

    <canvas
        ref="canvasRef"
        class="sig__canvas"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @pointerleave="onUp"
    />
  </div>
</template>

<style scoped>
.sig {
  position: absolute;
  border-radius: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(205,153,255,0.22);
  box-shadow: 0 12px 30px rgba(0,0,0,0.25);
  overflow: hidden;
}
.sig__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(14, 12, 21, 0.35);
}
.sig__label {
  font-weight: 900;
  font-size: 12px;
  color: rgba(255,255,255,0.82);
}
.sig__canvas {
  width: 100%;
  height: calc(100% - 34px);
  display: block;
  touch-action: none;
  cursor: crosshair;
}
</style>
