export const STORAGE_KEY = "expense-web-token";
export const SELECTED_TRIP_KEY = "expense-web-selected-trip";

export function useSessionState() {
  const token = useState<string | null>("auth_token", () => null);
  const user = useState<Record<string, unknown> | null>("auth_user", () => null);
  const initialized = useState<boolean>("auth_initialized", () => false);
  const pending = useState<boolean>("auth_pending", () => false);

  return {
    token,
    user,
    initialized,
    pending,
  };
}
