<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  textsList: {
    type: Array as PropType<string[]>,
    required: true
  }
});

const currentIndex = ref(0);
const displayedText = ref(props.textsList[0] ?? '');
const isFlipping = ref(false);

let timer: ReturnType<typeof setInterval> | undefined;
let midTimeout: ReturnType<typeof setTimeout> | undefined;
let endTimeout: ReturnType<typeof setTimeout> | undefined;

const DURATION_MS = 600;
const MID_MS = 300;
const INTERVAL_MS = 3000;

function clearAll() {
  if (!import.meta.client) return;
  if (timer) clearInterval(timer);
  if (midTimeout) clearTimeout(midTimeout);
  if (endTimeout) clearTimeout(endTimeout);
  timer = undefined;
  midTimeout = undefined;
  endTimeout = undefined;
}

function flipNext() {
  if (!import.meta.client) return;
  if (props.textsList.length <= 1) return;

  const nextIndex = (currentIndex.value + 1) % props.textsList.length;

  isFlipping.value = false
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isFlipping.value = true
    });
  });

  midTimeout = setTimeout(() => {
    currentIndex.value = nextIndex;
    displayedText.value = props.textsList[nextIndex] ?? '';
  }, MID_MS);

  endTimeout = setTimeout(() => {
    isFlipping.value = false;
  }, DURATION_MS);
}

function startTimer() {
  if (!import.meta.client) return;
  clearAll();
  if (props.textsList.length <= 1) return;
  timer = setInterval(flipNext, INTERVAL_MS);
}

watch(
    () => props.textsList,
    (list) => {
      currentIndex.value = 0;
      displayedText.value = list?.[0] ?? '';
      isFlipping.value = false;

      if (import.meta.client) startTimer();
    },
    { deep: true }
)

onMounted(() => {
  displayedText.value = props.textsList[0] ?? '';
  startTimer();
})

onUnmounted(clearAll);
</script>

<template>
  <span class="animated-rotated-text">
    <span
        class="animated-rotated-text__inner gradient-text"
        :class="{ 'flip-anim': isFlipping }"
    >
      {{ displayedText }}
    </span>
  </span>
</template>

<style scoped lang="scss">
.animated-rotated-text {
  display: inline-block;
  perspective: 400px;
  line-height: initial;
  width: 350px;
}

.animated-rotated-text__inner {
  display: inline-block;
  transform-origin: center;
  backface-visibility: hidden;
  will-change: transform, opacity;
}

.flip-anim {
  animation: flipCalendar 0.6s ease both;
}

@keyframes flipCalendar {
  0%   { transform: rotateX(0deg);   opacity: 1; }
  49%  { transform: rotateX(90deg);  opacity: 0; }
  50%  { transform: rotateX(-90deg); opacity: 0; }
  100% { transform: rotateX(0deg);   opacity: 1; }
}
</style>
