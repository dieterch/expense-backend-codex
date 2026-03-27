const ICON_ALIASES: Record<string, string> = {
  "fork-knife": "mdi-silverware-fork-knife",
};

export function normalizeCategoryIcon(icon?: string | null) {
  const trimmed = icon?.trim();

  if (!trimmed) {
    return "mdi-shape-outline";
  }

  if (ICON_ALIASES[trimmed]) {
    return ICON_ALIASES[trimmed];
  }

  if (trimmed.startsWith("mdi-")) {
    return trimmed;
  }

  return `mdi-${trimmed}`;
}
