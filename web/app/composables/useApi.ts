type ApiOptions<TBody = unknown> = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: TBody;
  headers?: Record<string, string>;
};

export function useApi() {
  const config = useRuntimeConfig();
  const token = useState<string | null>("auth_token", () => null);
  const user = useState<Record<string, unknown> | null>("auth_user", () => null);

  async function request<TResponse, TBody = unknown>(path: string, options: ApiOptions<TBody> = {}) {
    try {
      return await $fetch<TResponse>(`${config.public.apiBase}${path}`, {
        method: options.method,
        body: options.body,
        headers: {
          ...(options.headers || {}),
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
        },
      });
    } catch (error: any) {
      if (error?.statusCode === 401 && process.client) {
        token.value = null;
        user.value = null;
        localStorage.removeItem("expense-web-token");
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
