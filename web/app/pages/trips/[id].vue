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
};

type TripUser = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type Expense = {
  id: string;
  amount: number;
  amountCents: number;
  currency: string;
  date: string;
  location: string;
  description?: string | null;
  user?: { id: string; name: string; email: string };
  category?: { id: string; name: string; icon: string };
};

type Category = {
  id: string;
  name: string;
  icon: string;
};

type Currency = {
  name: string;
  symbol: string;
  factor: number;
};

const route = useRoute();
const api = useApi();
const auth = useAuth();

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const trip = ref<Trip | null>(null);
const participants = ref<TripUser[]>([]);
const expenses = ref<Expense[]>([]);
const categories = ref<Category[]>([]);
const currencies = ref<Currency[]>([]);

const form = reactive({
  amount: 0,
  currency: "EUR",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  description: "",
  categoryId: "",
});

async function loadTrip() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const tripId = String(route.params.id);
    const [tripsData, expensesData, participantsData, categoriesData, currenciesData] = await Promise.all([
      api.get<Trip[]>("/trips"),
      api.post<Expense[], { id: string }>("/tripexpenses", { id: tripId }),
      api.post<TripUser[], { id: string }>("/tripusers", { id: tripId }),
      api.get<Category[]>("/categories"),
      api.get<Currency[]>("/currency"),
    ]);

    trip.value = tripsData.find((entry) => entry.id === tripId) || null;
    participants.value = participantsData;
    expenses.value = expensesData;
    categories.value = categoriesData;
    currencies.value = currenciesData;

    if (!trip.value) {
      throw new Error("Trip not found");
    }

    if (!form.categoryId && categories.value[0]) {
      form.categoryId = categories.value[0].id;
    }

    if (!currencies.value.some((currency) => currency.name === form.currency) && currencies.value[0]) {
      form.currency = currencies.value[0].name;
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load trip details";
  } finally {
    loading.value = false;
  }
}

async function createExpense() {
  if (!auth.user.value || !trip.value) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";

  try {
    const created = await api.post<Expense, Record<string, unknown>>("/expenses", {
      amount: Number(form.amount),
      currency: form.currency,
      date: new Date(`${form.date}T12:00:00.000Z`).toISOString(),
      location: form.location,
      description: form.description || undefined,
      tripId: trip.value.id,
      userId: auth.user.value.id,
      categoryId: form.categoryId,
    });

    expenses.value = [created, ...expenses.value];
    form.amount = 0;
    form.location = "";
    form.description = "";
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to create expense";
  } finally {
    saving.value = false;
  }
}

const totalAmount = computed(() =>
  expenses.value.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2),
);

onMounted(loadTrip);
</script>

<template>
  <v-container class="py-8">
    <div class="page-wrap">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        class="mb-4"
        to="/trips"
      >
        Back to trips
      </v-btn>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-6"
      >
        {{ errorMessage }}
      </v-alert>

      <template v-if="loading">
        <v-skeleton-loader type="article, list-item-three-line" />
      </template>

      <template v-else-if="trip">
        <v-row class="mb-6">
          <v-col cols="12" lg="8">
            <v-card color="surface" class="pa-6">
              <div class="d-flex flex-wrap justify-space-between align-start ga-4 mb-4">
                <div>
                  <div class="text-overline text-secondary page-title font-weight-bold">Trip detail</div>
                  <h1 class="text-h3 mb-2">{{ trip.name }}</h1>
                  <div class="text-medium-emphasis">
                    Starts {{ new Date(trip.startDate).toLocaleDateString() }}
                  </div>
                </div>
                <v-sheet color="primary" rounded="xl" class="pa-4 text-white">
                  <div class="text-caption text-uppercase mb-1">Tracked total</div>
                  <div class="text-h4">€ {{ totalAmount }}</div>
                </v-sheet>
              </div>

              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="participant in participants"
                  :key="participant.user.id"
                  variant="outlined"
                >
                  {{ participant.user.name }}
                </v-chip>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" lg="4">
            <v-card color="surface" class="pa-6">
              <div class="text-h6 mb-4">Add expense</div>
              <v-form @submit.prevent="createExpense">
                <v-text-field
                  v-model.number="form.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Amount"
                  prepend-inner-icon="mdi-cash"
                  class="mb-3"
                />
                <v-select
                  v-model="form.currency"
                  :items="currencies"
                  item-title="name"
                  item-value="name"
                  label="Currency"
                  prepend-inner-icon="mdi-currency-eur"
                  class="mb-3"
                />
                <v-select
                  v-model="form.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Category"
                  prepend-inner-icon="mdi-shape-outline"
                  class="mb-3"
                />
                <v-text-field
                  v-model="form.date"
                  type="date"
                  label="Date"
                  prepend-inner-icon="mdi-calendar"
                  class="mb-3"
                />
                <v-text-field
                  v-model="form.location"
                  label="Location"
                  prepend-inner-icon="mdi-map-marker-outline"
                  class="mb-3"
                />
                <v-textarea
                  v-model="form.description"
                  label="Description"
                  rows="3"
                  class="mb-4"
                />
                <v-btn
                  type="submit"
                  color="secondary"
                  block
                  size="large"
                  :loading="saving"
                >
                  Save expense
                </v-btn>
              </v-form>
            </v-card>
          </v-col>
        </v-row>

        <v-card color="surface" class="pa-4 pa-md-6">
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-h5">Expenses</div>
            <v-chip color="accent" variant="tonal">
              {{ expenses.length }} records
            </v-chip>
          </div>

          <v-table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Payer</th>
                <th>Category</th>
                <th>Location</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in expenses" :key="expense.id">
                <td>
                  <div class="font-weight-medium">{{ expense.description || "Expense" }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ new Date(expense.date).toLocaleDateString() }}
                  </div>
                </td>
                <td>{{ expense.user?.name || "Unknown" }}</td>
                <td>{{ expense.category?.name || "Uncategorized" }}</td>
                <td>{{ expense.location }}</td>
                <td class="text-right">
                  <strong>{{ expense.currency }} {{ expense.amount.toFixed(2) }}</strong>
                  <div class="text-caption text-medium-emphasis">{{ expense.amountCents }} cents</div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </template>
    </div>
  </v-container>
</template>
