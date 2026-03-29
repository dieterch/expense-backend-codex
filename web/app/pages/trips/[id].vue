<script setup lang="ts">
definePageMeta({
  middleware: "auth",
});

import ExpenseEditorDialog from "~/components/trip/ExpenseEditorDialog.vue";
import EstimationSettingsDialog from "~/components/trip/EstimationSettingsDialog.vue";
import ExpenseReferenceSummary from "~/components/trip/ExpenseReferenceSummary.vue";
import TripSettlementDialog from "~/components/trip/TripSettlementDialog.vue";
import TripStatsDialog from "~/components/trip/TripStatsDialog.vue";
import CategoryIcon from "~/components/shared/CategoryIcon.vue";
import {
  DEFAULT_ESTIMATION_SETTINGS,
  estimateExpenseEur,
  estimateTripTotal,
  type EstimationSettings,
} from "~/utils/expense-estimation";
import { getExpenseDisplayAmount } from "~/utils/expense-reference";
import { calculateTripSettlement } from "~/utils/trip-settlement";
import { calculateTripStats } from "~/utils/trip-stats";

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  users?: Array<{ user: { id: string; name: string; email: string; settlementFactor?: number } }>;
};

type TripUser = {
  user: {
    id: string;
    name: string;
    email: string;
    settlementFactor?: number;
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

type ExpenseDisplay = Expense & {
  manualReferenceEurAmount?: number | null;
  manualRate?: number | null;
  manualRateProvider?: string | null;
};

type Category = {
  id: string;
  name: string;
  icon: string;
};

type Currency = {
  name: string;
  displayName?: string;
  symbol: string;
  factor: number;
  enabled: boolean;
};

const route = useRoute();
const api = useApi();
const auth = useAuth();
const selectedTripState = useSelectedTrip();
const estimationSettingsState = useEstimationSettings();

estimationSettingsState.init();

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const estimationSaving = ref(false);
const errorMessage = ref("");
const formErrorMessage = ref("");
const trip = ref<Trip | null>(null);
const participants = ref<TripUser[]>([]);
const expenses = ref<Expense[]>([]);
const categories = ref<Category[]>([]);
const currencies = ref<Currency[]>([]);
const editorOpen = ref(false);
const statsOpen = ref(false);
const settlementOpen = ref(false);
const estimationSettingsOpen = ref(false);
const editingExpenseId = ref<string | null>(null);
const deleteTarget = ref<Expense | null>(null);
const lastCreateDefaults = reactive({
  currency: "EUR",
  location: "",
});

const form = reactive({
  amount: 0,
  currency: "EUR",
  date: new Date().toISOString().slice(0, 10),
  location: "",
  description: "",
  categoryId: "",
  userId: "",
});

const estimationForm = reactive({
  globalMarkupPercent: DEFAULT_ESTIMATION_SETTINGS.defaultMarkupBps / 100,
  fixedFeeAmount: DEFAULT_ESTIMATION_SETTINGS.fixedFeeCents / 100,
  weekendMarkupPercent: DEFAULT_ESTIMATION_SETTINGS.weekendSurchargeBps / 100,
  currencyFields: [] as Array<{ currency: string; markupPercent: number | null }>,
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

function resetForm(options: { preserveRecent?: boolean } = {}) {
  form.amount = 0;
  form.currency = options.preserveRecent
    ? lastCreateDefaults.currency || currencies.value[0]?.name || "EUR"
    : currencies.value[0]?.name || "EUR";
  form.date = new Date().toISOString().slice(0, 10);
  form.location = options.preserveRecent ? lastCreateDefaults.location : "";
  form.description = "";
  form.categoryId = categories.value[0]?.id || "";
  form.userId = auth.user.value?.id || participants.value[0]?.user.id || "";
  editingExpenseId.value = null;
  formErrorMessage.value = "";
}

function openCreateDialog() {
  resetForm({ preserveRecent: true });
  if (!availableCurrencies.value.some((currency) => currency.name === form.currency) && availableCurrencies.value[0]) {
    form.currency = availableCurrencies.value[0].name;
  }
  editorOpen.value = true;
}

function populateEstimationForm() {
  const settings = estimationSettingsState.settings.value;
  const foreignCurrencies = Array.from(
    new Set(
      currencies.value
        .filter((entry) => entry.enabled)
        .map((entry) => entry.name)
        .filter((currency) => currency !== "EUR"),
    ),
  );

  estimationForm.globalMarkupPercent = settings.defaultMarkupBps / 100;
  estimationForm.fixedFeeAmount = settings.fixedFeeCents / 100;
  estimationForm.weekendMarkupPercent = settings.weekendSurchargeBps / 100;
  estimationForm.currencyFields = foreignCurrencies.map((currency) => ({
    currency,
    markupPercent: typeof settings.currencyMarkupOverrides[currency] === "number"
      ? settings.currencyMarkupOverrides[currency] / 100
      : null,
  }));
}

function openEstimationSettingsDialog() {
  populateEstimationForm();
  estimationSettingsOpen.value = true;
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
      lastCreateDefaults.currency = payload.currency;
      lastCreateDefaults.location = payload.location;
    }

    editorOpen.value = false;
    resetForm({ preserveRecent: true });
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

function buildEstimationSettingsFromForm(): EstimationSettings {
  return {
    defaultMarkupBps: Math.round(estimationForm.globalMarkupPercent * 100),
    fixedFeeCents: Math.round(estimationForm.fixedFeeAmount * 100),
    weekendSurchargeBps: Math.round(estimationForm.weekendMarkupPercent * 100),
    currencyMarkupOverrides: Object.fromEntries(
      estimationForm.currencyFields
        .filter((entry) => entry.markupPercent !== null && Number.isFinite(entry.markupPercent))
        .map((entry) => [entry.currency, Math.round((entry.markupPercent as number) * 100)]),
    ),
  };
}

function saveEstimationSettings() {
  estimationSaving.value = true;

  try {
    estimationSettingsState.persist(buildEstimationSettingsFromForm());
    estimationSettingsOpen.value = false;
  } finally {
    estimationSaving.value = false;
  }
}

function resetEstimationSettings() {
  estimationSettingsState.reset();
  populateEstimationForm();
}

function getExpenseEstimate(expense: Expense) {
  return estimateExpenseEur(getDisplayExpense(expense), estimationSettingsState.settings.value);
}

function getCurrencyManualRate(currencyCode: string) {
  const currency = currencies.value.find((entry) => entry.name === currencyCode);

  if (!currency || !Number.isFinite(currency.factor) || currency.factor <= 0) {
    return null;
  }

  return currency.factor;
}

function getDisplayExpense(expense: Expense): ExpenseDisplay {
  if (expense.currency === "EUR") {
    return expense;
  }

  if (
    typeof expense.referenceEurAmount === "number" &&
    typeof expense.referenceRate === "number" &&
    !!expense.referenceRateDate
  ) {
    return expense;
  }

  const manualRate = getCurrencyManualRate(expense.currency);

  if (typeof manualRate !== "number") {
    return expense;
  }

  return {
    ...expense,
    manualRate,
    manualRateProvider: "Configured manual exchange rate",
    manualReferenceEurAmount: expense.amount * manualRate,
  };
}

const sortedExpenses = computed(() =>
  [...expenses.value].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
);
const displayExpenses = computed(() => sortedExpenses.value.map((expense) => getDisplayExpense(expense)));
const availableCurrencies = computed(() => {
  const enabledCurrencies = currencies.value.filter((currency) => currency.enabled);

  if (!editingExpenseId.value) {
    return enabledCurrencies;
  }

  const currentExpense = expenses.value.find((expense) => expense.id === editingExpenseId.value);
  if (!currentExpense || enabledCurrencies.some((currency) => currency.name === currentExpense.currency)) {
    return enabledCurrencies;
  }

  const currentCurrency = currencies.value.find((currency) => currency.name === currentExpense.currency);
  return currentCurrency ? [...enabledCurrencies, currentCurrency] : enabledCurrencies;
});

const stats = computed(() => calculateTripStats(displayExpenses.value, trip.value?.startDate));
const settlement = computed(() => calculateTripSettlement(participants.value, displayExpenses.value));
const totalAmount = computed(() => stats.value.totalAmount.toFixed(2));
const estimatedTripTotal = computed(() =>
  estimateTripTotal(displayExpenses.value, estimationSettingsState.settings.value).toFixed(2),
);
const hasForeignCurrencyExpenses = computed(() => sortedExpenses.value.some((expense) => expense.currency !== "EUR"));
const canEstimateForeignCurrency = computed(() => currencies.value.some((currency) => currency.name !== "EUR"));

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
                  <div class="trip-total-row">
                    <div class="text-caption text-uppercase">Tracked total</div>
                    <div class="text-h4">€ {{ totalAmount }}</div>
                  </div>
                  <div v-if="hasForeignCurrencyExpenses" class="trip-total-row trip-total-row-secondary">
                    <div class="text-caption text-uppercase">Estimated bank total</div>
                    <div class="text-h6">€ {{ estimatedTripTotal }}</div>
                  </div>
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
                  class="ml-auto trip-action-inline"
                  @click="statsOpen = true"
                >
                  Statistics
                </v-btn>
                <v-btn
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-scale-balance"
                  class="trip-action-inline"
                  @click="settlementOpen = true"
                >
                  Settlement
                </v-btn>
                <v-btn
                  v-if="canEstimateForeignCurrency"
                  variant="tonal"
                  color="secondary"
                  prepend-icon="mdi-tune-vertical"
                  class="trip-action-inline"
                  @click="openEstimationSettingsDialog"
                >
                  Estimation
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

          <div class="desktop-table-only table-shell">
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
                <tr v-for="expense in displayExpenses" :key="expense.id">
                  <td>
                    <div class="font-weight-medium">{{ expense.description || "Expense" }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ new Date(expense.date).toLocaleDateString() }}
                    </div>
                  </td>
                  <td>{{ expense.user?.name || "Unknown" }}</td>
                  <td>
                    <div class="d-flex align-center">
                      <CategoryIcon :icon="expense.category?.icon" />
                      <span class="ml-2">{{ expense.category?.name || "Uncategorized" }}</span>
                    </div>
                  </td>
                  <td>{{ expense.location }}</td>
                  <td class="text-right">
                    <strong>{{ expense.currency }} {{ expense.amount.toFixed(2) }}</strong>
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
                      :manual-reference-eur-amount="expense.manualReferenceEurAmount"
                      :manual-rate="expense.manualRate"
                      :manual-rate-provider="expense.manualRateProvider"
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
          </div>

          <div class="mobile-cards-only mobile-stack">
            <v-card
              v-for="expense in displayExpenses"
              :key="expense.id"
              color="background"
              class="record-card pa-4"
            >
              <div class="d-flex justify-space-between ga-3 mb-3">
                <div>
                  <div class="font-weight-medium">{{ expense.description || "Expense" }}</div>
                  <div class="text-caption text-medium-emphasis">{{ new Date(expense.date).toLocaleDateString() }}</div>
                </div>
                <div class="text-right">
                  <div class="font-weight-bold">{{ expense.currency }} {{ expense.amount.toFixed(2) }}</div>
                  <div class="text-caption text-medium-emphasis">EUR {{ getExpenseDisplayAmount(expense).toFixed(2) }}</div>
                </div>
              </div>

              <div class="meta-grid mb-3">
                <div>
                  <div class="text-caption text-medium-emphasis">Payer</div>
                  <div>{{ expense.user?.name || "Unknown" }}</div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Location</div>
                  <div>{{ expense.location }}</div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Category</div>
                  <div class="d-flex align-center">
                    <CategoryIcon :icon="expense.category?.icon" />
                    <span class="ml-2">{{ expense.category?.name || "Uncategorized" }}</span>
                  </div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">EUR view</div>
                  <div>EUR {{ getExpenseDisplayAmount(expense).toFixed(2) }}</div>
                </div>
              </div>

              <ExpenseReferenceSummary
                :amount="expense.amount"
                :currency="expense.currency"
                :reference-eur-amount="expense.referenceEurAmount"
                :reference-rate="expense.referenceRate"
                :reference-rate-date="expense.referenceRateDate"
                :reference-rate-provider="expense.referenceRateProvider"
                :manual-reference-eur-amount="expense.manualReferenceEurAmount"
                :manual-rate="expense.manualRate"
                :manual-rate-provider="expense.manualRateProvider"
              />

              <div class="d-flex flex-wrap ga-2 mt-4">
                <v-btn
                  v-if="canManageExpense(expense)"
                  size="small"
                  variant="tonal"
                  color="primary"
                  prepend-icon="mdi-pencil"
                  @click="openEditDialog(expense)"
                >
                  Edit
                </v-btn>
                <v-btn
                  v-if="canManageExpense(expense)"
                  size="small"
                  variant="tonal"
                  color="error"
                  prepend-icon="mdi-delete-outline"
                  @click="deleteTarget = expense"
                >
                  Delete
                </v-btn>
                <span v-if="!canManageExpense(expense)" class="text-caption text-medium-emphasis">View only</span>
              </div>
            </v-card>
          </div>

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
    :currencies="availableCurrencies"
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

  <TripSettlementDialog
    v-model="settlementOpen"
    :total-amount="settlement.totalAmount"
    :factor-total="settlement.factorTotal"
    :members="settlement.members"
    :payments="settlement.payments"
  />

  <EstimationSettingsDialog
    v-model="estimationSettingsOpen"
    :saving="estimationSaving"
    :form="estimationForm"
    @submit="saveEstimationSettings"
    @reset="resetEstimationSettings"
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

<style scoped>
.trip-total-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: 1.5rem;
  row-gap: 0.25rem;
}

.trip-total-row-secondary {
  margin-top: 1rem;
}

.trip-action-inline {
  white-space: nowrap;
}
</style>
