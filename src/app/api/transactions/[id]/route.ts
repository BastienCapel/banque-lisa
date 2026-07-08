import { updateTransaction } from '@/lib/sheets';
import { isAdminAuthenticated } from '@/lib/auth';
import { jsonNoStore } from '@/lib/api-response';
import { Transaction } from '@/types';

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erreur interne du serveur.';
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<Transaction>;
    const { status, amount, label, note, date } = body;

    const updates: Partial<Transaction> = {};
    if (status !== undefined) updates.status = status;
    if (amount !== undefined) updates.amount = amount;
    if (label !== undefined) updates.label = label;
    if (note !== undefined) updates.note = note;
    if (date !== undefined) updates.date = date;

    const updatedTx = await updateTransaction(id, updates);
    return jsonNoStore({ success: true, transaction: updatedTx });
  } catch (error) {
    return jsonNoStore({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé. Accès administrateur requis.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // We mark the transaction as deleted in status instead of physical row deletion,
    // which maintains consistency in Google Sheets and satisfies AuditLog.
    const updatedTx = await updateTransaction(id, { status: 'deleted' });
    return jsonNoStore({ success: true, transaction: updatedTx });
  } catch (error) {
    return jsonNoStore({ error: getErrorMessage(error) }, { status: 500 });
  }
}
