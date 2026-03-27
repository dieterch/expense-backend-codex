import {
  DEFAULT_ESTIMATION_SETTINGS,
  type EstimationSettings,
} from "~/utils/expense-estimation";

const ESTIMATION_SETTINGS_STORAGE_KEY = "expense-web-estimation-settings";

export function useEstimationSettings() {
  const settings = useState<EstimationSettings>("estimation_settings", () => ({
    ...DEFAULT_ESTIMATION_SETTINGS,
    currencyMarkupOverrides: {},
  }));
  const initialized = useState<boolean>("estimation_settings_initialized", () => false);

  function normalizeSettings(input: Partial<EstimationSettings> | null | undefined): EstimationSettings {
    return {
      defaultMarkupBps: Number.isFinite(input?.defaultMarkupBps) ? Math.round(input!.defaultMarkupBps!) : DEFAULT_ESTIMATION_SETTINGS.defaultMarkupBps,
      fixedFeeCents: Number.isFinite(input?.fixedFeeCents) ? Math.round(input!.fixedFeeCents!) : DEFAULT_ESTIMATION_SETTINGS.fixedFeeCents,
      weekendSurchargeBps: Number.isFinite(input?.weekendSurchargeBps) ? Math.round(input!.weekendSurchargeBps!) : DEFAULT_ESTIMATION_SETTINGS.weekendSurchargeBps,
      currencyMarkupOverrides: Object.fromEntries(
        Object.entries(input?.currencyMarkupOverrides || {}).filter(([, value]) => Number.isFinite(value)).map(([key, value]) => [key, Math.round(value as number)]),
      ),
    };
  }

  function init() {
    if (!process.client || initialized.value) {
      return;
    }

    const saved = localStorage.getItem(ESTIMATION_SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        settings.value = normalizeSettings(JSON.parse(saved) as Partial<EstimationSettings>);
      } catch {
        localStorage.removeItem(ESTIMATION_SETTINGS_STORAGE_KEY);
      }
    }

    initialized.value = true;
  }

  function persist(nextSettings: EstimationSettings) {
    settings.value = normalizeSettings(nextSettings);

    if (!process.client) {
      return;
    }

    localStorage.setItem(ESTIMATION_SETTINGS_STORAGE_KEY, JSON.stringify(settings.value));
  }

  function reset() {
    persist(DEFAULT_ESTIMATION_SETTINGS);
  }

  return {
    settings,
    init,
    persist,
    reset,
  };
}
