<script setup lang="ts">
import JsonTreeNode from "~/components/common/JsonTreeNode.vue";

type JsonValue = null | boolean | number | string | JsonValue[] | Record<string, JsonValue>;
type Status = "same" | "diff" | "onlyA" | "onlyB";

const props = defineProps<{
  value: JsonValue;
  modelValue?: string;
  sort?: "asc" | "desc";
  filter?: string;
  onlyDiff?: boolean;
  diffSet?: Set<string>;
  statusByLeaf?: (path: string) => Status | null;
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

function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function sortDeep(v: any): any {
  if (!v || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(sortDeep);
  if (!isPlainObject(v)) return v;

  const keys = Object.keys(v).sort((a, b) => a.localeCompare(b));
  if (props.sort === "desc") keys.reverse();

  const out: Record<string, any> = {};
  for (const k of keys) out[k] = sortDeep(v[k]);
  return out;
}

const sortedRoot = computed(() => sortDeep(props.value));
const filterLc = computed(() => (props.filter || "").trim().toLowerCase());
</script>

<template>
  <div class="jtv">
    <JsonTreeNode
        label="root"
        :value="sortedRoot"
        path=""
        :opened="opened"
        :selected="modelValue"
        :filter="filterLc"
        :only-diff="onlyDiff"
        :diff-set="diffSet"
        :status-by-leaf="statusByLeaf"
        @toggle="toggle"
        @select="select"
    />
  </div>
</template>

<style scoped>
.jtv {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
