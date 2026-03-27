<script setup lang="ts">
import { buildExpenseReferenceSummary } from "~/utils/expense-reference";

const props = defineProps<{
  amount: number;
  currency: string;
  referenceEurAmount?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
  manualReferenceEurAmount?: number | null;
  manualRate?: number | null;
  manualRateProvider?: string | null;
  estimatedTotalEurAmount?: number | null;
  estimatedBankMarkupBps?: number | null;
  estimatedFixedFeeCents?: number | null;
}>();

const summary = computed(() => buildExpenseReferenceSummary(props));
</script>

<template>
  <div v-if="summary" class="text-caption text-medium-emphasis">{{ summary.headline }}</div>
</template>
