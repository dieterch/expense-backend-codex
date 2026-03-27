import "@mdi/font/css/materialdesignicons.css";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { APP_THEMES, DEFAULT_THEME_NAME } from "~/utils/themes";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    icons: {
      defaultSet: "mdi",
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: DEFAULT_THEME_NAME,
      themes: APP_THEMES,
    },
    defaults: {
      VCard: {
        rounded: "xl",
        elevation: 0,
      },
      VBtn: {
        rounded: "pill",
        variant: "flat",
      },
      VTextField: {
        variant: "outlined",
        rounded: "xl",
      },
      VTextarea: {
        variant: "outlined",
        rounded: "xl",
      },
      VSelect: {
        variant: "outlined",
        rounded: "xl",
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
