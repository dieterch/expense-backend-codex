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

function buildLoginRoute(reason: string, redirect?: string) {
  return {
    path: "/login",
    query: {
      reason,
      ...(redirect ? { redirect } : {}),
    },
  };
}

export function useAuth() {
  const sessionState = useSessionState();
  const token = sessionState.token;
  const user = sessionState.user as Ref<AuthUser | null>;
  const initialized = sessionState.initialized;
  const pending = sessionState.pending;

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

    if (process.client) {
      localStorage.removeItem(SELECTED_TRIP_KEY);
    }
  }

  async function redirectToLogin(reason: string, redirect?: string) {
    if (process.client && window.location.pathname === "/login") {
      return;
    }

    await navigateTo(buildLoginRoute(reason, redirect));
  }

  async function fetchMe(options: { silentAuthError?: boolean } = {}) {
    const config = useRuntimeConfig();
    const me = await $fetch<AuthUser>(`${config.public.apiBase}/me`, {
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : undefined,
    }).catch(async (error: any) => {
      if (options.silentAuthError && (error?.statusCode === 401 || error?.status === 401)) {
        throw error;
      }

      throw error;
    });

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
          await fetchMe({ silentAuthError: true });
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
    await redirectToLogin("logged-out");
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
    redirectToLogin,
  };
}
