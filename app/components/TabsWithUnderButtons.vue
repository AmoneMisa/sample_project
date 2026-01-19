<script setup lang="ts">
const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
    required: true
  },
  buttonText: {
    type: String,
    default: "Try It Now →"
  }
});
</script>

<template>
  <u-tabs
      :items="tabs"
      class="tabs tabs-with-under-buttons"
      :ui="{
      list: 'tabs__list bg-transparent',
      trigger: 'tabs__button',
      indicator: 'bg-transparent brightness-125',
      label: 'w-fill-available flex flex-col text-left '
    }"
  >
    <template #default="{ item, index }">
      <span class="tabs__count">
        <span>0{{ index + 1 }}</span>
      </span>
      <span class="tabs__title">{{ item.title }}</span>
    </template>


    <template #content="{ item }">
      <div class="tabs__content fade-on-switch">
        <div class="tabs__image">
          <img :src="item.image" :alt="item.title" />
        </div>

        <div class="tabs__info">
          <page-header
              :title="item.title"
              :description="item.description"
              :headline="item.headline"
              :isCentered="false"
              descriptionClasses="mt-8"
              headLineClasses="gradient-text_cap"
          />
          <custom-button class="tabs__button-cta mt-8">
            {{ buttonText }}
          </custom-button>
        </div>
      </div>
    </template>
  </u-tabs>
</template>

<style lang="scss">
.tabs.tabs-with-under-buttons {
  display: flex;
  flex-direction: column-reverse;
  gap: 40px;

  &__list {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
  }

  &__button {
    cursor: pointer;
    padding-top: 24px;
    margin: 0 15px;
    border: none;
    background: transparent;
    transition: 0.3s;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      height: 2px;
      width: 100%;
      background: rgb(52, 54, 103);
      border-radius: 7px;
      transition: 0.3s;
    }
  }

  &__count {
    width: 36px;
    height: 36px;
    background: url("/images/tab-bg-shape.png") center/cover no-repeat;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;

    span {
      background: linear-gradient(
              90deg,
              var(--color-primary-gradient-start),
              var(--color-primary-gradient-end)
      );
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 600;
    }
  }

  &__title {
    margin-top: 8px;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-link);
    transition: 0.3s;
    text-align: left;
  }

  &__content {
    display: flex;
    gap: 40px;
    align-items: center;
  }

  &__image {
    max-width: 40%;
    min-height: 450px;

    img {
      width: 100%;
      display: block;
    }
  }

  &__info {
    max-width: 55%;
    padding: 20px 40px;
  }

  &__button-cta {
    margin-top: 24px;
    width: fit-content;
  }
}

.tabs__button[data-state="active"]::before {
  background: linear-gradient(90deg, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
}

.tabs__button[data-state="active"] .tabs__title {
  color: var(--color-white);
}

.tabs__image {
  img {
    min-width: 320px;
    min-height: 320px;
  }
}
</style>
