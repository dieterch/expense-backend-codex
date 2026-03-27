export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth();
  await auth.init();

  if (auth.isAuthenticated.value) {
    return navigateTo("/trips");
  }
});
