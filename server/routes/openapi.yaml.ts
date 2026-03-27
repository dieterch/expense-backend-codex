import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export default defineEventHandler(async (event) => {
  const specPath = resolve(process.cwd(), "openapi.yaml");
  const spec = await readFile(specPath, "utf8");

  setResponseHeader(event, "content-type", "application/yaml; charset=utf-8");
  return spec;
});
