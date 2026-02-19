<script setup lang="ts">
import Modal from "~/components/common/Modal.vue";
import CustomInput from "~/components/common/CustomInput.vue";
import CustomButton from "~/components/common/CustomButton.vue";
import { computed, reactive, watch } from "vue";
import type { TemplateEngine } from "~/utils/emailEditor/preview/clientProfiles";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  templateEngine: TemplateEngine;
}>();

const emit = defineEmits<{
  (e: "insert", payload: { snippet: string }): void;
}>();

const form = reactive({
  kind: "if" as "if" | "variable" | "loop" | "declare",
  variableName: "user",
  condition: "user.isActive",
  collection: "items",
  itemName: "item",
  declareType: "string" as "string" | "number" | "object" | "array",
});

watch(
    () => open.value,
    (v) => {
      if (!v) return;
      form.kind = "if";
    }
);

const isTemplateMode = computed(() => props.templateEngine !== "clean_html");

function submit() {
  if (!isTemplateMode.value) return;

  const snippet = buildSnippet({
    engine: props.templateEngine,
    kind: form.kind,
    variableName: form.variableName,
    condition: form.condition,
    collection: form.collection,
    itemName: form.itemName,
    declareType: form.declareType,
  });

  emit("insert", { snippet });
  open.value = false;
}

function buildSnippet(input: any) {
  if (input.engine === "freemarker") {
    if (input.kind === "if") return `<#if ${input.condition}>\n  \n</#if>`;
    if (input.kind === "variable") return `\${${input.variableName}}`;
    if (input.kind === "loop") return `<#list ${input.collection} as ${input.itemName}>\n  \${${input.itemName}}\n</#list>`;
    if (input.declareType === "string") return `<#assign ${input.variableName} = "text">`;
    if (input.declareType === "number") return `<#assign ${input.variableName} = 123>`;
    if (input.declareType === "object") return `<#assign ${input.variableName} = {"key":"value"}>`;
    return `<#assign ${input.variableName} = ["a","b","c"]>`;
  }

  if (input.kind === "if") return `#if( ${input.condition} )\n  \n#end`;
  if (input.kind === "variable") return `$${input.variableName}`;
  if (input.kind === "loop") return `#foreach( $${input.itemName} in $${input.collection} )\n  $${input.itemName}\n#end`;
  if (input.declareType === "string") return `#set( $${input.variableName} = "text" )`;
  if (input.declareType === "number") return `#set( $${input.variableName} = 123 )`;
  if (input.declareType === "object") return `#set( $${input.variableName} = {"key":"value"} )`;
  return `#set( $${input.variableName} = ["a","b","c"] )`;
}
</script>

<template>
  <modal v-model:open="open" max-width-class="sm:max-w-xl">
    <template #title>Insert template construct</template>

    <div v-if="!isTemplateMode" class="email-editor-template__notice">
      Switch template mode to Freemarker or Velocity.
    </div>

    <div v-else class="email-editor-template">
      <div class="email-editor-template__kind">
        <u-select
            v-model="form.kind"
            :items="[
            { label: 'If', value: 'if' },
            { label: 'Variable output', value: 'variable' },
            { label: 'Loop', value: 'loop' },
            { label: 'Declare variable', value: 'declare' }
          ]"
        />
      </div>

      <CustomInput v-if="form.kind === 'if'" v-model="form.condition" label="Condition" />
      <CustomInput v-if="form.kind === 'variable'" v-model="form.variableName" label="Variable name" />

      <div v-if="form.kind === 'loop'" class="email-editor-template__row">
        <CustomInput v-model="form.collection" label="Collection" />
        <CustomInput v-model="form.itemName" label="Item name" />
      </div>

      <div v-if="form.kind === 'declare'" class="email-editor-template__row">
        <CustomInput v-model="form.variableName" label="Variable name" />
        <u-select
            v-model="form.declareType"
            :items="[
            { label: 'String', value: 'string' },
            { label: 'Number', value: 'number' },
            { label: 'Object', value: 'object' },
            { label: 'Array', value: 'array' }
          ]"
        />
      </div>
    </div>

    <template #actions="{ close }">
      <CustomButton variant="secondary" @click="close()">Cancel</CustomButton>
      <CustomButton variant="full" :class="{ 'opacity-60 pointer-events-none': !isTemplateMode }" @click="submit">
        Insert
      </CustomButton>
    </template>
  </modal>
</template>

<style scoped lang="scss">
.email-editor-template {
  display: grid;
  gap: 10px;
}

.email-editor-template__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.email-editor-template__notice {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 190, 90, 0.12);
  border: 1px solid rgba(255, 190, 90, 0.18);
}

.light .email-editor-template__notice {
  background: rgba(255, 190, 90, 0.16);
  border-color: rgba(255, 190, 90, 0.22);
}
</style>
