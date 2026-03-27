<script setup lang="ts">
type TripUserOption = {
  id: string;
  name: string;
  email: string;
};

type TripFormState = {
  name: string;
  startDate: string;
  endDate: string;
  userIds: string[];
};

const props = defineProps<{
  modelValue: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  form: TripFormState;
  users: TripUserOption[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
}>();

const isValid = computed(() =>
  Boolean(props.form.name.trim()) &&
  Boolean(props.form.startDate) &&
  props.form.userIds.length > 0,
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
          <div class="text-overline text-secondary page-title font-weight-bold">Trips</div>
          <div class="text-h5">{{ title }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </div>

      <v-form @submit.prevent="emit('submit')">
        <v-text-field
          v-model="form.name"
          label="Trip name"
          prepend-inner-icon="mdi-bag-suitcase-outline"
          class="mb-3"
        />

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.startDate"
              label="Start date"
              type="date"
              prepend-inner-icon="mdi-calendar-start"
              class="mb-3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.endDate"
              label="End date"
              type="date"
              prepend-inner-icon="mdi-calendar-end"
              class="mb-3"
            />
          </v-col>
        </v-row>

        <v-sheet color="background" rounded="xl" class="pa-4 mb-4">
          <div class="d-flex align-center mb-3">
            <v-icon icon="mdi-account-multiple-outline" class="mr-2" />
            <div class="font-weight-medium">Participants</div>
          </div>

          <div class="mobile-stack">
            <v-checkbox
              v-for="user in users"
              :key="user.id"
              v-model="form.userIds"
              :label="`${user.name} (${user.email})`"
              :value="user.id"
              hide-details
              density="comfortable"
            />
          </div>
        </v-sheet>

        <div class="d-flex justify-end ga-3 flex-wrap">
          <v-btn variant="tonal" color="primary" @click="emit('update:modelValue', false)">
            Cancel
          </v-btn>
          <v-btn type="submit" color="secondary" :loading="saving" :disabled="!isValid">
            {{ submitLabel }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>
