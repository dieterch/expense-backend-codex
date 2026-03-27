<script setup lang="ts">
const route = useRoute();
const auth = useAuth();
const selectedTripState = useSelectedTrip();

selectedTripState.init();

const showShell = computed(() => route.path !== "/login");
const navigationItems = computed(() => {
  const items = [
    { title: "Trips", to: "/trips" },
  ];

  if (auth.isAdmin.value) {
    items.push(
      { title: "Users", to: "/admin/users" },
      { title: "Categories", to: "/admin/categories" },
      { title: "Currencies", to: "/admin/currencies" },
      { title: "All Expenses", to: "/admin/expenses" },
    );
  }

  return items;
});
</script>

<template>
  <v-app class="app-shell grain-overlay">
    <template v-if="!auth.initialized.value && showShell">
      <v-main>
        <v-container class="fill-height d-flex align-center justify-center">
          <div class="page-wrap">
            <v-card color="surface" class="pa-8 text-center">
              <v-progress-circular
                indeterminate
                color="secondary"
                size="56"
                width="5"
                class="mb-4"
              />
              <div class="text-h5 mb-2">Restoring your session</div>
              <p class="text-medium-emphasis mb-0">
                Checking your saved login and preparing the app shell.
              </p>
            </v-card>
          </div>
        </v-container>
      </v-main>
    </template>

    <template v-else-if="showShell">
      <v-app-bar color="primary" density="comfortable" flat>
        <div class="page-wrap d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center flex-wrap ga-4">
            <div class="d-flex flex-column">
              <span class="text-caption page-title text-white">Expense Web</span>
              <strong class="text-white">Trips and shared costs</strong>
            </div>
            <nav class="d-flex flex-wrap ga-2">
              <v-btn
                v-for="item in navigationItems"
                :key="item.to"
                :to="item.to"
                color="white"
                variant="text"
                class="shell-nav-link"
              >
                {{ item.title }}
              </v-btn>
            </nav>
          </div>
          <div class="d-flex align-center ga-3">
            <v-chip
              v-if="selectedTripState.selectedTrip.value"
              color="white"
              variant="outlined"
              :to="`/trips/${selectedTripState.selectedTrip.value.id}`"
            >
              {{ selectedTripState.selectedTrip.value.name }}
            </v-chip>
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
