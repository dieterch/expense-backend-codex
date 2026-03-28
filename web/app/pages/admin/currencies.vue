<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

import CurrencyEditorDialog from "~/components/admin/CurrencyEditorDialog.vue";

type Currency = {
  name: string;
  displayName: string;
  symbol: string;
  factor: number;
  enabled: boolean;
};

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const importing = ref(false);
const deletingId = ref<string | null>(null);
const errorMessage = ref("");
const successMessage = ref("");
const search = ref("");
const dialogOpen = ref(false);
const editingName = ref<string | null>(null);
const currencies = ref<Currency[]>([]);

const form = reactive({
  name: "",
  displayName: "",
  symbol: "",
  factor: 1,
  enabled: true,
});

async function loadCurrencies() {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    currencies.value = (await api.get<Currency[]>("/currency")).sort((left, right) => left.name.localeCompare(right.name));
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load currencies";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.name = "";
  form.displayName = "";
  form.symbol = "";
  form.factor = 1;
  form.enabled = true;
  editingName.value = null;
}

function openCreateDialog() {
  resetForm();
  dialogOpen.value = true;
}

function openEditDialog(currency: Currency) {
  editingName.value = currency.name;
  form.name = currency.name;
  form.displayName = currency.displayName;
  form.symbol = currency.symbol;
  form.factor = currency.factor;
  form.enabled = currency.enabled;
  dialogOpen.value = true;
}

async function saveCurrency() {
  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    if (editingName.value) {
      const updated = await api.put<Currency, Record<string, unknown>>("/currency", {
        name: editingName.value,
        displayName: form.displayName.trim(),
        symbol: form.symbol.trim(),
        factor: Number(form.factor),
        enabled: form.enabled,
      });
      currencies.value = currencies.value.map((entry) => (entry.name === editingName.value ? updated : entry));
    } else {
      const created = await api.post<Currency, Record<string, unknown>>("/currency", {
        name: form.name.trim().toUpperCase(),
        displayName: form.displayName.trim(),
        symbol: form.symbol.trim(),
        factor: Number(form.factor),
        enabled: form.enabled,
      });
      currencies.value = [...currencies.value, created].sort((left, right) => left.name.localeCompare(right.name));
    }

    dialogOpen.value = false;
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to save currency";
  } finally {
    saving.value = false;
  }
}

async function deleteCurrency(currency: Currency) {
  deletingId.value = currency.name;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await api.delete("/currency", { name: currency.name });
    currencies.value = currencies.value.filter((entry) => entry.name !== currency.name);
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to delete currency";
  } finally {
    deletingId.value = null;
  }
}

async function importCurrencies() {
  importing.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const result = await api.post<{
      createdCount: number;
      updatedCount: number;
      totalCount: number;
      currencies: Currency[];
    }, Record<string, never>>("/currency/import", {});

    currencies.value = result.currencies;
    successMessage.value = `Imported ${result.createdCount} new currencies and refreshed ${result.updatedCount} existing entries.`;
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to import currencies";
  } finally {
    importing.value = false;
  }
}

async function saveCurrencyEnabled(currency: Currency, nextValue: boolean | null) {
  if (typeof nextValue !== "boolean") {
    return;
  }

  const previousValue = currency.enabled;
  currency.enabled = nextValue;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const updated = await api.put<Currency, Record<string, unknown>>("/currency", {
      name: currency.name,
      displayName: currency.displayName,
      symbol: currency.symbol,
      factor: currency.factor,
      enabled: nextValue,
    });
    currencies.value = currencies.value.map((entry) => (entry.name === currency.name ? updated : entry));
  } catch (error: any) {
    currency.enabled = previousValue;
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to update currency";
  }
}

const filteredCurrencies = computed(() => {
  const query = search.value.trim().toLowerCase();

  return currencies.value.filter((currency) => (
    !query ||
    currency.name.toLowerCase().includes(query) ||
    currency.displayName.toLowerCase().includes(query)
  ));
});

function formatFactor(factor: number) {
  return factor.toFixed(3);
}

onMounted(loadCurrencies);
</script>

<template>
  <v-container class="py-8">
    <div class="page-wrap">
      <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Admin</div>
          <h1 class="text-h4 mb-2">Currencies</h1>
          <p class="text-medium-emphasis mb-0">
            Maintain the exchange reference table that powers normalized reporting and future FX work.
          </p>
        </div>
        <div class="d-flex flex-wrap ga-3">
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-database-import-outline"
            :loading="importing"
            @click="importCurrencies"
          >
            Import from Frankfurter
          </v-btn>
          <v-btn color="secondary" prepend-icon="mdi-currency-usd" @click="openCreateDialog">
            Add currency
          </v-btn>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-6">
        {{ errorMessage }}
      </v-alert>

      <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-6">
        {{ successMessage }}
      </v-alert>

      <v-card color="surface" class="pa-4 pa-md-6">
        <v-skeleton-loader v-if="loading" type="table-heading, table-tbody" />

        <template v-else>
          <v-text-field
            v-model="search"
            label="Search code or name"
            prepend-inner-icon="mdi-magnify"
            hide-details
            class="mb-4"
          />

          <v-table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Symbol</th>
                <th class="text-center">Enabled</th>
                <th class="text-right">Factor</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="currency in filteredCurrencies" :key="currency.name">
                <td>{{ currency.name }}</td>
                <td>{{ currency.displayName }}</td>
                <td>{{ currency.symbol }}</td>
                <td class="text-center">
                  <v-checkbox-btn
                    :model-value="currency.enabled"
                    color="secondary"
                    @update:model-value="saveCurrencyEnabled(currency, $event)"
                  />
                </td>
                <td class="text-right">{{ formatFactor(currency.factor) }}</td>
                <td class="text-right">
                  <div class="d-inline-flex ga-2">
                    <v-btn size="small" variant="tonal" color="primary" @click="openEditDialog(currency)">
                      Edit
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="error"
                      :loading="deletingId === currency.name"
                      @click="deleteCurrency(currency)"
                    >
                      Delete
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert v-if="!currencies.length" type="info" variant="tonal" class="mt-4">
            No currencies yet.
          </v-alert>
          <v-alert v-else-if="!filteredCurrencies.length" type="info" variant="tonal" class="mt-4">
            No currencies match the current search.
          </v-alert>
        </template>
      </v-card>
    </div>
  </v-container>

  <CurrencyEditorDialog
    v-model="dialogOpen"
    :saving="saving"
    :title="editingName ? 'Edit currency' : 'Create currency'"
    :submit-label="editingName ? 'Save currency' : 'Create currency'"
    :form="form"
    :is-editing="Boolean(editingName)"
    @submit="saveCurrency"
  />
</template>
