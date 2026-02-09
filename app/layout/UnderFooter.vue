<script setup lang="ts">
import {safeFetch} from "~/utils/safeFetch";
import ContactItem from "~/components/footer/ContactItem.vue";

const config = useRuntimeConfig();
const {data: contacts} = await safeFetch<[]>(
    `${config.public.apiBase}/contacts`
);
</script>

<template>
  <div class="under-footer" v-if="contacts && contacts.length">
    <div class="under-footer__column" >
      <u-page-list class="under-footer__list under-footer__contact">
        <contact-item :contacts="contacts.filter(contact => contact.type === 'social') || []"/>
      </u-page-list>
    </div>

    <div class="under-footer__column"><contact-item :contacts="contacts.filter(contact => contact.type === 'other') || []"/></div>
  </div>
</template>

<style scoped lang="scss">
.under-footer {
  display: flex;
  justify-content: center;
  align-items: center;
}

.under-footer__list {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>