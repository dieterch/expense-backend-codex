<script setup lang="ts">
type Category = {
  id: string;
  name: string;
  icon: string;
};

type Currency = {
  name: string;
  displayName?: string;
  symbol: string;
  factor: number;
};

type TripParticipant = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type ExpenseFormState = {
  amount: number;
  currency: string;
  date: string;
  location: string;
  description: string;
  categoryId: string;
  userId: string;
};

const props = defineProps<{
  modelValue: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  categories: Category[];
  currencies: Currency[];
  participants: TripParticipant[];
  form: ExpenseFormState;
  isAdmin: boolean;
  currentUserName: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
}>();

const isValid = computed(() =>
  props.form.amount > 0 &&
  Boolean(props.form.currency) &&
  Boolean(props.form.date) &&
  Boolean(props.form.location.trim()) &&
  Boolean(props.form.categoryId) &&
  Boolean(props.form.userId),
);

function closeDialog() {
  emit("update:modelValue", false);
}

function submit() {
  emit("submit");
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="640"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card color="surface" class="pa-4 pa-md-6">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Expense</div>
          <div class="text-h5">{{ title }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </div>

      <v-form @submit.prevent="submit">
        <v-text-field
          v-model.number="form.amount"
          type="number"
          min="0"
          step="0.01"
          label="Amount"
          prepend-inner-icon="mdi-cash"
          class="mb-3"
        />
        <v-select
          v-model="form.currency"
          :items="currencies"
          item-title="name"
          item-value="name"
          label="Currency"
          prepend-inner-icon="mdi-currency-eur"
          class="mb-3"
        />
        <v-select
          v-model="form.categoryId"
          :items="categories"
          item-title="name"
          item-value="id"
          label="Category"
          prepend-inner-icon="mdi-shape-outline"
          class="mb-3"
        />
        <v-select
          v-if="isAdmin"
          v-model="form.userId"
          :items="participants"
          item-title="user.name"
          item-value="user.id"
          label="Payer"
          prepend-inner-icon="mdi-account-outline"
          class="mb-3"
        />
        <v-sheet
          v-else
          color="background"
          rounded="xl"
          class="pa-3 mb-3 text-body-2"
        >
          Paying as <strong>{{ currentUserName }}</strong>
        </v-sheet>
        <v-text-field
          v-model="form.date"
          type="date"
          label="Date"
          prepend-inner-icon="mdi-calendar"
          class="mb-3"
        />
        <v-text-field
          v-model="form.location"
          label="Location"
          prepend-inner-icon="mdi-map-marker-outline"
          class="mb-3"
        />
        <v-textarea
          v-model="form.description"
          label="Description"
          rows="3"
          class="mb-4"
        />

        <div class="d-flex justify-end ga-3">
          <v-btn variant="tonal" color="primary" @click="closeDialog">
            Cancel
          </v-btn>
          <v-btn
            type="submit"
            color="secondary"
            :loading="saving"
            :disabled="!isValid"
          >
            {{ submitLabel }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>
