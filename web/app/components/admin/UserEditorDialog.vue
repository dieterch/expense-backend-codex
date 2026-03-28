<script setup lang="ts">
type UserFormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  settlementFactor: number;
};

const props = defineProps<{
  modelValue: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  form: UserFormState;
  isEditing: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
}>();

const isValid = computed(() =>
  Boolean(props.form.name.trim()) &&
  Boolean(props.form.email.trim()) &&
  Boolean(props.form.role) &&
  Number.isFinite(props.form.settlementFactor) &&
  props.form.settlementFactor > 0 &&
  (props.isEditing || Boolean(props.form.password.trim())),
);
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
          <div class="text-overline text-secondary page-title font-weight-bold">Admin</div>
          <div class="text-h5">{{ title }}</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </div>

      <v-form @submit.prevent="emit('submit')">
        <v-text-field
          v-model="form.name"
          label="Name"
          prepend-inner-icon="mdi-account-outline"
          class="mb-3"
        />
        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          class="mb-3"
        />
        <v-select
          v-model="form.role"
          label="Role"
          :items="['user', 'admin']"
          prepend-inner-icon="mdi-shield-account-outline"
          class="mb-3"
        />
        <v-text-field
          v-model.number="form.settlementFactor"
          label="Settlement factor"
          type="number"
          min="0.01"
          step="0.01"
          prepend-inner-icon="mdi-scale-balance"
          class="mb-3"
        />
        <v-text-field
          v-model="form.password"
          :label="isEditing ? 'New password (optional)' : 'Password'"
          type="password"
          prepend-inner-icon="mdi-lock-outline"
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
            :disabled="!isValid"
          >
            {{ submitLabel }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>
