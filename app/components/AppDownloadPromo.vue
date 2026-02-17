<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";

defineProps<{
  title?: string
  description?: string
  headline?: string
}>();
</script>

<template>
  <section class="download-wrap relative overflow-hidden">
    <div class="download-inner relative z-[1]">
      <div class="grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center">
        <div class="px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <page-header
              :title="title"
              :description="description"
              :headline="headline"
              class="flex flex-col gap-5 items-start text-left"
              :ui="{
              title: 'text-4xl sm:text-5xl lg:text-6xl dark:text-highlighted text-white/90',
              headline: 'my-0',
              description: 'text-base sm:text-lg dark:text-white/70'
            }"
          />
          <div class="mt-7 flex flex-wrap gap-4">
<!--            <a-->
<!--                href="https://googleplaymarket.com"-->
<!--                class="store-btn"-->
<!--            >-->
<!--              <img src="/images/play-app.png" alt="Google Play"/>-->
<!--            </a>-->
            <a
                href="/files/RusticPriceConvertor_v1.0_WhitesLove.apk"
                download="RusticPriceConvertor_v1.0_WhitesLove.apk"
                class="store-btn"
            >
              <nuxt-img
                  src="/images/download.png"
                  alt="Download"
                  format="webp"
                  :quality="80"
                  height="55"
                  fit="cover"
                  :widths="[157, 314]"
              />
            </a>
          </div>
        </div>
        <div class="relative hidden md:flex justify-center lg:justify-end px-6 pb-10 lg:pb-0">
          <nuxt-img
              class="app-image w-full max-h-[520px] drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
              src="/images/mobile-app.png"
              alt="Mobile App"
              format="webp"
              :quality="100"
              sizes="(max-width: 400px) 280px, 320px"
              :widths="[280, 320, 560, 640]"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.download-wrap {
  border-radius: 28px;
  padding: 2px;
  background: linear-gradient(
          135deg,
          rgba(128, 90, 245, 0.85),
          rgba(255, 255, 255, 0.06),
          rgba(205, 153, 255, 0.55)
  );
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.55);
  clip-path: polygon(
          0 0,
          calc(100% - 210px) 0,
          calc(100% - 120px) 110px,
          100% 110px,
          100% 100%,
          0 100%
  );
}

.download-inner {
  border-radius: 26px;
  overflow: hidden;
  background: rgba(14, 12, 21, 0.94);
  position: relative;
  clip-path: polygon(
          0 0,
          calc(100% - 210px) 0,
          calc(100% - 120px) 110px,
          100% 110px,
          100% 100%,
          0 100%
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
  inset 0 -26px 50px rgba(0, 0, 0, 0.55);
}

.download-inner::before {
  content: "";
  position: absolute;
  inset: -40% -10%;
  pointer-events: none;
  opacity: 0.55;
  z-index: 0;
  background: repeating-linear-gradient(
          115deg,
          rgba(128, 90, 245, 0.0) 0px,
          rgba(128, 90, 245, 0.0) 22px,
          rgba(128, 90, 245, 0.18) 23px,
          rgba(128, 90, 245, 0.18) 24px
  );
  filter: blur(0.2px);
}

.download-inner::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(800px 380px at 18% 35%, rgba(128, 90, 245, 0.18), transparent 60%),
  radial-gradient(800px 380px at 85% 15%, rgba(205, 153, 255, 0.10), transparent 60%);
  opacity: 0.8;
}

.store-btn {
  display: inline-flex;
  width: 200px;
  height: 55px;
  transition: transform .25s ease, filter .25s ease;
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .35));
}

.store-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.store-btn:hover {
  transform: translateY(-1px) scale(1.03);
  filter: drop-shadow(0 16px 22px rgba(0, 0, 0, .45));
}

@media (max-width: 1024px) {
  .download-wrap,
  .download-inner {
    clip-path: polygon(
            0 0,
            calc(100% - 160px) 0,
            calc(100% - 90px) 82px,
            100% 82px,
            100% 100%,
            0 100%
    );
  }
}

@media (max-width: 768px) {
  .download-wrap,
  .download-inner {
    clip-path: none;
  }
}

@media (max-width: 640px) {
  .download-wrap {
    border-radius: 22px;
  }
  .download-inner {
    border-radius: 20px;
  }
}

.app-image {
  max-width: 320px !important;
}
</style>
