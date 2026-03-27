<script setup lang="ts">
definePageMeta({
  middleware: "admin",
});

import UserEditorDialog from "~/components/admin/UserEditorDialog.vue";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  trips?: Array<unknown>;
  expenses?: Array<unknown>;
};

const api = useApi();
const loading = ref(true);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const errorMessage = ref("");
const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const users = ref<User[]>([]);

const form = reactive({
  name: "",
  email: "",
  password: "",
  role: "user",
});

async function loadUsers() {
  loading.value = true;
  errorMessage.value = "";

  try {
    users.value = await api.get<User[]>("/users");
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to load users";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.name = "";
  form.email = "";
  form.password = "";
  form.role = "user";
  editingId.value = null;
}

function openCreateDialog() {
  resetForm();
  dialogOpen.value = true;
}

function openEditDialog(user: User) {
  editingId.value = user.id;
  form.name = user.name;
  form.email = user.email;
  form.password = "";
  form.role = user.role;
  dialogOpen.value = true;
}

async function saveUser() {
  saving.value = true;
  errorMessage.value = "";

  try {
    if (editingId.value) {
      const updated = await api.put<User, Record<string, unknown>>("/users", {
        id: editingId.value,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim() || undefined,
        role: form.role,
      });

      users.value = users.value.map((entry) => (entry.id === editingId.value ? updated : entry));
    } else {
      const created = await api.post<User, Record<string, unknown>>("/users", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: form.role,
      });

      users.value = [created, ...users.value];
    }

    dialogOpen.value = false;
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to save user";
  } finally {
    saving.value = false;
  }
}

async function deleteUser(user: User) {
  deletingId.value = user.id;
  errorMessage.value = "";

  try {
    await api.delete("/users", { id: user.id });
    users.value = users.value.filter((entry) => entry.id !== user.id);
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Failed to delete user";
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadUsers);
</script>

<template>
  <v-container class="py-8">
    <div class="page-wrap">
      <div class="d-flex flex-wrap justify-space-between align-center mb-6 ga-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Admin</div>
          <h1 class="text-h4 mb-2">Users</h1>
          <p class="text-medium-emphasis mb-0">
            Create accounts, change roles, and rotate passwords without leaving the web client.
          </p>
        </div>
        <v-btn color="secondary" prepend-icon="mdi-account-plus" @click="openCreateDialog">
          Add user
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
                <th>Email</th>
                <th>Role</th>
                <th class="text-right">Trips</th>
                <th class="text-right">Expenses</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <v-chip :color="user.role === 'admin' ? 'secondary' : 'accent'" variant="tonal">
                    {{ user.role }}
                  </v-chip>
                </td>
                <td class="text-right">{{ user.trips?.length || 0 }}</td>
                <td class="text-right">{{ user.expenses?.length || 0 }}</td>
                <td class="text-right">
                  <div class="d-inline-flex ga-2">
                    <v-btn size="small" variant="tonal" color="primary" @click="openEditDialog(user)">
                      Edit
                    </v-btn>
                    <v-btn
                      size="small"
                      variant="tonal"
                      color="error"
                      :loading="deletingId === user.id"
                      @click="deleteUser(user)"
                    >
                      Delete
                    </v-btn>
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-alert v-if="!users.length" type="info" variant="tonal" class="mt-4">
            No users yet.
          </v-alert>
        </template>
      </v-card>
    </div>
  </v-container>

  <UserEditorDialog
    v-model="dialogOpen"
    :saving="saving"
    :title="editingId ? 'Edit user' : 'Create user'"
    :submit-label="editingId ? 'Save user' : 'Create user'"
    :form="form"
    :is-editing="Boolean(editingId)"
    @submit="saveUser"
  />
</template>
