<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const jobId = computed(() => (typeof route.params.jobId === "string" ? route.params.jobId : null));

function uploadNew() {
  router.push("/services/pdf-editor");
}

</script>

<template>

</template>

<style scoped lang="scss">

</style>