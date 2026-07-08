'use client';

export const AUTH_REQUIRED_EVENT = 'lisa-auth-required';

export class AuthRequiredError extends Error {
  constructor(message = "Session expirée. Ouvre le lien privé ou saisis le jeton d'accès.") {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export function isAuthRequiredError(error: unknown): error is AuthRequiredError {
  return error instanceof AuthRequiredError;
}

function notifyAuthRequired(message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(AUTH_REQUIRED_EVENT, {
      detail: { message },
    })
  );
}

function getPayloadError(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || !('error' in payload)) {
    return undefined;
  }

  const error = (payload as { error?: unknown }).error;
  return typeof error === 'string' ? error : undefined;
}

export async function fetchJson<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const response = await fetch(input, {
    ...init,
    cache: 'no-store',
    headers,
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    const message = getPayloadError(payload) || "Session expirée. Ouvre le lien privé ou saisis le jeton d'accès.";
    notifyAuthRequired(message);
    throw new AuthRequiredError(message);
  }

  if (!response.ok) {
    throw new Error(getPayloadError(payload) || 'Erreur de communication avec le serveur.');
  }

  return payload as T;
}
