<script setup lang="ts">
import PageHeader from "~/components/common/PageHeader.vue";
import SvgEditorShell from "~/components/svgEditor/SvgEditorShell.vue";

const { t } = useI18n();

useSeoMeta({
  title: () => t("seo.pages.svgEditor.title"),
  description: () => t("seo.pages.svgEditor.description"),
  robots: () => t("seo.common.robots"),
  ogType: () => t("seo.common.ogType"),
  ogSiteName: () => t("seo.common.siteName"),
  ogTitle: () => t("seo.pages.svgEditor.ogTitle"),
  ogDescription: () => t("seo.pages.svgEditor.ogDescription"),
  twitterCard: () => t("seo.common.twitterCard"),
  twitterTitle: () => t("seo.pages.svgEditor.twitterTitle"),
  twitterDescription: () => t("seo.pages.svgEditor.twitterDescription"),
});
</script>

<template>
  <u-container class="svg-editor">
    <div class="svg-editor__header background-hero text-center space-y-3">
      <page-header
          title="services.svgEditor.title"
          description="services.svgEditor.subtitle"
          class="mb-6"
          :is-centered="true"
      />
    </div>

    <svg-editor-shell />
  </u-container>
</template>

<style lang="scss">
.svg-editor {
  padding-top: 24px;
  padding-bottom: 96px;
}
</style>
