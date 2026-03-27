<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});

const auth = useAuth();
const route = useRoute();
const email = ref("dev-member@example.com");
const password = ref("dev-member-password");
const loading = ref(false);
const errorMessage = ref("");

const infoMessage = computed(() => {
  const reason = route.query.reason;

  if (reason === "auth-required") {
    return "Sign in to continue to the page you requested.";
  }

  if (reason === "session-expired") {
    return "Your session expired. Please sign in again.";
  }

  if (reason === "logged-out") {
    return "You have been signed out.";
  }

  return "";
});

async function submit() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await auth.login(email.value, password.value);
    const redirectTarget = typeof route.query.redirect === "string" ? route.query.redirect : "/trips";
    await navigateTo(redirectTarget);
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || "Login failed";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height d-flex align-center justify-center">
    <div class="page-wrap py-16">
      <v-row align="center" justify="center">
        <v-col cols="12" md="11" lg="10" xl="9">
          <v-card color="surface" class="pa-4 pa-md-8">
            <v-row>
              <v-col cols="12" md="6" class="d-flex flex-column justify-center">
                <div class="mb-6">
                  <div class="text-overline text-secondary font-weight-bold page-title">Expense Web</div>
                  <h1 class="text-h3 mb-3">Shared trips, cleaner math.</h1>
                  <p class="text-medium-emphasis text-body-1">
                    Sign in to manage trip members, track expenses, and keep the web client aligned
                    with the new versioned backend API.
                  </p>
                </div>
                <v-sheet color="primary" rounded="xl" class="pa-4 text-white">
                  <div class="text-caption text-uppercase mb-2">Quick start</div>
                  <div>Default local demo account:</div>
                  <div class="font-weight-bold">dev-member@example.com / dev-member-password</div>
                </v-sheet>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4 pa-md-6">
                  <div class="text-h5 mb-4">Sign in</div>
                  <v-alert
                    v-if="infoMessage"
                    type="info"
                    variant="tonal"
                    class="mb-4"
                  >
                    {{ infoMessage }}
                  </v-alert>
                  <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                  >
                    {{ errorMessage }}
                  </v-alert>
                  <v-form @submit.prevent="submit">
                    <v-text-field
                      v-model="email"
                      type="email"
                      label="Email"
                      prepend-inner-icon="mdi-email-outline"
                      class="mb-3"
                    />
                    <v-text-field
                      v-model="password"
                      type="password"
                      label="Password"
                      prepend-inner-icon="mdi-lock-outline"
                      class="mb-4"
                    />
                    <v-btn
                      type="submit"
                      color="secondary"
                      size="large"
                      block
                      :loading="loading"
                    >
                      Continue
                    </v-btn>
                  </v-form>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>
