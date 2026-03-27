import { createError } from "h3";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { isDocsEnabled } from "../../utils/runtime-flags";

export default defineEventHandler(async (event) => {
  if (!isDocsEnabled(event)) {
    throw createError({ statusCode: 404, statusMessage: "Not Found" });
  }

  const specPath = resolve(process.cwd(), "openapi.yaml");
  const spec = await readFile(specPath, "utf8");

  setResponseHeader(event, "content-type", "application/yaml; charset=utf-8");
  return spec;
});
