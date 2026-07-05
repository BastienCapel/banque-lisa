import { NextResponse } from 'next/server';
import { updateTransaction } from '@/lib/sheets';
import { isAdminAuthenticated } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, amount, label, note, date } = body;

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (amount !== undefined) updates.amount = amount;
    if (label !== undefined) updates.label = label;
    if (note !== undefined) updates.note = note;
    if (date !== undefined) updates.date = date;

    const updatedTx = await updateTransaction(id, updates);
    return NextResponse.json({ success: true, transaction: updatedTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // We mark the transaction as deleted in status instead of physical row deletion,
    // which maintains consistency in Google Sheets and satisfies AuditLog.
    const updatedTx = await updateTransaction(id, { status: 'deleted' });
    return NextResponse.json({ success: true, transaction: updatedTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
