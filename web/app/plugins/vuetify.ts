import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: "expense",
      themes: {
        expense: {
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
      },
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
