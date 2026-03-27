<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import TripEditorDialog from "~/components/admin/TripEditorDialog.vue";

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  users?: Array<{ user: { id: string; name: string; email: string } }>;
  expenses?: Array<{ id: string; amount: number; amountCents?: number }>;
};

type User = {
  id: string;
  name: string;
  email: string;
};

const api = useApi();
const auth = useAuth();
const selectedTripState = useSelectedTrip();
const loading = ref(true);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const trips = ref<Trip[]>([]);
const availableUsers = ref<User[]>([]);
const errorMessage = ref("");
const form = reactive({
  name: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  userIds: [] as string[],
});

async function loadTrips() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const requests: Array<Promise<unknown>> = [api.get<Trip[]>("/trips")];

    if (auth.isAdmin.value) {
      requests.push(api.get<User[]>("/users"));
    }

    const [tripsData, usersData] = await Promise.all(requests);
    trips.value = tripsData as Trip[];
    availableUsers.value = (usersData as User[] | undefined) || [];
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

function resetForm() {
  form.name = "";
  form.startDate = new Date().toISOString().slice(0, 10);
  form.endDate = "";
  form.userIds = [];
  editingId.value = null;
}

function openCreateDialog() {
  resetForm();
  dialogOpen.value = true;
}

function openEditDialog(trip: Trip) {
  editingId.value = trip.id;
  form.name = trip.name;
  form.startDate = trip.startDate.slice(0, 10);
  form.endDate = trip.endDate ? trip.endDate.slice(0, 10) : "";
  form.userIds = (trip.users || []).map((tripUser) => tripUser.user.id);
  dialogOpen.value = true;
}

function normalizeTripPayload(tripId?: string) {
  return {
    ...(tripId ? { id: tripId } : {}),
    name: form.name.trim(),
    startDate: new Date(`${form.startDate}T12:00:00.000Z`).toISOString(),
    endDate: form.endDate ? new Date(`${form.endDate}T12:00:00.000Z`).toISOString() : null,
    users: form.userIds.map((userId) => ({
      userId,
      tripId: tripId || "pending-trip-id",
    })),
  };
}

async function saveTrip() {
  saving.value = true;
  errorMessage.value = "";

  try {
    if (editingId.value) {
      await api.put<Trip, Record<string, unknown>>("/trips", normalizeTripPayload(editingId.value));
    } else {
      await api.post<Trip, Record<string, unknown>>("/trips", normalizeTripPayload());
    }

    dialogOpen.value = false;
    resetForm();
    await loadTrips();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to save trip";
  } finally {
    saving.value = false;
  }
}

async function deleteTrip(trip: Trip) {
  deletingId.value = trip.id;
  errorMessage.value = "";

  try {
    await api.delete("/trips", { id: trip.id });
    trips.value = trips.value.filter((entry) => entry.id !== trip.id);
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to delete trip";
  } finally {
    deletingId.value = null;
  }
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
        <div class="d-flex flex-wrap ga-2">
          <v-btn v-if="auth.isAdmin.value" color="secondary" prepend-icon="mdi-bag-suitcase" @click="openCreateDialog">
            Add trip
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadTrips">
            Refresh
          </v-btn>
        </div>
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
              <div v-if="trip.endDate" class="text-caption text-medium-emphasis mb-3">
                Ends {{ new Date(trip.endDate).toLocaleDateString() }}
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
              <div class="mt-auto d-flex flex-wrap ga-2">
                <v-btn
                  v-if="auth.isAdmin.value"
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-pencil"
                  @click="openEditDialog(trip)"
                >
                  Edit
                </v-btn>
                <v-btn
                  v-if="auth.isAdmin.value"
                  color="error"
                  variant="tonal"
                  prepend-icon="mdi-delete-outline"
                  :loading="deletingId === trip.id"
                  @click="deleteTrip(trip)"
                >
                  Delete
                </v-btn>
                <v-btn
                  color="primary"
                  append-icon="mdi-arrow-right"
                  class="flex-grow-1"
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

  <TripEditorDialog
    v-model="dialogOpen"
    :saving="saving"
    :title="editingId ? 'Edit trip' : 'Create trip'"
    :submit-label="editingId ? 'Save trip' : 'Create trip'"
    :form="form"
    :users="availableUsers"
    @submit="saveTrip"
  />
</template>
