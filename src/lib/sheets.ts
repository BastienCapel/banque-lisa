import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import { FinancialParams, Transaction, Scenario, AuditLog } from '../types';

// In-memory fallback database for serverless environments when Google Sheets is not configured
let inMemoryDb: {
  parameters: any[];
  transactions: Transaction[];
  scenarios: Scenario[];
  auditLogs: AuditLog[];
} | null = null;

const MOCK_DB_DIR = path.join(process.cwd(), 'data');
const MOCK_DB_FILE = path.join(MOCK_DB_DIR, 'db.json');

// Default initial parameters
const defaultParams = [
  { key: 'startDate', value: '2026-07-13', type: 'string', label: 'Date de début' },
  { key: 'endDate', value: '2026-08-10', type: 'string', label: 'Date de fin' },
  { key: 'initialCapital', value: '10', type: 'number', label: 'Capital initial' },
  { key: 'dailyAllowance', value: '2.10', type: 'number', label: 'Versement quotidien' },
  { key: 'dailyInterestRate', value: '0.05', type: 'number', label: 'Intérêt quotidien' },
  { key: 'finalBonusRate', value: '0.10', type: 'number', label: 'Bonus final' },
  { key: 'maxBudget', value: '200', type: 'number', label: 'Budget maximal' },
  { key: 'currency', value: 'EUR', type: 'string', label: 'Devise' },
  { key: 'appName', value: "Banque de l'été", type: 'string', label: "Nom de l'application" },
];

/**
 * Initialize mock database file and return contents
 */
function getLocalDb() {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  // Check if we can write to the filesystem
  try {
    if (!fs.existsSync(MOCK_DB_DIR)) {
      fs.mkdirSync(MOCK_DB_DIR, { recursive: true });
    }

    if (fs.existsSync(MOCK_DB_FILE)) {
      const data = fs.readFileSync(MOCK_DB_FILE, 'utf8');
      inMemoryDb = JSON.parse(data);
      return inMemoryDb!;
    }
  } catch (err) {
    console.warn('Filesystem access not available. Using in-memory fallback.', err);
  }

  // Create default structure
  inMemoryDb = {
    parameters: defaultParams.map(p => ({ ...p, updatedAt: new Date().toISOString() })),
    transactions: [],
    scenarios: [],
    auditLogs: [],
  };

  saveLocalDb(inMemoryDb);
  return inMemoryDb;
}

/**
 * Persist mock database to file
 */
function saveLocalDb(data: any) {
  inMemoryDb = data;
  try {
    if (!fs.existsSync(MOCK_DB_DIR)) {
      fs.mkdirSync(MOCK_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Fail silently in serverless environments
  }
}

/**
 * Check if Google Sheets API credentials are fully configured
 */
function isGoogleSheetsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_SHEET_ID
  );
}

/**
 * Get Google Sheets Client API instance
 */
function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Google private key might contain escaped newlines
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId,
  };
}

/**
 * Helper to write cells if sheet is empty or initialize headers
 */
async function initializeSheetsIfEmpty() {
  if (!isGoogleSheetsConfigured()) return;
  const { sheets, spreadsheetId } = getSheetsClient();

  try {
    // Check Parametres tab
    const paramsCheck = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Parametres!A1:E1',
    });

    if (!paramsCheck.data.values || paramsCheck.data.values.length === 0) {
      // 1. Parametres Header & Defaults
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Parametres!A1:E10',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            ['key', 'value', 'type', 'label', 'updatedAt'],
            ...defaultParams.map(p => [p.key, p.value, p.type, p.label, new Date().toISOString()]),
          ],
        },
      });

      // 2. Transactions Header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Transactions!A1:J1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['id', 'date', 'type', 'amount', 'label', 'note', 'status', 'createdBy', 'createdAt', 'updatedAt']],
        },
      });

      // 3. Scenarios Header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Scenarios!A1:G1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['id', 'name', 'description', 'withdrawalsJson', 'resultFinalBalance', 'resultInterestLost', 'createdAt']],
        },
      });

      // 4. AuditLog Header
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'AuditLog!A1:G1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['id', 'action', 'entityType', 'entityId', 'previousValueJson', 'newValueJson', 'createdAt']],
        },
      });
    }
  } catch (err) {
    console.error('Error initializing Google Sheets. Make sure tabs are created and shared.', err);
  }
}

// Ensure sheet structure exists if using Google Sheets
if (isGoogleSheetsConfigured()) {
  initializeSheetsIfEmpty().catch(console.error);
}

// ==========================================
// PARAMETRES METHODS
// ==========================================

export async function getFinancialParams(): Promise<FinancialParams> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    return parseParamsFromRows(db.parameters);
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Parametres!A2:E20',
  });

  const rows = res.data.values || [];
  const parsedRows = rows.map((r) => ({
    key: r[0],
    value: r[1],
    type: r[2],
    label: r[3],
    updatedAt: r[4],
  }));

  return parseParamsFromRows(parsedRows.length > 0 ? parsedRows : defaultParams);
}

function parseParamsFromRows(rows: any[]): FinancialParams {
  const params: Partial<FinancialParams> = {};
  rows.forEach((row) => {
    let val: any = row.value;
    if (row.type === 'number') {
      val = parseFloat(row.value);
    }
    params[row.key as keyof FinancialParams] = val;
  });

  return {
    startDate: params.startDate || '2026-07-13',
    endDate: params.endDate || '2026-08-10',
    initialCapital: params.initialCapital ?? 10,
    dailyAllowance: params.dailyAllowance ?? 2.10,
    dailyInterestRate: params.dailyInterestRate ?? 0.05,
    finalBonusRate: params.finalBonusRate ?? 0.10,
    maxBudget: params.maxBudget ?? 200,
    currency: params.currency || 'EUR',
    appName: params.appName || "Banque de l'été",
  };
}

export async function saveFinancialParams(params: FinancialParams, adminUser = 'parent'): Promise<void> {
  const prevParams = await getFinancialParams();

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    db.parameters = Object.keys(params).map((key) => {
      const def = defaultParams.find(p => p.key === key);
      return {
        key,
        value: String((params as any)[key]),
        type: typeof (params as any)[key] === 'number' ? 'number' : 'string',
        label: def ? def.label : key,
        updatedAt: new Date().toISOString(),
      };
    });
    saveLocalDb(db);
    await addAuditLog('update_settings', 'settings', 'global', prevParams, params);
    return;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  // Fetch current rows to get labels/types
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Parametres!A2:E20',
  });
  const currentRows = res.data.values || [];

  const updatedRows = Object.keys(params).map((key) => {
    const matched = currentRows.find((r) => r[0] === key);
    const label = matched ? matched[3] : key;
    const type = typeof (params as any)[key] === 'number' ? 'number' : 'string';
    return [key, String((params as any)[key]), type, label, new Date().toISOString()];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Parametres!A2:E${updatedRows.length + 1}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: updatedRows,
    },
  });

  await addAuditLog('update_settings', 'settings', 'global', prevParams, params);
}

// ==========================================
// TRANSACTIONS METHODS
// ==========================================

export async function getTransactions(): Promise<Transaction[]> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    return db.transactions;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Transactions!A2:J5000',
  });

  const rows = res.data.values || [];
  return rows.map((r) => ({
    id: r[0],
    date: r[1],
    type: r[2] as any,
    amount: parseFloat(r[3] || '0'),
    label: r[4] || '',
    note: r[5] || '',
    status: r[6] as any,
    createdBy: r[7] || '',
    createdAt: r[8] || '',
    updatedAt: r[9] || '',
  }));
}

export async function addTransaction(
  tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> {
  const id = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const now = new Date().toISOString();
  
  const newTx: Transaction = {
    ...tx,
    id,
    createdAt: now,
    updatedAt: now,
  };

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    db.transactions.push(newTx);
    saveLocalDb(db);
    await addAuditLog('create_transaction', 'transaction', id, null, newTx);
    return newTx;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Transactions!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          newTx.id,
          newTx.date,
          newTx.type,
          newTx.amount,
          newTx.label,
          newTx.note || '',
          newTx.status,
          newTx.createdBy || 'Lisa',
          newTx.createdAt,
          newTx.updatedAt,
        ],
      ],
    },
  });

  await addAuditLog('create_transaction', 'transaction', id, null, newTx);
  return newTx;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const transactions = await getTransactions();
  const txIndex = transactions.findIndex((t) => t.id === id);
  if (txIndex === -1) {
    throw new Error(`Transaction with id ${id} not found.`);
  }

  const prevTx = transactions[txIndex];
  const updatedTx: Transaction = {
    ...prevTx,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    db.transactions[txIndex] = updatedTx;
    saveLocalDb(db);
    await addAuditLog('update_transaction', 'transaction', id, prevTx, updatedTx);
    return updatedTx;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  // Find row index (row 1 is header, A2 is row index 2)
  const rowIndex = txIndex + 2;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Transactions!A${rowIndex}:J${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          updatedTx.id,
          updatedTx.date,
          updatedTx.type,
          updatedTx.amount,
          updatedTx.label,
          updatedTx.note || '',
          updatedTx.status,
          updatedTx.createdBy || prevTx.createdBy || '',
          updatedTx.createdAt,
          updatedTx.updatedAt,
        ],
      ],
    },
  });

  await addAuditLog('update_transaction', 'transaction', id, prevTx, updatedTx);
  return updatedTx;
}

// ==========================================
// SCENARIOS METHODS
// ==========================================

export async function getScenarios(): Promise<Scenario[]> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    return db.scenarios;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Scenarios!A2:G500',
  });

  const rows = res.data.values || [];
  return rows.map((r) => ({
    id: r[0],
    name: r[1],
    description: r[2] || '',
    withdrawalsJson: r[3] || '[]',
    resultFinalBalance: parseFloat(r[4] || '0'),
    resultInterestLost: parseFloat(r[5] || '0'),
    createdAt: r[6] || '',
  }));
}

export async function addScenario(
  scenario: Omit<Scenario, 'id' | 'createdAt'>
): Promise<Scenario> {
  const id = `sc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newScenario: Scenario = {
    ...scenario,
    id,
    createdAt: now,
  };

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    db.scenarios.push(newScenario);
    saveLocalDb(db);
    return newScenario;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Scenarios!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          newScenario.id,
          newScenario.name,
          newScenario.description,
          newScenario.withdrawalsJson,
          newScenario.resultFinalBalance,
          newScenario.resultInterestLost,
          newScenario.createdAt,
        ],
      ],
    },
  });

  return newScenario;
}

export async function deleteScenario(id: string): Promise<void> {
  const scenarios = await getScenarios();
  const index = scenarios.findIndex((s) => s.id === id);
  if (index === -1) return;

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    db.scenarios.splice(index, 1);
    saveLocalDb(db);
    return;
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  // Clear the row by writing blanks
  const rowIndex = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Scenarios!A${rowIndex}:G${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['', '', '', '', '', '', '']],
    },
  });
}

// ==========================================
// AUDIT LOG METHODS
// ==========================================

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    // Return sorted by creation date descending
    return [...db.auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'AuditLog!A2:G2000',
  });

  const rows = res.data.values || [];
  const logs = rows.map((r) => ({
    id: r[0],
    action: r[1],
    entityType: r[2],
    entityId: r[3],
    previousValueJson: r[4] || '',
    newValueJson: r[5] || '',
    createdAt: r[6] || '',
  }));

  return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  prev: any = null,
  next: any = null
): Promise<AuditLog> {
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newLog: AuditLog = {
    id,
    action,
    entityType,
    entityId,
    previousValueJson: prev ? JSON.stringify(prev) : '',
    newValueJson: next ? JSON.stringify(next) : '',
    createdAt: now,
  };

  if (!isGoogleSheetsConfigured()) {
    const db = getLocalDb();
    db.auditLogs.push(newLog);
    saveLocalDb(db);
    return newLog;
  }

  try {
    const { sheets, spreadsheetId } = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'AuditLog!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            newLog.id,
            newLog.action,
            newLog.entityType,
            newLog.entityId,
            newLog.previousValueJson || '',
            newLog.newValueJson || '',
            newLog.createdAt,
          ],
        ],
      },
    });
  } catch (err) {
    console.error('Failed to append to AuditLog', err);
  }

  return newLog;
}
