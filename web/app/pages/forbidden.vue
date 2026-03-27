<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});
</script>

<template>
  <v-container class="py-12">
    <div class="page-wrap">
      <v-card color="surface" class="pa-8 text-center">
        <div class="text-overline text-secondary page-title font-weight-bold mb-3">Forbidden</div>
        <h1 class="text-h3 mb-3">This area is for admins only.</h1>
        <p class="text-medium-emphasis mb-6">
          Your account is signed in, but it does not have permission to open this page.
        </p>
        <div class="d-flex justify-center ga-3 flex-wrap">
          <v-btn color="primary" to="/trips">
            Back to trips
          </v-btn>
          <v-btn color="secondary" variant="tonal" to="/login">
            Switch account
          </v-btn>
        </div>
      </v-card>
    </div>
  </v-container>
</template>
