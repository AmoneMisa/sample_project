<script setup lang="ts">

</script>

<template>
  <div class="newsletter flex flex-col justify-center">
    <h3 class="newsletter__title">Join a Newsletter</h3>

    <div class="newsletter__form">
      <u-input
          type="email"
          name="newsletter-email"
          placeholder="Enter Your Email Here"
          :ui="{base: 'newsletter__input'}"
      />

      <u-button
          icon="i-heroicons-arrow-right"
          size="lg"
          color="primary"
          class="newsletter__button px-5"
      />
    </div>
  </div>
</template>

<style lang="scss">
.newsletter__title {
  font-weight: 500;
  font-size: 20px;
  padding-right: 31%;
  line-height: 28px;
  margin-bottom: 16px;
  color: var(--color-white)
}

.newsletter__input {
  flex-grow: 1;
  width: auto;
  margin-right: 10px;
  height: 50px;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.5);
  min-width: 230px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0 15px;
  background-color: transparent;
  transition: border-color .3s ease;

  &:hover {
    border-color: var(--color-primary);
  }
}

.newsletter__form {
  display: flex;
  align-items: center;
}

.newsletter__button {
  height: 50px;
  line-height: 50px;
}
</style>