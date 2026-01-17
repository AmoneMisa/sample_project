<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  textsList: {
    type: Array as PropType<string[]>,
    required: true
  }
});

const currentIndex = ref(0);
let timer: number | undefined;

onMounted(() => {
  if (props.textsList.length <= 1) return
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.textsList.length
  }, 3000);
})

onUnmounted(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<template>
  <span class="animated-rotated-text">
    <Transition name="flip" mode="out-in">
      <span remind class="inner" :key="currentIndex">
        {{ props.textsList[currentIndex] }}
      </span>
    </Transition>
  </span>
</template>

<style scoped lang="scss">
.animated-rotated-text {
  display: inline-block;
  perspective: 400px;
}

.inner {
  display: inline-block;
  background-image: linear-gradient(to right, #805AF5, #CD99FF);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: center;
  backface-visibility: hidden;
}

.flip {
  transform: rotateX(90deg);
  opacity: 0;
}

.flip-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.flip-enter-from {
  transform: rotateX(-90deg);
  opacity: 0;
}

.flip-enter-to {
  transform: rotateX(0deg);
  opacity: 1;
}

.flip-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.flip-leave-from {
  transform: rotateX(0deg);
  opacity: 1;
}

.flip-leave-to {
  transform: rotateX(90deg);
  opacity: 0;
}
</style>
