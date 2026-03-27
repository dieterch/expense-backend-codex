//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2024-11-21",
  runtimeConfig: {
    apiToken: "dev_token", // `dev_token` is the default value
    jwtSecret: "secret", // `secret` is the default value
  }
});