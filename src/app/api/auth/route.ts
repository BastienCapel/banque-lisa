import { NextResponse } from 'next/server';
import {
  verifyAdminPin,
  verifyLisaToken,
  setAdminSession,
  setLisaSession,
  clearSessions,
  isAdminAuthenticated,
  isLisaAuthenticated,
} from '@/lib/auth';

export async function GET() {
  return NextResponse.json({
    lisa: await isLisaAuthenticated(),
    admin: await isAdminAuthenticated(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin, token, action } = body;

    if (action === 'logout') {
      await clearSessions();
      return NextResponse.json({ success: true });
    }

    if (pin !== undefined) {
      if (verifyAdminPin(pin)) {
        await setAdminSession(pin);
        return NextResponse.json({ success: true, role: 'admin' });
      }
      return NextResponse.json({ success: false, error: 'Code PIN incorrect.' }, { status: 401 });
    }

    if (token !== undefined) {
      if (verifyLisaToken(token)) {
        await setLisaSession(token);
        return NextResponse.json({ success: true, role: 'lisa' });
      }
      return NextResponse.json({ success: false, error: "Lien d'accès ou jeton invalide." }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
