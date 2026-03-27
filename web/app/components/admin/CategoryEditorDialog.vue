<script setup lang="ts">
type CategoryFormState = {
  name: string;
  icon: string;
};

defineProps<{
  modelValue: boolean;
  saving: boolean;
  title: string;
  submitLabel: string;
  form: CategoryFormState;
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
          label="Name"
          prepend-inner-icon="mdi-shape-outline"
          class="mb-3"
        />
        <v-text-field
          v-model="form.icon"
          label="Icon"
          prepend-inner-icon="mdi-star-outline"
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
            :disabled="!form.name.trim() || !form.icon.trim()"
          >
            {{ submitLabel }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </v-dialog>
</template>
