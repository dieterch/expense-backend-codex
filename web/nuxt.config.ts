import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  app: {
    head: {
      title: "Expense Web",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#17313e" },
      ],
    },
  },
  css: [
    "vuetify/styles",
    "~/assets/main.scss",
  ],
  build: {
    transpile: ["vuetify"],
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:5678/api/v1",
    },
  },
  vite: {
    ssr: {
      noExternal: ["vuetify"],
    },
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  hooks: {
    "vite:extendConfig"(config) {
      config.plugins = config.plugins || [];
      config.plugins.push(vuetify({ autoImport: true }));
    },
  },
});
