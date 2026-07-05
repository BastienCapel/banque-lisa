import { NextResponse } from 'next/server';
import { getScenarios, addScenario, deleteScenario } from '@/lib/sheets';
import { isAdminAuthenticated, isLisaAuthenticated } from '@/lib/auth';

export async function GET() {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const scenarios = await getScenarios();
    return NextResponse.json(scenarios);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, withdrawalsJson, resultFinalBalance, resultInterestLost } = body;

    if (!name || !withdrawalsJson) {
      return NextResponse.json({ error: 'Nom et liste des retraits requis.' }, { status: 400 });
    }

    const scenario = await addScenario({
      name,
      description: description || '',
      withdrawalsJson,
      resultFinalBalance: parseFloat(resultFinalBalance || '0'),
      resultInterestLost: parseFloat(resultInterestLost || '0'),
    });

    return NextResponse.json({ success: true, scenario });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (process.env.APP_PRIVATE_ACCESS_TOKEN && !(await isLisaAuthenticated()) && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID du scénario manquant.' }, { status: 400 });
    }

    await deleteScenario(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
