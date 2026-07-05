import { cookies } from 'next/headers';

const LISA_SESSION_COOKIE = 'lisa_session';
const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Verifies if the given token matches the configured APP_PRIVATE_ACCESS_TOKEN
 */
export function verifyLisaToken(token: string): boolean {
  const expectedToken = process.env.APP_PRIVATE_ACCESS_TOKEN;
  return !!expectedToken && token === expectedToken;
}

/**
 * Verifies if the given PIN matches the configured APP_PARENT_PIN or APP_PARENT_PASSWORD
 */
export function verifyAdminPin(pin: string): boolean {
  const expectedPin = process.env.APP_PARENT_PIN || process.env.APP_PARENT_PASSWORD;
  return !!expectedPin && pin === expectedPin;
}

/**
 * Checks if Lisa session cookie is valid
 */
export async function isLisaAuthenticated(): Promise<boolean> {
  // If APP_PRIVATE_ACCESS_TOKEN is not configured, we allow access by default to ease setup
  if (!process.env.APP_PRIVATE_ACCESS_TOKEN) {
    return true;
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(LISA_SESSION_COOKIE)?.value;
  return !!token && verifyLisaToken(token);
}

/**
 * Checks if Admin session cookie is valid
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return !!token && verifyAdminPin(token);
}

/**
 * Sets the Lisa session cookie
 */
export async function setLisaSession(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(LISA_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 60, // 60 days
    path: '/',
  });
}

/**
 * Sets the Admin session cookie
 */
export async function setAdminSession(pin: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, pin, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
  });
}

/**
 * Clears authentication cookies
 */
export async function clearSessions() {
  const cookieStore = await cookies();
  cookieStore.delete(LISA_SESSION_COOKIE);
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
