import { mkdir, copyFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function parseDotEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadDatabaseUrlFromEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return null;
  }

  const envContents = await readFile(envPath, "utf8");
  for (const line of envContents.split(/\r?\n/)) {
    const parsed = parseDotEnvLine(line);
    if (parsed?.key === "DATABASE_URL") {
      return parsed.value;
    }
  }

  return null;
}

function resolveSqliteFilePath(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a SQLite file: URL");
  }

  const rawPath = databaseUrl.slice("file:".length);
  const expandedPath = rawPath.replace("${PWD}", process.cwd());

  return resolve(process.cwd(), expandedPath);
}

function createBackupFilename(sourcePath) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const baseName = sourcePath.split("/").pop() ?? "database.sqlite";
  return `${timestamp}-${baseName}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL || (await loadDatabaseUrlFromEnvFile());
  const sourcePath = resolveSqliteFilePath(databaseUrl);

  if (!existsSync(sourcePath)) {
    throw new Error(`SQLite database file not found at ${sourcePath}`);
  }

  const backupDir = resolve(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });

  const backupPath = join(backupDir, createBackupFilename(sourcePath));
  await mkdir(dirname(backupPath), { recursive: true });
  await copyFile(sourcePath, backupPath);

  console.log(`SQLite backup created: ${backupPath}`);
}

main().catch((error) => {
  console.error("SQLite backup failed:", error);
  process.exit(1);
});
