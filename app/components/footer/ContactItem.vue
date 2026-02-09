<script setup>
const {t} = useI18n();

const props = defineProps({
  contacts: {
    type: Array,
    required: true
  }
})

const iconComponent = (type) => {
  const map = {
    instagram: 'IconInstagram',
    telegram: 'IconTelegram',
    facebook: 'IconFacebook',
    twitter: 'IconTwitter'
  }
  return map[type] || 'IconDefault'
}
</script>

<template>
  <template v-for="contact in contacts" :key="contact.id">
    <a
        v-if="contact.type === 'address'"
        href="#"
        class="footer__contact-link"
    >
      <span v-if="contact.labelKey">{{ t(contact.labelKey) }}</span>
      {{ contact.value }}
    </a>

    <a
        v-else-if="contact.type === 'email'"
        :href="`mailto:${contact.value}`"
        class="footer__contact-link"
    >
      <span v-if="contact.labelKey">{{ t(contact.labelKey) }}</span>
      {{ contact.value }}
    </a>

    <a
        v-else-if="contact.type === 'phone'"
        :href="`tel:${contact.value}`"
        class="footer__contact-link"
    >
      <span v-if="contact.labelKey">{{ t(contact.labelKey) }}</span>
      {{ contact.value }}
    </a>

    <a
        v-else-if="contact.type === 'social'"
        :href="contact.value"
        class="footer__contact-social"
        target="_blank"
        rel="noopener noreferrer"
        :title="contact?.labelKey ? t(contact.labelKey) : contact.value"
    >
      <component :is="iconComponent(contact.socialType.toLowerCase())" class="footer__social-icon"/>
    </a>
  </template>
</template>

<style scoped>
.footer__contact-social {
  display: inline-flex;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background: #eee;
  text-decoration: none;
}

.footer__social-icon {
  width: 20px;
  height: 20px;
}
</style>
