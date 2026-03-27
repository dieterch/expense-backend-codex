export const THEME_STORAGE_KEY = "expense-web-theme";
export const DEFAULT_THEME_NAME = "expense";

export const APP_THEMES = {
  expense: {
    label: "Atlas",
    dark: false,
    colors: {
      primary: "#17313e",
      secondary: "#d95f43",
      accent: "#dfa94d",
      surface: "#fffaf2",
      background: "#f5efe4",
      success: "#356f48",
      error: "#b63c2f",
    },
  },
  tide: {
    label: "Tide",
    dark: false,
    colors: {
      primary: "#0f3d4c",
      secondary: "#2c8c99",
      accent: "#f2b880",
      surface: "#f4fbfb",
      background: "#dfeff1",
      success: "#2f7d67",
      error: "#b34b3f",
    },
  },
  grove: {
    label: "Grove",
    dark: false,
    colors: {
      primary: "#244032",
      secondary: "#5d8c63",
      accent: "#e6b655",
      surface: "#f8f8ef",
      background: "#e7ede1",
      success: "#3f7a4b",
      error: "#ab4d43",
    },
  },
  dusk: {
    label: "Dusk",
    dark: true,
    colors: {
      primary: "#5b6ee1",
      secondary: "#f28f6b",
      accent: "#f6d365",
      surface: "#1d2233",
      background: "#131726",
      success: "#66bb8a",
      error: "#ff7b72",
    },
  },
  paper: {
    label: "Paper",
    dark: false,
    colors: {
      primary: "#2d2a26",
      secondary: "#b15c3b",
      accent: "#d3a34a",
      surface: "#fffdf8",
      background: "#efe7d8",
      success: "#5f7f52",
      error: "#b5483e",
    },
  },
} as const;

export type ThemeName = keyof typeof APP_THEMES;

export const THEME_OPTIONS = Object.entries(APP_THEMES).map(([value, theme]) => ({
  value: value as ThemeName,
  title: theme.label,
}));

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return Boolean(value && value in APP_THEMES);
}
