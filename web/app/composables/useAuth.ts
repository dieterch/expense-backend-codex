type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  trips?: Array<{ id: string; name: string; startDate: string; endDate?: string | null }>;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

const STORAGE_KEY = "expense-web-token";

export function useAuth() {
  const api = useApi();
  const token = useState<string | null>("auth_token", () => null);
  const user = useState<AuthUser | null>("auth_user", () => null);
  const initialized = useState<boolean>("auth_initialized", () => false);
  const pending = useState<boolean>("auth_pending", () => false);

  const isAuthenticated = computed(() => Boolean(token.value));
  const isAdmin = computed(() => user.value?.role === "admin");

  function setToken(nextToken: string | null) {
    token.value = nextToken;

    if (process.client) {
      if (nextToken) {
        localStorage.setItem(STORAGE_KEY, nextToken);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  function resetSession() {
    setToken(null);
    user.value = null;
  }

  async function fetchMe() {
    const me = await api.get<AuthUser>("/me");
    user.value = me;
    return me;
  }

  async function init() {
    if (initialized.value || pending.value) {
      return;
    }

    pending.value = true;
    try {
      if (process.client && !token.value) {
        token.value = localStorage.getItem(STORAGE_KEY);
      }

      if (token.value) {
        try {
          await fetchMe();
        } catch {
          resetSession();
        }
      }

      initialized.value = true;
    } finally {
      pending.value = false;
    }
  }

  async function login(email: string, password: string) {
    const config = useRuntimeConfig();
    const response = await $fetch<LoginResponse>(`${config.public.apiBase}/auth/login`, {
      method: "POST",
      body: {
        email,
        password,
      },
    });

    setToken(response.token);
    user.value = response.user;
    await fetchMe();

    return response;
  }

  async function logout() {
    resetSession();
    await navigateTo("/login");
  }

  return {
    token,
    user,
    initialized,
    pending,
    isAuthenticated,
    isAdmin,
    init,
    login,
    fetchMe,
    logout,
  };
}
