import { NextResponse } from 'next/server';
import { getTransactions, addTransaction, getFinancialParams } from '@/lib/sheets';
import { isAdminAuthenticated, isLisaAuthenticated } from '@/lib/auth';
import { validateWithdrawal } from '@/lib/finance';

export async function GET() {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const transactions = await getTransactions();
    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const isAdmin = await isAdminAuthenticated();
  const isLisa = await isLisaAuthenticated();

  if (!isAdmin && !isLisa) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, type, amount, label, note } = body;

    // Server-side validation of general fields
    if (!date || !type || amount === undefined || !label) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    const params = await getFinancialParams();
    const existingTransactions = await getTransactions();

    if (type === 'withdrawal') {
      // Lisa can only request a pending withdrawal
      // Admin can add an approved withdrawal directly
      const status = isAdmin ? (body.status || 'approved') : 'pending';
      const createdBy = isAdmin ? 'parent' : 'Lisa';

      // Validate withdrawal limit
      const validation = validateWithdrawal(params, existingTransactions, date, Math.abs(amount));
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Withdrawals are stored as negative amounts in Sheets
      const finalAmount = -Math.abs(validation.adjustedAmount);

      const tx = await addTransaction({
        date,
        type: 'withdrawal',
        amount: finalAmount,
        label,
        note: note || '',
        status,
        createdBy,
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    if (type === 'adjustment') {
      // Only admin can add adjustments
      if (!isAdmin) {
        return NextResponse.json({ error: 'Action interdite pour Lisa.' }, { status: 403 });
      }

      const tx = await addTransaction({
        date,
        type: 'adjustment',
        amount: parseFloat(amount),
        label,
        note: note || '',
        status: 'approved',
        createdBy: 'parent',
      });

      return NextResponse.json({ success: true, transaction: tx });
    }

    return NextResponse.json({ error: 'Type de transaction non supporté.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
