<script setup lang="ts">
defineProps({
  images: {
    type: Array,
    required: true
  }
});
</script>

<template>
  <div class="carousel">
    <div class="carousel__track">
      <div
          v-for="(img, i) in [...images, ...images]"
          :key="i"
          class="carousel__slide"
      >
        <img :src="img" :alt="img" class="carousel__item" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.carousel {
  position: relative;
  overflow: hidden;
  width: 100%;

  &:before,
  &:after {
    content: "";
    position: absolute;
    top: 0;
    height: 100%;
    width: 200px;
    z-index: 2;
  }

  &:before {
    left: 0;
    background: linear-gradient(90deg, #0E0C15 0.09%, rgba(14, 12, 21, 0) 58.8%);
  }

  &:after {
    right: 0;
    background: linear-gradient(270deg, #0E0C15 0%, rgba(14, 12, 21, 0) 45.61%);
  }
}

.light {
  .carousel {
    background-color: var(--color-primary);
    &:before {
      background: linear-gradient( 90deg, #ffffff 0%, rgba(255, 255, 255, 0) 100% );
    }

    &:after {
      background: linear-gradient( 270deg, #ffffff 0%, rgba(255, 255, 255, 0) 100% );
    }
  }
}

.carousel__track {
  display: flex;
  gap: 48px;
  width: max-content;
  animation: scroll 25s linear infinite;
}

.carousel__slide {
  flex: 0 0 auto;
}

.carousel__slide {
  width: 252px;
}

.carousel__item {
  opacity: 0.6;
  transition: opacity 0.3s ease;
  max-height: 34px;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
}

@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
