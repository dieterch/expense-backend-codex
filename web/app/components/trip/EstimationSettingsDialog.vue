<script setup lang="ts">
import type { EstimationSettings } from "~/utils/expense-estimation";

type CurrencyField = {
  currency: string;
  markupPercent: number | null;
};

const props = defineProps<{
  modelValue: boolean;
  saving: boolean;
  form: {
    globalMarkupPercent: number;
    fixedFeeAmount: number;
    weekendMarkupPercent: number;
    currencyFields: CurrencyField[];
  };
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
  reset: [];
}>();

const isValid = computed(() =>
  Number.isFinite(props.form.globalMarkupPercent) &&
  Number.isFinite(props.form.fixedFeeAmount) &&
  Number.isFinite(props.form.weekendMarkupPercent) &&
  props.form.currencyFields.every((entry) => entry.markupPercent === null || Number.isFinite(entry.markupPercent)),
);
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
          <div class="text-overline text-secondary page-title font-weight-bold">Estimation</div>
          <div class="text-h5">Bank-cost settings</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </div>

      <p class="text-medium-emphasis mb-4">
        Tune a simple markup-plus-fee model for foreign-currency expenses. These settings stay in your browser for now.
      </p>

      <v-form @submit.prevent="emit('submit')">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.globalMarkupPercent"
              type="number"
              min="0"
              step="0.01"
              label="Default markup (%)"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.weekendMarkupPercent"
              type="number"
              min="0"
              step="0.01"
              label="Weekend surcharge (%)"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.fixedFeeAmount"
              type="number"
              min="0"
              step="0.01"
              label="Fixed fee (EUR)"
            />
          </v-col>
        </v-row>

        <div class="text-subtitle-1 font-weight-bold mb-3">Currency overrides</div>
        <v-row>
          <v-col
            v-for="entry in form.currencyFields"
            :key="entry.currency"
            cols="12"
            md="6"
          >
            <v-text-field
              v-model.number="entry.markupPercent"
              type="number"
              min="0"
              step="0.01"
              :label="`${entry.currency} markup override (%)`"
              hint="Leave empty to use the default markup."
              persistent-hint
            />
          </v-col>
        </v-row>

        <div class="d-flex justify-space-between flex-wrap ga-3 mt-4">
          <v-btn variant="tonal" color="primary" @click="emit('reset')">
            Reset defaults
          </v-btn>
          <div class="d-flex ga-3">
            <v-btn variant="tonal" color="primary" @click="emit('update:modelValue', false)">
              Cancel
            </v-btn>
            <v-btn
              type="submit"
              color="secondary"
              :loading="saving"
              :disabled="!isValid"
            >
              Save settings
            </v-btn>
          </div>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>
