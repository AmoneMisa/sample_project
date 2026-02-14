<script setup lang="ts">
import type {JsonValue} from "~/utils/mergeJson/json";
import JsonTreeNode from "~/components/mergeJson/JsonTreeNode.vue";

type Pane = "A" | "B" | "R";
type Highlight = "new" | "conflict" | "added" | "edited" | null;

const props = defineProps<{
  value: JsonValue;
  pane: Pane;
  modelValue?: string;

  filter?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;

  highlightByLeaf?: (path: string) => Highlight;
  matchByLeaf?: (path: string) => boolean;

  onPick?: (path: string, from: "A" | "B") => void;
  onReset?: (path: string) => void;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
}>();

const opened = reactive(new Set<string>([""]));

function toggle(path: string) {
  if (opened.has(path)) opened.delete(path);
  else opened.add(path);
}

function select(path: string) {
  emit("update:modelValue", path);
}

const filterLc = computed(() => (props.filter || "").trim().toLowerCase());
</script>

<template>
  <div class="jtt">
    <JsonTreeNode
        :label="''"
        :value="value"
        path=""
        :depth="0"
        :opened="opened"
        :selected="modelValue"
        :filter="filterLc"
        :only-diff="onlyDiff"
        :diff-set="diffSet"
        :highlight-by-leaf="highlightByLeaf"
        :match-by-leaf="matchByLeaf"
        :pane="pane"
        :on-pick="onPick"
        :on-reset="onReset"
        @toggle="toggle"
        @select="select"
    />
  </div>
</template>

<style scoped>
.jtt {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
