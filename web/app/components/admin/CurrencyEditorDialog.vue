<script setup lang="ts">
type CurrencyFormState = {
  name: string;
  displayName: string;
  symbol: string;
  factor: number;
  enabled: boolean;
};

defineProps<{
  modelValue: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  form: CurrencyFormState;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
}>();
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card color="surface" class="pa-4 pa-md-6">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Admin</div>
          <div class="text-h5">{{ title }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </div>

      <v-form @submit.prevent="emit('submit')">
        <v-text-field
          v-model="form.name"
          label="Code"
          prepend-inner-icon="mdi-currency-usd"
          class="mb-3"
          :disabled="isEditing"
        />
        <v-text-field
          v-model="form.displayName"
          label="Currency name"
          prepend-inner-icon="mdi-card-text-outline"
          class="mb-3"
        />
        <v-text-field
          v-model="form.symbol"
          label="Symbol"
          prepend-inner-icon="mdi-format-letter-case"
          class="mb-3"
        />
        <v-text-field
          v-model.number="form.factor"
          type="number"
          step="0.0001"
          min="0"
          label="Factor"
          prepend-inner-icon="mdi-chart-line"
          class="mb-3"
        />
        <v-checkbox
          v-model="form.enabled"
          label="Available in trip expense dialogs"
          color="secondary"
          class="mb-4"
        />

        <div class="d-flex justify-end ga-3">
          <v-btn variant="tonal" color="primary" @click="emit('update:modelValue', false)">
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            color="secondary"
            :loading="saving"
            :disabled="!form.name.trim() || !form.displayName.trim() || !form.symbol.trim() || form.factor <= 0"
          >
            {{ submitLabel }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>
