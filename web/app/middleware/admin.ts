export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  await auth.init();

  if (!auth.isAuthenticated.value) {
    return auth.redirectToLogin("auth-required", to.fullPath);
  }

  if (!auth.isAdmin.value) {
    return navigateTo("/forbidden");
  }
});
