import { APP_THEMES, DEFAULT_THEME_NAME, isThemeName, THEME_STORAGE_KEY, type ThemeName } from "~/utils/themes";

export function useThemePreferences() {
  const selectedTheme = useState<ThemeName>("ui_theme", () => DEFAULT_THEME_NAME);
  const initialized = useState<boolean>("ui_theme_initialized", () => false);

  function init() {
    if (initialized.value || !process.client) {
      initialized.value = true;
      return;
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeName(storedTheme)) {
      selectedTheme.value = storedTheme;
    }

    initialized.value = true;
  }

  function setTheme(themeName: ThemeName) {
    if (!(themeName in APP_THEMES)) {
      return;
    }

    selectedTheme.value = themeName;

    if (process.client) {
      localStorage.setItem(THEME_STORAGE_KEY, themeName);
    }
  }

  return {
    selectedTheme,
    initialized,
    init,
    setTheme,
  };
}
