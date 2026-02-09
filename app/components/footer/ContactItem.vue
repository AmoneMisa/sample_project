<script setup lang="ts">
const icons = {
  telegram: () => import('~/assets/icons/telegram.svg'),
  whatsapp: () => import('~/assets/icons/whatsapp.svg'),
  github: () => import('~/assets/icons/github.svg'),
};

function iconComponent(name: string) {
  return icons[name] || null;
}

const {t} = useI18n();

const props = defineProps({
  contacts: {
    type: Array,
    required: true
  }
});
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

    <a v-else-if="contact.type === 'social'"
       :href="contact.value"
       class="footer__contact-social"
       target="_blank"
       rel="noopener noreferrer"
       :title="contact?.labelKey ? t(contact.labelKey) : contact.value"
    >
      <component :is="iconComponent(contact.socialType.toLowerCase())" class="footer__social-icon"/>
    </a>

    <span v-else-if="contact.type === 'other'" class="footer__contact-link">
      {{ contact.value }} {{ t(contact.labelKey) }}
    </span>
  </template>
</template>

<style scoped lang="scss">
.footer__contact-social {
  display: inline-flex;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  border: var(--color-primary-alt);

  &:hover {
    border: var(--color-primary);
  }
}

.footer__social-icon {
  width: 24px;
  height: 24px;
}
</style>
