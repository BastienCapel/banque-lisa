import { getScenarios, addScenario, deleteScenario } from '@/lib/sheets';
import { isAdminAuthenticated, isLisaAuthenticated } from '@/lib/auth';
import { jsonNoStore } from '@/lib/api-response';

export async function GET() {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const scenarios = await getScenarios();
    return jsonNoStore(scenarios);
  } catch (error: any) {
    return jsonNoStore({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, withdrawalsJson, resultFinalBalance, resultInterestLost } = body;

    if (!name || !withdrawalsJson) {
      return jsonNoStore({ error: 'Nom et liste des retraits requis.' }, { status: 400 });
    }

    const scenario = await addScenario({
      name,
      description: description || '',
      withdrawalsJson,
      resultFinalBalance: parseFloat(resultFinalBalance || '0'),
      resultInterestLost: parseFloat(resultInterestLost || '0'),
    });

    return jsonNoStore({ success: true, scenario });
  } catch (error: any) {
    return jsonNoStore({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return jsonNoStore({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonNoStore({ error: 'ID du scénario manquant.' }, { status: 400 });
    }

    await deleteScenario(id);
    return jsonNoStore({ success: true });
  } catch (error: any) {
    return jsonNoStore({ error: error.message }, { status: 500 });
  }
}
