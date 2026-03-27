<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import ExpenseEditorDialog from "~/components/trip/ExpenseEditorDialog.vue";
import ExpenseReferenceSummary from "~/components/trip/ExpenseReferenceSummary.vue";
import TripStatsDialog from "~/components/trip/TripStatsDialog.vue";
import { getExpenseDisplayAmount } from "~/utils/expense-reference";
import { calculateTripStats } from "~/utils/trip-stats";

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
  referenceRate?: number | null;
  referenceRateProvider?: string | null;
  referenceRateDate?: string | null;
  referenceEurAmount?: number | null;
  referenceEurAmountCents?: number | null;
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
const selectedTripState = useSelectedTrip();

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const formErrorMessage = ref("");
const trip = ref<Trip | null>(null);
const participants = ref<TripUser[]>([]);
const expenses = ref<Expense[]>([]);
const categories = ref<Category[]>([]);
const currencies = ref<Currency[]>([]);
const editorOpen = ref(false);
const statsOpen = ref(false);
const editingExpenseId = ref<string | null>(null);
const deleteTarget = ref<Expense | null>(null);

const form = reactive({
  amount: 0,
  currency: "EUR",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  description: "",
  categoryId: "",
  userId: "",
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
    currencies.value = [...currenciesData].sort((left, right) => left.name.localeCompare(right.name));

    if (!trip.value) {
      throw new Error("Trip not found");
    }

    selectedTripState.setSelectedTrip({
      id: trip.value.id,
      name: trip.value.name,
    });

    if (!form.categoryId && categories.value[0]) {
      form.categoryId = categories.value[0].id;
    }

    if (!currencies.value.some((currency) => currency.name === form.currency) && currencies.value[0]) {
      form.currency = currencies.value[0].name;
    }

    if (!form.userId) {
      form.userId = auth.user.value?.id || participants.value[0]?.user.id || "";
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load trip details";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.amount = 0;
  form.currency = currencies.value[0]?.name || "EUR";
  form.date = new Date().toISOString().slice(0, 10);
  form.location = "";
  form.description = "";
  form.categoryId = categories.value[0]?.id || "";
  form.userId = auth.user.value?.id || participants.value[0]?.user.id || "";
  editingExpenseId.value = null;
  formErrorMessage.value = "";
}

function openCreateDialog() {
  resetForm();
  editorOpen.value = true;
}

function openEditDialog(expense: Expense) {
  editingExpenseId.value = expense.id;
  form.amount = expense.amount;
  form.currency = expense.currency;
  form.date = expense.date.slice(0, 10);
  form.location = expense.location;
  form.description = expense.description || "";
  form.categoryId = expense.category?.id || categories.value[0]?.id || "";
  form.userId = expense.user?.id || auth.user.value?.id || "";
  formErrorMessage.value = "";
  editorOpen.value = true;
}

function canManageExpense(expense: Expense) {
  return auth.isAdmin.value || expense.user?.id === auth.user.value?.id;
}

function hydrateExpense(expense: Expense) {
  const resolvedUserId = expense.user?.id || form.userId;
  const resolvedCategoryId = expense.category?.id || form.categoryId;

  return {
    ...expense,
    user: participants.value.find((entry) => entry.user.id === resolvedUserId)?.user || expense.user,
    category: categories.value.find((entry) => entry.id === resolvedCategoryId) || expense.category,
  };
}

async function submitExpense() {
  if (!auth.user.value || !trip.value) {
    return;
  }

  if (
    form.amount <= 0 ||
    !form.currency ||
    !form.date ||
    !form.location.trim() ||
    !form.categoryId ||
    !form.userId
  ) {
    formErrorMessage.value = "Fill in amount, payer, category, date, and location before saving.";
    return;
  }

  saving.value = true;
  formErrorMessage.value = "";

  try {
    const payload = {
      amount: Number(form.amount),
      currency: form.currency,
      date: new Date(`${form.date}T12:00:00.000Z`).toISOString(),
      location: form.location.trim(),
      description: form.description || undefined,
      tripId: trip.value.id,
      userId: auth.isAdmin.value ? form.userId : auth.user.value.id,
      categoryId: form.categoryId,
    };

    if (editingExpenseId.value) {
      const updated = await api.put<Expense, Record<string, unknown>>("/expenses", {
        id: editingExpenseId.value,
        ...payload,
      });

      expenses.value = expenses.value.map((expense) =>
        expense.id === editingExpenseId.value ? hydrateExpense(updated) : expense,
      );
    } else {
      const created = await api.post<Expense, Record<string, unknown>>("/expenses", payload);
      expenses.value = [hydrateExpense(created), ...expenses.value];
    }

    editorOpen.value = false;
    resetForm();
  } catch (error: any) {
    formErrorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to save expense";
  } finally {
    saving.value = false;
  }
}

async function deleteExpense() {
  if (!deleteTarget.value) {
    return;
  }

  deleting.value = true;
  errorMessage.value = "";

  try {
    await api.delete("/expenses", { id: deleteTarget.value.id });
    expenses.value = expenses.value.filter((expense) => expense.id !== deleteTarget.value?.id);
    deleteTarget.value = null;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to delete expense";
  } finally {
    deleting.value = false;
  }
}

const sortedExpenses = computed(() =>
  [...expenses.value].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
);

const stats = computed(() => calculateTripStats(sortedExpenses.value, trip.value?.startDate));
const totalAmount = computed(() => stats.value.totalAmount.toFixed(2));
const hasForeignCurrencyExpenses = computed(() => sortedExpenses.value.some((expense) => expense.currency !== "EUR"));

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
                  <div class="text-caption text-uppercase mb-1">
                    {{ hasForeignCurrencyExpenses ? "Tracked total (EUR ref)" : "Tracked total" }}
                  </div>
                  <div class="text-h4">€ {{ totalAmount }}</div>
                </v-sheet>
              </div>

              <div class="d-flex flex-wrap ga-2 align-center">
                <v-chip
                  v-for="participant in participants"
                  :key="participant.user.id"
                  variant="outlined"
                >
                  {{ participant.user.name }}
                </v-chip>
                <v-btn
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-chart-donut"
                  class="ml-auto"
                  @click="statsOpen = true"
                >
                  Statistics
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" lg="4">
            <v-card color="surface" class="pa-6">
              <div class="text-h6 mb-2">Expense actions</div>
              <p class="text-medium-emphasis mb-4">
                Capture new shared costs, then edit or remove your own entries from the history below.
              </p>
              <v-btn
                color="secondary"
                block
                size="large"
                prepend-icon="mdi-plus"
                @click="openCreateDialog"
              >
                Add expense
              </v-btn>
              <v-alert
                v-if="!categories.length || !currencies.length"
                type="warning"
                variant="tonal"
                class="mt-4"
              >
                Categories or currencies are missing, so expense editing is temporarily unavailable.
              </v-alert>
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
                <th class="text-right">EUR view</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in sortedExpenses" :key="expense.id">
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
                <td class="text-right">
                  <div class="font-weight-medium">EUR {{ getExpenseDisplayAmount(expense).toFixed(2) }}</div>
                  <ExpenseReferenceSummary
                    :amount="expense.amount"
                    :currency="expense.currency"
                    :reference-eur-amount="expense.referenceEurAmount"
                    :reference-rate="expense.referenceRate"
                    :reference-rate-date="expense.referenceRateDate"
                    :reference-rate-provider="expense.referenceRateProvider"
                  />
                </td>
                <td class="text-right">
                  <div v-if="canManageExpense(expense)" class="d-inline-flex ga-2">
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="primary"
                      prepend-icon="mdi-pencil"
                      @click="openEditDialog(expense)"
                    >
                      Edit
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="error"
                      prepend-icon="mdi-delete-outline"
                      @click="deleteTarget = expense"
                    >
                      Delete
                    </v-btn>
                  </div>
                  <span v-else class="text-caption text-medium-emphasis">View only</span>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert
            v-if="!sortedExpenses.length"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            No expenses yet. Add the first one to start tracking this trip.
          </v-alert>
        </v-card>
      </template>
    </div>
  </v-container>

  <ExpenseEditorDialog
    v-model="editorOpen"
    :saving="saving"
    :title="editingExpenseId ? 'Edit expense' : 'Add expense'"
    :submit-label="editingExpenseId ? 'Save changes' : 'Create expense'"
    :categories="categories"
    :currencies="currencies"
    :participants="participants"
    :form="form"
    :is-admin="auth.isAdmin.value"
    :current-user-name="auth.user.value?.name || 'Current user'"
    @submit="submitExpense"
  />

  <TripStatsDialog
    v-model="statsOpen"
    :total-amount="stats.totalAmount"
    :expense-count="stats.expenseCount"
    :unique-payers="stats.uniquePayers"
    :duration-days="stats.durationDays"
    :average-per-day="stats.averagePerDay"
    :category-breakdown="stats.categoryBreakdown"
  />

  <v-dialog
    :model-value="Boolean(deleteTarget)"
    max-width="480"
    @update:model-value="(value) => { if (!value) deleteTarget = null; }"
  >
    <v-card color="surface" class="pa-6">
      <div class="text-h5 mb-2">Delete expense?</div>
      <p class="text-medium-emphasis mb-6">
        This will permanently remove
        <strong>{{ deleteTarget?.description || "this expense" }}</strong>.
      </p>
      <div class="d-flex justify-end ga-3">
        <v-btn variant="tonal" color="primary" @click="deleteTarget = null">
          Cancel
        </v-btn>
        <v-btn color="error" :loading="deleting" @click="deleteExpense">
          Confirm delete
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <v-snackbar
    :model-value="Boolean(formErrorMessage)"
    color="error"
    timeout="3000"
    @update:model-value="formErrorMessage = ''"
  >
    {{ formErrorMessage }}
  </v-snackbar>
</template>
