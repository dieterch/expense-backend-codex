// server/middleware/auth.ts
import { H3Event, sendError } from 'h3';
import { jwtVerify } from 'jose';

const publicPaths = new Set(["/docs", "/openapi.yaml", "/api/auth/login"]);

function isTruthyRuntimeFlag(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
  }

  return false;
}

export default defineEventHandler(async (event: H3Event) => {
  if (event.node.req.method === "OPTIONS") {
    setResponseHeaders(event, {
      //'Access-Control-Allow-Origin': 'http://192.168.15.64:9000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    });

    return null; // Respond with no content
  }

  if (publicPaths.has(getRequestURL(event).pathname)) {
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
