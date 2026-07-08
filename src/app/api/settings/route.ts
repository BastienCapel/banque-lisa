import { getFinancialParams, saveFinancialParams } from '@/lib/sheets';
import { isAdminAuthenticated, isLisaAuthenticated } from '@/lib/auth';
import { jsonNoStore } from '@/lib/api-response';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wantsLogs = searchParams.get('logs') === 'true';

  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    if (wantsLogs) {
      const { getAuditLogs } = require('@/lib/sheets');
      const logs = await getAuditLogs();
      return jsonNoStore({ logs });
    }
    const params = await getFinancialParams();
    return jsonNoStore(params);
  } catch (error: any) {
    return jsonNoStore({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
  }

  try {
    const params = await request.json();
    
    // Server-side validation of settings
    if (!params.startDate || !params.endDate) {
      return jsonNoStore({ error: 'Les dates de début et de fin sont obligatoires.' }, { status: 400 });
    }
    if (params.initialCapital < 0 || params.dailyAllowance < 0 || params.dailyInterestRate < 0 || params.finalBonusRate < 0 || params.maxBudget < 0) {
      return jsonNoStore({ error: 'Les valeurs numériques ne peuvent pas être négatives.' }, { status: 400 });
    }

    await saveFinancialParams(params, 'parent');
    return jsonNoStore({ success: true, params });
  } catch (error: any) {
    return jsonNoStore({ error: error.message }, { status: 500 });
  }
}
