const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

function isLoopbackHost(hostname: string) {
  return LOOPBACK_HOSTS.has(hostname);
}

export function resolveApiBase(configuredApiBase?: string | null) {
  const trimmed = configuredApiBase?.trim();

  if (!trimmed) {
    if (process.client) {
      return `${window.location.protocol}//${window.location.hostname}:5678/api/v1`;
    }

    return "http://127.0.0.1:5678/api/v1";
  }

  if (!process.client) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    if (isLoopbackHost(url.hostname) && !isLoopbackHost(window.location.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}
