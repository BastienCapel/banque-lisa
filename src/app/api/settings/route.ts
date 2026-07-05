import { NextResponse } from 'next/server';
import { getFinancialParams, saveFinancialParams } from '@/lib/sheets';
import { isAdminAuthenticated, isLisaAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wantsLogs = searchParams.get('logs') === 'true';

  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    if (wantsLogs) {
      const { getAuditLogs } = require('@/lib/sheets');
      const logs = await getAuditLogs();
      return NextResponse.json({ logs });
    }
    const params = await getFinancialParams();
    return NextResponse.json(params);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
  }

  try {
    const params = await request.json();
    
    // Server-side validation of settings
    if (!params.startDate || !params.endDate) {
      return NextResponse.json({ error: 'Les dates de début et de fin sont obligatoires.' }, { status: 400 });
    }
    if (params.initialCapital < 0 || params.dailyAllowance < 0 || params.dailyInterestRate < 0 || params.finalBonusRate < 0 || params.maxBudget < 0) {
      return NextResponse.json({ error: 'Les valeurs numériques ne peuvent pas être négatives.' }, { status: 400 });
    }

    await saveFinancialParams(params, 'parent');
    return NextResponse.json({ success: true, params });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
