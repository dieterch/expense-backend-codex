<script setup lang="ts">
definePageMeta({
  middleware: "root-redirect",
});
</script>

<template>
  <v-container class="py-8 fill-height d-flex align-center justify-center">
    <div class="page-wrap">
      <v-card color="surface" class="pa-8 text-center">
        <v-progress-circular
          indeterminate
          color="secondary"
          size="56"
          width="5"
          class="mb-4"
        />
        <div class="text-h5 mb-2">Opening Expense Web</div>
        <p class="text-medium-emphasis mb-0">
          Redirecting you to your trips.
        </p>
      </v-card>
    </div>
  </v-container>
</template>
