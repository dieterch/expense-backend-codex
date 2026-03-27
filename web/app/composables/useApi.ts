type ApiOptions<TBody = unknown> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: TBody;
  headers?: Record<string, string>;
};

export function useApi() {
  const config = useRuntimeConfig();
  const sessionState = useSessionState();

  async function request<TResponse, TBody = unknown>(path: string, options: ApiOptions<TBody> = {}) {
    try {
      return await $fetch<TResponse>(`${config.public.apiBase}${path}`, {
        method: options.method,
        body: options.body,
        headers: {
          ...(options.headers || {}),
          ...(sessionState.token.value ? { Authorization: `Bearer ${sessionState.token.value}` } : {}),
        },
      });
    } catch (error: any) {
      if (error?.statusCode === 401 && process.client) {
        sessionState.token.value = null;
        sessionState.user.value = null;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SELECTED_TRIP_KEY);

        if (window.location.pathname !== "/login") {
          await navigateTo({
            path: "/login",
            query: {
              reason: "session-expired",
            },
          });
        }
      }

      throw error;
    }
  }

  return {
    get: <TResponse>(path: string) => request<TResponse>(path),
    post: <TResponse, TBody = unknown>(path: string, body: TBody) =>
      request<TResponse, TBody>(path, { method: "POST", body }),
    put: <TResponse, TBody = unknown>(path: string, body: TBody) =>
      request<TResponse, TBody>(path, { method: "PUT", body }),
    delete: <TResponse, TBody = unknown>(path: string, body: TBody) =>
      request<TResponse, TBody>(path, { method: "DELETE", body }),
  };
}
