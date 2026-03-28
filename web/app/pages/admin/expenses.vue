<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

import { exportAdminExpensesToWorkbook } from "~/utils/admin-expense-report";
import CategoryIcon from "~/components/shared/CategoryIcon.vue";
import ExpenseReferenceSummary from "~/components/trip/ExpenseReferenceSummary.vue";
import { getExpenseDisplayAmount } from "~/utils/expense-reference";

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
  trip?: { id: string; name: string };
  user?: { id: string; name: string; email: string };
  category?: { id: string; name: string; icon: string };
};

const api = useApi();
const loading = ref(true);
const exporting = ref(false);
const errorMessage = ref("");
const expenses = ref<Expense[]>([]);
const search = ref("");
const tripFilter = ref("all");
const categoryFilter = ref("all");

async function loadExpenses() {
  loading.value = true;
  errorMessage.value = "";

  try {
    expenses.value = await api.get<Expense[]>("/expenses");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load all expenses";
  } finally {
    loading.value = false;
  }
}

const tripOptions = computed(() => [
  { title: "All trips", value: "all" },
  ...Array.from(new Set(expenses.value.map((expense) => expense.trip?.name).filter(Boolean)))
    .sort()
    .map((name) => ({ title: name as string, value: name as string })),
]);

const categoryOptions = computed(() => [
  { title: "All categories", value: "all" },
  ...Array.from(new Set(expenses.value.map((expense) => expense.category?.name).filter(Boolean)))
    .sort()
    .map((name) => ({ title: name as string, value: name as string })),
]);

const filteredExpenses = computed(() => {
  const query = search.value.trim().toLowerCase();

  return expenses.value.filter((expense) => {
    const matchesQuery = !query || [
      expense.trip?.name,
      expense.user?.name,
      expense.user?.email,
      expense.category?.name,
      expense.description,
      expense.location,
      expense.currency,
    ].some((value) => value?.toLowerCase().includes(query));

    const matchesTrip = tripFilter.value === "all" || expense.trip?.name === tripFilter.value;
    const matchesCategory = categoryFilter.value === "all" || expense.category?.name === categoryFilter.value;

    return matchesQuery && matchesTrip && matchesCategory;
  }).sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
});

const totalAmount = computed(() => filteredExpenses.value.reduce((sum, expense) => sum + getExpenseDisplayAmount(expense), 0));
const uniqueTrips = computed(() => new Set(filteredExpenses.value.map((expense) => expense.trip?.id).filter(Boolean)).size);
const uniquePayers = computed(() => new Set(filteredExpenses.value.map((expense) => expense.user?.id).filter(Boolean)).size);

const topCategories = computed(() => {
  const totals = filteredExpenses.value.reduce<Record<string, number>>((result, expense) => {
    const key = expense.category?.name || "Uncategorized";
    result[key] = (result[key] || 0) + getExpenseDisplayAmount(expense);
    return result;
  }, {});

  return Object.entries(totals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 3);
});

async function exportExpenses() {
  exporting.value = true;

  try {
    exportAdminExpensesToWorkbook(filteredExpenses.value);
  } finally {
    exporting.value = false;
  }
}

onMounted(loadExpenses);
</script>

<template>
  <v-container class="py-8">
    <div class="page-wrap">
      <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Admin</div>
          <h1 class="text-h4 mb-2">All expenses</h1>
          <p class="text-medium-emphasis mb-0">
            Inspect cross-trip spending, narrow it by trip or category, and export the current report slice.
          </p>
        </div>
        <v-btn
          color="secondary"
          prepend-icon="mdi-file-excel-outline"
          :loading="exporting"
          @click="exportExpenses"
        >
          Export report
        </v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-6">
        {{ errorMessage }}
      </v-alert>

      <v-row class="mb-6">
        <v-col cols="12" md="6" lg="3">
          <v-sheet color="surface" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Visible expenses</div>
            <div class="text-h5">{{ filteredExpenses.length }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-sheet color="surface" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Visible total</div>
            <div class="text-h5">EUR {{ totalAmount.toFixed(2) }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-sheet color="surface" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Trips</div>
            <div class="text-h5">{{ uniqueTrips }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="12" md="6" lg="3">
          <v-sheet color="surface" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Payers</div>
            <div class="text-h5">{{ uniquePayers }}</div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-card color="surface" class="pa-4 pa-md-6 mb-6">
        <v-row>
          <v-col cols="12" md="6" lg="4">
            <v-text-field
              v-model="search"
              label="Search report"
              prepend-inner-icon="mdi-magnify"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6" lg="4">
            <v-select
              v-model="tripFilter"
              label="Trip"
              :items="tripOptions"
              item-title="title"
              item-value="value"
              hide-details
            />
          </v-col>
          <v-col cols="12" md="6" lg="4">
            <v-select
              v-model="categoryFilter"
              label="Category"
              :items="categoryOptions"
              item-title="title"
              item-value="value"
              hide-details
            />
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-chip
            v-for="entry in topCategories"
            :key="entry.name"
            color="accent"
            variant="tonal"
          >
            {{ entry.name }} · EUR {{ entry.amount.toFixed(2) }}
          </v-chip>
          <v-chip v-if="!topCategories.length" variant="outlined">
            No category totals yet
          </v-chip>
        </div>
      </v-card>

      <v-card color="surface" class="pa-4 pa-md-6">
        <v-skeleton-loader v-if="loading" type="table-heading, table-tbody" />

        <template v-else>
          <div class="desktop-table-only table-shell">
            <v-table>
              <thead>
                <tr>
                  <th class="date-column">Date</th>
                  <th class="trip-column">Trip</th>
                  <th class="payer-column">Payer</th>
                  <th class="category-column">Category</th>
                  <th class="description-column">Description</th>
                  <th class="text-right amount-column">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="expense in filteredExpenses" :key="expense.id">
                  <td class="date-column">{{ new Date(expense.date).toLocaleDateString() }}</td>
                  <td class="trip-column">{{ expense.trip?.name || "Unknown trip" }}</td>
                  <td class="payer-column">{{ expense.user?.name || "Unknown payer" }}</td>
                  <td class="category-column">
                    <div class="d-flex align-center">
                      <CategoryIcon :icon="expense.category?.icon" />
                      <span class="ml-2">{{ expense.category?.name || "Uncategorized" }}</span>
                    </div>
                  </td>
                  <td class="description-column">{{ expense.description || "Expense" }}</td>
                  <td class="text-right amount-column">
                    <div>{{ expense.currency }} {{ expense.amount.toFixed(2) }}</div>
                    <div v-if="expense.currency !== 'EUR'" class="text-caption text-medium-emphasis">
                      EUR {{ getExpenseDisplayAmount(expense).toFixed(2) }}
                    </div>
                    <ExpenseReferenceSummary
                      :amount="expense.amount"
                      :currency="expense.currency"
                      :reference-eur-amount="expense.referenceEurAmount"
                      :reference-rate="expense.referenceRate"
                      :reference-rate-date="expense.referenceRateDate"
                      :reference-rate-provider="expense.referenceRateProvider"
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <div class="mobile-cards-only mobile-stack">
            <v-card
              v-for="expense in filteredExpenses"
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
                  <div v-if="expense.currency !== 'EUR'" class="text-caption text-medium-emphasis">
                    EUR {{ getExpenseDisplayAmount(expense).toFixed(2) }}
                  </div>
                </div>
              </div>

              <div class="meta-grid">
                <div>
                  <div class="text-caption text-medium-emphasis">Trip</div>
                  <div>{{ expense.trip?.name || "Unknown trip" }}</div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Payer</div>
                  <div>{{ expense.user?.name || "Unknown payer" }}</div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Category</div>
                  <div class="d-flex align-center">
                    <CategoryIcon :icon="expense.category?.icon" />
                    <span class="ml-2">{{ expense.category?.name || "Uncategorized" }}</span>
                  </div>
                </div>
                <div>
                  <div class="text-caption text-medium-emphasis">Location</div>
                  <div>{{ expense.location }}</div>
                </div>
              </div>

              <ExpenseReferenceSummary
                :amount="expense.amount"
                :currency="expense.currency"
                :reference-eur-amount="expense.referenceEurAmount"
                :reference-rate="expense.referenceRate"
                :reference-rate-date="expense.referenceRateDate"
                :reference-rate-provider="expense.referenceRateProvider"
              />
            </v-card>
          </div>

          <v-alert v-if="!filteredExpenses.length" type="info" variant="tonal" class="mt-4">
            No expenses match the current report filters.
          </v-alert>
        </template>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
.date-column,
.amount-column {
  white-space: nowrap;
}

.trip-column {
  max-width: 10rem;
}

.payer-column {
  max-width: 14rem;
}

.category-column {
  max-width: 10rem;
}

.description-column {
  max-width: 14rem;
}

.amount-column {
  min-width: 7.5rem;
}

.eur-view-column :deep(.text-caption) {
  white-space: normal;
}
</style>
