<script setup lang="ts">
type CategoryStat = {
  category: string;
  amount: number;
};

const props = defineProps<{
  modelValue: boolean;
  totalAmount: number;
  expenseCount: number;
  uniquePayers: number;
  durationDays: number;
  averagePerDay: number;
  categoryBreakdown: CategoryStat[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card color="surface" class="pa-4 pa-md-6">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Statistics</div>
          <div class="text-h5">Trip snapshot</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </div>

      <v-row class="mb-2">
        <v-col cols="6" md="3">
          <v-sheet color="background" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Total</div>
            <div class="text-h6">EUR {{ totalAmount.toFixed(2) }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="6" md="3">
          <v-sheet color="background" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Expenses</div>
            <div class="text-h6">{{ expenseCount }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="6" md="3">
          <v-sheet color="background" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Payers</div>
            <div class="text-h6">{{ uniquePayers }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="6" md="3">
          <v-sheet color="background" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Avg / day</div>
            <div class="text-h6">EUR {{ averagePerDay.toFixed(2) }}</div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-sheet color="background" rounded="xl" class="pa-4 mb-4">
        <div class="text-caption text-medium-emphasis">Trip span</div>
        <div class="text-h6">{{ durationDays }} day<span v-if="durationDays !== 1">s</span></div>
      </v-sheet>

      <div class="text-subtitle-1 font-weight-bold mb-3">Category breakdown</div>

      <v-list v-if="categoryBreakdown.length" bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="entry in categoryBreakdown"
          :key="entry.category"
          class="px-0"
        >
          <template #append>
            <strong>EUR {{ entry.amount.toFixed(2) }}</strong>
          </template>
          <v-list-item-title>{{ entry.category }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-alert v-else type="info" variant="tonal">
        Add your first expense to unlock trip statistics.
      </v-alert>
    </v-card>
  </v-dialog>
</template>
