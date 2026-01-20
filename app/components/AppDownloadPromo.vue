<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  headline?: string
}>()
</script>

<template>
  <div class="flex items-center card min-h-[550px] gap-10">
    <div class="flex flex-col justify-between max-w-1/2 card__left-side">
      <page-header :title="title" :description="description" :headline="headline"
                   class="flex flex-col gap-5 items-start text-left"
                   :ui="{
          title: 'sm:text-5xl',
          headline: 'my-0'
        }"/>

      <div class="flex gap-4">
        <a href="https://googleplaymarket.com" class="card__download-button transition-transform">
          <img src="/images/play-app.png" alt="play market link"/>
        </a>
        <a href="https://appstore.com" class="card__download-button transition-transform scale-105">
          <img src="/images/apple-app.png" alt="appstore link"/>
        </a>
      </div>
    </div>
    <div class="flex justify-center gap-6 -z-1 left-0 right-0 absolute card__center pointer-events-none">
      <img
          alt="background shape"
          src="/images/bg-shape.png"
          class="max-h-[500px] min-h-[450px] rounded-xl"
      />
    </div>
    <div class="flex justify-center gap-6 card__right-side">
      <img
          alt="mobile view"
          src="/images/view-img.png"
          class="max-h-[500px] min-h-[450px] rounded-xl"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  max-height: 550px;
  background-image: url("/images/bg-img-01.png");
  background-repeat: no-repeat;
  display: flex;
  justify-content: space-between;
  position: relative;
}

.card__left-side {
  padding: 95px 0 95px 50px;
  height: -webkit-fill-available;
}

.card__right-side {
  margin-top: -58px;
}

.card__download-button {
  transition: transform .3s;
  cursor: pointer;
  width: 157px;
  height: 55px;

  &:hover {
    transform: scale(1.05);
  }
}

.card__center {
  z-index: auto;
  top: 15%;
}
</style>