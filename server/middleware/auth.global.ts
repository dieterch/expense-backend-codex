import { H3Event, sendError } from 'h3';
import { jwtVerify } from 'jose';

import { isDocsEnabled, isTruthyRuntimeFlag } from "../../utils/runtime-flags";

const alwaysPublicPaths = new Set(["/api/auth/login", "/api/v1/auth/login"]);
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Credentials': 'true',
};

export default defineEventHandler(async (event: H3Event) => {
  setResponseHeaders(event, corsHeaders);

  if (event.node.req.method === "OPTIONS") {
    event.node.res.statusCode = 204;
    return "";
  }

  const requestPath = getRequestURL(event).pathname;

  if (
    alwaysPublicPaths.has(requestPath) ||
    (isDocsEnabled(event) && (requestPath === "/docs" || requestPath === "/openapi.yaml"))
  ) {
    return;
  }

  const config = useRuntimeConfig(event);
  if (isTruthyRuntimeFlag(config.devAuthBypass)) {
    event.context.user = {
      sub: "dev-mode",
      role: "developer",
      devAuthBypassed: true,
    };
    return;
  }

  const SECRET = new TextEncoder().encode(config.jwtSecret);
  
  const authHeader = getHeader(event, 'Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      event,
      createError({ statusCode: 401, statusMessage: 'Unauthorized' })
      );
  }
  const token = authHeader.substring(7); // Entferne 'Bearer '
  
  try {
    // Überprüfe den Token
    const { payload } = await jwtVerify(token, SECRET);
    
    // Optional: Benutzerinformationen an die Anfrage anhängen
    event.context.user = payload;
  } catch (err) {
    return sendError(
      event,
      createError({ statusCode: 403, statusMessage: 'Forbidden' })
    );
  }
});
