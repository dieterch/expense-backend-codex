<script setup lang="ts">
import { useDisplay } from "vuetify";

const route = useRoute();
const auth = useAuth();
const selectedTripState = useSelectedTrip();
const display = useDisplay();
const drawerOpen = ref(false);

selectedTripState.init();

const showShell = computed(() => route.path !== "/login");
const isMobile = computed(() => display.mdAndDown.value);
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

watch(() => route.path, () => {
  drawerOpen.value = false;
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
        <div class="page-wrap shell-bar w-100">
          <div class="d-flex align-center ga-3">
            <v-btn
              v-if="isMobile"
              icon="mdi-menu"
              color="white"
              variant="text"
              aria-label="Open navigation"
              @click="drawerOpen = !drawerOpen"
            />
            <div class="d-flex flex-column">
              <span class="text-caption page-title text-white">Expense Web</span>
              <strong class="text-white">Trips and shared costs</strong>
            </div>
            <nav v-if="!isMobile" class="d-flex flex-wrap ga-2">
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
          <div class="shell-bar-actions">
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

      <v-navigation-drawer
        v-if="isMobile"
        v-model="drawerOpen"
        location="left"
        color="surface"
        temporary
      >
        <div class="pa-4">
          <div class="text-overline text-secondary page-title font-weight-bold mb-1">Navigate</div>
          <div class="text-h6 mb-4">Expense Web</div>
          <div class="d-flex flex-column ga-2">
            <v-btn
              v-for="item in navigationItems"
              :key="item.to"
              :to="item.to"
              color="primary"
              variant="tonal"
              block
              class="justify-start"
            >
              {{ item.title }}
            </v-btn>
            <v-btn color="secondary" prepend-icon="mdi-logout" block @click="auth.logout">
              Sign out
            </v-btn>
          </div>
        </div>
      </v-navigation-drawer>
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
