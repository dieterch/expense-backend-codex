<script setup lang="ts">
const route = useRoute();
const auth = useAuth();

const showShell = computed(() => route.path !== "/login");
</script>

<template>
  <v-app class="app-shell grain-overlay">
    <template v-if="showShell">
      <v-app-bar color="primary" density="comfortable" flat>
        <div class="page-wrap d-flex align-center justify-space-between w-100">
          <div class="d-flex flex-column">
            <span class="text-caption page-title text-white">Expense Web</span>
            <strong class="text-white">Trips and shared costs</strong>
          </div>
          <div class="d-flex align-center ga-3">
            <v-chip
              v-if="auth.user.value"
              color="accent"
              variant="flat"
              class="font-weight-medium"
            >
              {{ auth.user.value.name }}
              <template v-if="auth.isAdmin.value">
                · admin
              </template>
            </v-chip>
            <v-btn color="secondary" prepend-icon="mdi-logout" @click="auth.logout">
              Sign out
            </v-btn>
          </div>
        </div>
      </v-app-bar>
      <v-main>
        <slot />
      </v-main>
    </template>

    <template v-else>
      <v-main>
        <slot />
      </v-main>
    </template>
  </v-app>
</template>
