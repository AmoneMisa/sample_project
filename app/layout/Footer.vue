<script setup lang="ts">
const quickLinks = [
  {name: 'Pages', to: '/pages'},
  {name: 'Blog', to: '/blog'},
  {name: 'Contact', to: '/contact'},
  {name: 'How to use', to: '/how-to-use'},
  {name: 'Roadmap', to: '/roadmap'}
];

const services = [
  {name: 'Image Generator', to: '/tools/image'},
  {name: 'Video Generator', to: '/tools/video'},
  {name: 'Text Generator', to: '/tools/text'},
  {name: 'Code Generator', to: '/tools/code'},
  {name: 'Education Feedback', to: '/tools/education'}
];

</script>

<template>
  <footer class="footer py-20">
    <u-container class="grid grid-cols-4 gap-10">
      <div class="footer__column">
        <div class="footer__col-item">
          <a class="header__logo max-h-[35px]" href="/">
            <img alt="Logo" src="/images/logo.png">
          </a>
        </div>
        <div class="footer__col-item mt-6 mb-8">
          <p>It has long been known that a reader's
            attention will be diverted from</p>
        </div>
        <div class="footer__col-item">
          <newsletter/>
        </div>
      </div>
      <div class="footer__column">
        <div class="footer__col-item">
          <h4 class="footer__title">Quick Links</h4>
          <u-page-list class="footer__list">
            <li v-for="item in quickLinks"><a class="footer__link" :href="item.to">{{ item.name }}</a></li>
          </u-page-list>
        </div>
      </div>
      <div class="footer__column">
        <div class="footer__col-item">
          <h4 class="footer__title">Services</h4>
          <u-page-list class="footer__list">
            <li v-for="item in services"><a class="footer__link" :href="item.to">{{ item.name }}</a></li>
          </u-page-list>
        </div>
      </div>
      <div class="footer__column">
        <div class="footer__col-item">
          <h4 class="footer__title">Contact</h4>

          <u-page-list class="footer__list">
            <a href="#" class="footer__contact-link">
              📍 8819 Ohio St. South Gate, North America, USA
            </a>
            <a href="mailto:example@domain.com" class="footer__contact-link">
              ✉️ example@domain.com
            </a>
            <a href="tel:+13866883295" class="footer__contact-link">
              📞 +1 386-688-3295
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

.footer__title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1px;
  margin-bottom: 30px;
}

.footer__list {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 16px;
}

.footer__link {
  font-size: 16px;
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

</style>