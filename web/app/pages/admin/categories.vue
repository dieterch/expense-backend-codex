<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

import CategoryEditorDialog from "~/components/admin/CategoryEditorDialog.vue";

type Category = {
  id: string;
  name: string;
  icon: string;
  expenses?: Array<unknown>;
};

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const errorMessage = ref("");
const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const categories = ref<Category[]>([]);

const form = reactive({
  name: "",
  icon: "",
});

async function loadCategories() {
  loading.value = true;
  errorMessage.value = "";

  try {
    categories.value = await api.get<Category[]>("/categories");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load categories";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.name = "";
  form.icon = "";
  editingId.value = null;
}

function openCreateDialog() {
  resetForm();
  dialogOpen.value = true;
}

function openEditDialog(category: Category) {
  editingId.value = category.id;
  form.name = category.name;
  form.icon = category.icon;
  dialogOpen.value = true;
}

async function saveCategory() {
  saving.value = true;
  errorMessage.value = "";

  try {
    if (editingId.value) {
      const updated = await api.put<Category, Record<string, unknown>>("/categories", {
        id: editingId.value,
        name: form.name.trim(),
        icon: form.icon.trim(),
      });
      categories.value = categories.value.map((entry) => (entry.id === editingId.value ? updated : entry));
    } else {
      const created = await api.post<Category, Record<string, unknown>>("/categories", {
        name: form.name.trim(),
        icon: form.icon.trim(),
      });
      categories.value = [created, ...categories.value];
    }

    dialogOpen.value = false;
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to save category";
  } finally {
    saving.value = false;
  }
}

async function deleteCategory(category: Category) {
  deletingId.value = category.id;
  errorMessage.value = "";

  try {
    await api.delete("/categories", { id: category.id });
    categories.value = categories.value.filter((entry) => entry.id !== category.id);
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to delete category";
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadCategories);
</script>

<template>
  <v-container class="py-8">
    <div class="page-wrap">
      <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Admin</div>
          <h1 class="text-h4 mb-2">Categories</h1>
          <p class="text-medium-emphasis mb-0">
            Keep expense classification tidy with quick icon-based category maintenance.
          </p>
        </div>
        <v-btn color="secondary" prepend-icon="mdi-shape-plus" @click="openCreateDialog">
          Add category
        </v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-6">
        {{ errorMessage }}
      </v-alert>

      <v-card color="surface" class="pa-4 pa-md-6">
        <v-skeleton-loader v-if="loading" type="table-heading, table-tbody" />

        <template v-else>
          <v-table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Icon</th>
                <th class="text-right">Expenses</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="category.id">
                <td>{{ category.name }}</td>
                <td><code>{{ category.icon }}</code></td>
                <td class="text-right">{{ category.expenses?.length || 0 }}</td>
                <td class="text-right">
                  <div class="d-inline-flex ga-2">
                    <v-btn size="small" variant="tonal" color="primary" @click="openEditDialog(category)">
                      Edit
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="error"
                      :loading="deletingId === category.id"
                      @click="deleteCategory(category)"
                    >
                      Delete
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert v-if="!categories.length" type="info" variant="tonal" class="mt-4">
            No categories yet.
          </v-alert>
        </template>
      </v-card>
    </div>
  </v-container>

  <CategoryEditorDialog
    v-model="dialogOpen"
    :saving="saving"
    :title="editingId ? 'Edit category' : 'Create category'"
    :submit-label="editingId ? 'Save category' : 'Create category'"
    :form="form"
    @submit="saveCategory"
  />
</template>
