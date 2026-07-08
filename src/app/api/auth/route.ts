import {
  verifyAdminPin,
  verifyLisaToken,
  setAdminSession,
  setLisaSession,
  clearSessions,
  isAdminAuthenticated,
  isLisaAuthenticated,
} from '@/lib/auth';
import { jsonNoStore } from '@/lib/api-response';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erreur interne du serveur.';
}

export async function GET(request: Request) {
  const lisa = await isLisaAuthenticated();
  const admin = await isAdminAuthenticated();
  const url = new URL(request.url);

  if (url.searchParams.get('shareLink') === 'true') {
    if (!admin) {
      return jsonNoStore({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
    }

    const shareUrl = new URL('/', request.url);
    const token = process.env.APP_PRIVATE_ACCESS_TOKEN;
    if (token) {
      shareUrl.searchParams.set('token', token);
    }

    return jsonNoStore({ shareUrl: shareUrl.toString() });
  }

  return jsonNoStore({ lisa, admin });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pin, token, action } = body;

    if (action === 'logout') {
      await clearSessions();
      return jsonNoStore({ success: true });
    }

    if (pin !== undefined) {
      if (verifyAdminPin(pin)) {
        await setAdminSession(pin);
        return jsonNoStore({ success: true, role: 'admin' });
      }
      return jsonNoStore({ success: false, error: 'Code PIN incorrect.' }, { status: 401 });
    }

    if (token !== undefined) {
      if (verifyLisaToken(token)) {
        await setLisaSession(token);
        return jsonNoStore({ success: true, role: 'lisa' });
      }
      return jsonNoStore({ success: false, error: "Lien d'accès ou jeton invalide." }, { status: 401 });
    }

    return jsonNoStore({ success: false, error: 'Requête invalide.' }, { status: 400 });
  } catch (error) {
    return jsonNoStore({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
