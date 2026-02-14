<script setup lang="ts">
import type { JsonValue } from "~/utils/mergeJson/json";
import JsonTextTree from "~/components/mergeJson/JsonTextTree.vue";

type Highlight = "new" | "conflict" | "added" | "edited" | null;

const props = defineProps<{
  value: JsonValue;
  minify?: boolean;
  selected?: string;
  query?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
  highlightByLeaf?: (path: string) => Highlight;
}>();

const emit = defineEmits<{
  (e: "select", path: string): void;
}>();
</script>

<template>
  <JsonTextTree
      :value="value"
      :minify="minify"
      :selected="selected"
      :query="query"
      :only-diff="onlyDiff"
      :diff-set="diffSet"
      :highlight-by-leaf="highlightByLeaf"
      @select="emit('select', $event)"
  />
</template>
