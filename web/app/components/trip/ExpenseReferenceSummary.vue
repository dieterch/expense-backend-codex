<script setup lang="ts">
import { buildExpenseReferenceSummary } from "~/utils/expense-reference";

const props = defineProps<{
  amount: number;
  currency: string;
  referenceEurAmount?: number | null;
  referenceRate?: number | null;
  referenceRateDate?: string | null;
  referenceRateProvider?: string | null;
  estimatedTotalEurAmount?: number | null;
  estimatedBankMarkupBps?: number | null;
  estimatedFixedFeeCents?: number | null;
}>();

const summary = computed(() => buildExpenseReferenceSummary(props));
</script>

<template>
  <template v-if="summary">
    <div class="text-caption text-medium-emphasis">{{ summary.headline }}</div>
    <div class="text-caption text-medium-emphasis">{{ summary.detail }}</div>
    <div
      v-if="typeof estimatedTotalEurAmount === 'number' && typeof estimatedBankMarkupBps === 'number'"
      class="text-caption text-medium-emphasis"
    >
      Estimated EUR {{ estimatedTotalEurAmount.toFixed(2) }}
      · markup {{ (estimatedBankMarkupBps / 100).toFixed(2) }}%
      <template v-if="typeof estimatedFixedFeeCents === 'number' && estimatedFixedFeeCents > 0">
        · fee EUR {{ (estimatedFixedFeeCents / 100).toFixed(2) }}
      </template>
    </div>
  </template>
</template>
