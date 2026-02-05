<script setup lang="ts">
const quickLinks = [
  {name: 'footer.quickLinks.pages', to: '/pages'},
  {name: 'footer.quickLinks.blog', to: '/blog'},
  {name: 'footer.quickLinks.contact', to: '/contact'},
  {name: 'footer.quickLinks.howToUse', to: '/how-to-use'},
  {name: 'footer.quickLinks.roadmap', to: '/roadmap'}
];

const services = [
  {name: 'footer.services.imageGenerator', to: '/tools/image'},
  {name: 'footer.services.videoGenerator', to: '/tools/video'},
  {name: 'footer.services.textGenerator', to: '/tools/text'},
  {name: 'footer.services.codeGenerator', to: '/tools/code'},
  {name: 'footer.services.educationFeedback', to: '/tools/education'}
];

const {t} = useI18n();
</script>

<template>
  <footer class="footer flex p-12 px-4 sm:px-6 lg:px-8">
    <u-container class="w-full max-w-[var(--ui-container)] mx-auto px-4 sm:px-6 lg:px-8
            flex flex-wrap gap-5 justify-center">
      <div class="footer__column">
        <div class="footer__col-item">
          <a class="footer__logo max-h-[35px] min-w-[160px]" href="/">
            <img class="footer__logo-image" alt="Logo" src="/images/logo.png"/>
          </a>
        </div>

        <div class="footer__col-item mt-6 mb-8">
          <p>{{ t('footer.about') }}</p>
        </div>

        <div class="footer__col-item">
          <newsletter/>
        </div>
      </div>

      <div class="footer__column">
        <div class="footer__col-item">
          <h4 class="footer__title">{{ t('footer.quickLinksTitle') }}</h4>

          <u-page-list class="footer__list">
            <li v-for="item in quickLinks" :key="item.to">
              <a class="footer__link" :href="item.to">{{ t(item.name) }}</a>
            </li>
          </u-page-list>
        </div>
      </div>

      <div class="footer__column">
        <div class="footer__col-item">
          <h4 class="footer__title">{{ t('footer.servicesTitle') }}</h4>

          <u-page-list class="footer__list">
            <li v-for="item in services" :key="item.to">
              <a class="footer__link" :href="item.to">{{ t(item.name) }}</a>
            </li>
          </u-page-list>
        </div>
      </div>

      <div class="footer__column">
        <div class="footer__col-item">
          <h4 class="footer__title">{{ t('footer.contactTitle') }}</h4>

          <u-page-list class="footer__list footer__contact">
            <a href="#" class="footer__contact-link">
              {{ t('footer.contact.address') }}
            </a>

            <a href="mailto:example@domain.com" class="footer__contact-link">
              example@domain.com
            </a>

            <a href="tel:+13866883295" class="footer__contact-link">
              {{ t('footer.contact.phone') }}
            </a>
          </u-page-list>
        </div>
      </div>
    </u-container>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  background-color: var(--color-blackest);
}

.footer__column {
  flex: 100%;

  @media (min-width: 768px) {
    flex: calc(50% - 20px);
  }

  @media (min-width: 1024px) {
    flex: calc(33.3333% - 20px);
  }

  @media (min-width: 1280px) {
    flex: calc(25% - 20px);
  }
}

.footer__title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.footer__list {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
}

.footer__link {
  display: inline-block;
  color: var(--color-link);
  line-height: 25px;
  transition: 0.3s;
  position: relative;

  &:after {
    position: absolute;
    content: "";
    left: auto;
    bottom: 0;
    background: currentColor;
    width: 0;
    height: 2px;
    transition: 0.3s;
    right: 0;
  }

  &:hover {
    color: var(--color-primary);

    &:after {
      width: 100%;
      left: 0;
      right: auto;
    }
  }
}

.footer__title {
  margin-bottom: 16px;
}

.footer__contact {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &-link {
    color: var(--color-gray-300);
    transition: color .2s ease;

    &:hover {
      color: var(--color-primary);
    }
  }
}

.footer__logo-image {
  filter: drop-shadow(0px 0px 12px var(--color-primary));
}

.light {
  .footer__logo-image {
    filter: drop-shadow(1px 1px 2px #5121f5);
  }
}
</style>