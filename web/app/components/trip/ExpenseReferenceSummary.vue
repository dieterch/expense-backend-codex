<script setup lang="ts">
import { buildExpenseReferenceSummary } from "~/utils/expense-reference";

const props = defineProps<{
  amount: number;
  currency: string;
  referenceEurAmount?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
}>();

const summary = computed(() => buildExpenseReferenceSummary(props));
</script>

<template>
  <template v-if="summary">
    <div class="text-caption text-medium-emphasis">{{ summary.headline }}</div>
    <div class="text-caption text-medium-emphasis">{{ summary.detail }}</div>
  </template>
</template>
