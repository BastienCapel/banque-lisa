import { NextResponse } from 'next/server';

const NO_STORE_VALUE = 'no-store, no-cache, max-age=0, must-revalidate';

export function jsonNoStore<T>(body: T, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', NO_STORE_VALUE);
  return NextResponse.json(body, {
    ...init,
    headers,
  });
}
