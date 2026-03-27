<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string | null;
  label?: string | null;
  size?: string;
}>(), {
  icon: "mdi-shape-outline",
  label: null,
  size: "small",
});
</script>

<template>
  <v-avatar color="accent" variant="tonal" :size="size === 'large' ? 42 : 30" class="category-icon">
    <v-icon :icon="icon || 'mdi-shape-outline'" :size="size === 'large' ? 22 : 16" />
  </v-avatar>
  <span v-if="label" class="ml-2">{{ label }}</span>
</template>
