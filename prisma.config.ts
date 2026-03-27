import "dotenv/config";
import { defineConfig } from "prisma/config";

function resolveDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    return value;
  }

  return value.replace("${PWD}", process.cwd());
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
