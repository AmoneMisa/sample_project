<script setup lang="ts">
const buttonTypes = ['default', 'white', 'black', 'gradient-white', 'figure', 'link'] as const
type LegacyType = typeof buttonTypes[number]

type Variant = 'primary' | 'secondary' | 'ghost'

const props = defineProps<{
  buttonType?: LegacyType
  variant?: Variant
}>()

const resolved = computed<Variant>(() => {
  if (props.variant) return props.variant

  if (props.buttonType === 'white') return 'secondary'
  if (props.buttonType === 'link') return 'ghost'
  if (props.buttonType === 'gradient-white') return 'primary'
  return 'primary'
})
</script>

<template>
  <u-button
      v-if="resolved === 'primary'"
      class="btn btn_primary"
  >
    <slot />
  </u-button>

  <u-button
      v-else-if="resolved === 'secondary'"
      class="btn btn_secondary"
  >
    <slot />
  </u-button>

  <u-button
      v-else
      variant="ghost"
      class="btn btn_ghost"
  >
    <slot />
  </u-button>
</template>

<style scoped lang="scss">
.btn {
  height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 650;
  letter-spacing: 0.2px;
  transition: 0.25s ease;
}

.btn_primary {
  color: white;
  border: 1px solid rgba(255,255,255,0.10);
  background:
      radial-gradient(120% 120% at 20% 0%, rgba(128,90,245,0.20) 0%, rgba(128,90,245,0) 60%),
      var(--secondary-bg-gradient);
  box-shadow: 0 18px 55px rgba(0,0,0,0.35);
  backdrop-filter: blur(10px);
}
.btn_primary:hover { filter: brightness(1.12); box-shadow: 0 20px 70px rgba(0,0,0,0.45); }

.btn_secondary {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--ui-border);
  box-shadow: 0 16px 40px rgba(0,0,0,0.28);
  backdrop-filter: blur(10px);
}
.btn_secondary:hover { background: rgba(255,255,255,0.04); }

.btn_ghost {
  color: rgba(255,255,255,0.90);
  padding: 0;
  height: auto;
  border-radius: 10px;
}
.btn_ghost:hover {
  background-image: linear-gradient(to right, var(--color-primary-gradient-start), var(--color-primary-gradient-end));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
</style>
