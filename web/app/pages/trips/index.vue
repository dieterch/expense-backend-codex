<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  users?: Array<{ user: { id: string; name: string; email: string } }>;
  expenses?: Array<{ id: string; amount: number; amountCents?: number }>;
};

const api = useApi();
const auth = useAuth();
const selectedTripState = useSelectedTrip();
const loading = ref(true);
const trips = ref<Trip[]>([]);
const errorMessage = ref("");

async function loadTrips() {
  loading.value = true;
  errorMessage.value = "";

  try {
    trips.value = await api.get<Trip[]>("/trips");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load trips";
  } finally {
    loading.value = false;
  }
}

onMounted(loadTrips);

function openTrip(trip: Trip) {
  selectedTripState.setSelectedTrip({
    id: trip.id,
    name: trip.name,
  });

  return navigateTo(`/trips/${trip.id}`);
}
</script>

<template>
  <v-container class="py-8">
    <div class="page-wrap">
      <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Versioned API</div>
          <h1 class="text-h3 mb-2">Your trips</h1>
          <p class="text-medium-emphasis mb-0">
            Connected to <code>/api/v1</code>
            <span v-if="auth.user.value">as {{ auth.user.value.email }}</span>.
          </p>
        </div>
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadTrips">
          Refresh
        </v-btn>
      </div>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-6"
      >
        {{ errorMessage }}
      </v-alert>

      <v-row v-if="loading">
        <v-col v-for="item in 3" :key="item" cols="12" md="4">
          <v-skeleton-loader type="article" class="rounded-xl" />
        </v-col>
      </v-row>

      <v-row v-else-if="trips.length">
        <v-col
          v-for="trip in trips"
          :key="trip.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card color="surface" class="h-100 pa-2">
            <v-card-text class="d-flex flex-column h-100">
              <div class="d-flex justify-space-between align-center mb-4">
                <v-chip color="accent" variant="tonal">
                  {{ new Date(trip.startDate).toLocaleDateString() }}
                </v-chip>
                <v-chip v-if="auth.isAdmin.value" color="secondary" variant="tonal">
                  Admin view
                </v-chip>
              </div>
              <h2 class="text-h5 mb-3">{{ trip.name }}</h2>
              <div class="text-medium-emphasis mb-4">
                {{ trip.users?.length || 0 }} participants
                ·
                {{ trip.expenses?.length || 0 }} expenses
              </div>
              <div class="d-flex flex-wrap ga-2 mb-6">
                <v-chip
                  v-for="tripUser in trip.users?.slice(0, 3) || []"
                  :key="tripUser.user.id"
                  size="small"
                  variant="outlined"
                >
                  {{ tripUser.user.name }}
                </v-chip>
              </div>
              <div class="mt-auto">
                <v-btn
                  color="primary"
                  block
                  append-icon="mdi-arrow-right"
                  @click="openTrip(trip)"
                >
                  Open trip
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-else color="surface" class="pa-8 text-center">
        <div class="text-h5 mb-2">No trips yet</div>
        <p class="text-medium-emphasis mb-0">
          Once the backend has trip data for this account, it will show up here.
        </p>
      </v-card>
    </div>
  </v-container>
</template>
