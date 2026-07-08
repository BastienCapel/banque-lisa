import {
  FinancialParams,
  Transaction,
  DailyEvolutionRow,
  SimulationResult,
  SimulatedWithdrawal,
} from '../types';

/**
 * Adds a specific number of days to a date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  // Tout en UTC : un parsing en heure locale combiné à toISOString() (UTC)
  // fait reculer la date d'un jour pour tout visiteur en fuseau UTC+ (ex. France),
  // ce qui rendait getDatesInRange infinie.
  const date = new Date(dateStr + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Returns today's date (YYYY-MM-DD) in the visitor's local timezone.
 * new Date().toISOString() renverrait la date UTC, donc la veille entre
 * minuit et ~2h du matin en France.
 */
export function getTodayStr(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Calculates the difference in days between two date strings (inclusive/exclusive depending on usage)
 */
export function diffDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + 'T00:00:00Z');
  const end = new Date(endDateStr + 'T00:00:00Z');
  const diffTime = end.getTime() - start.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns a list of date strings (YYYY-MM-DD) in a given range, inclusive
 */
export function getDatesInRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  while (current <= endDateStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Run a projection simulation starting from a given date with a given start balance,
 * assuming no more withdrawals are made until the end of the period.
 */
export function runProjection(
  params: FinancialParams,
  startDate: string,
  startBalance: number
): number {
  if (startDate > params.endDate) {
    return startBalance + startBalance * params.finalBonusRate;
  }

  let balance = startBalance;
  const dates = getDatesInRange(startDate, params.endDate);

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    
    // Add daily allowance
    balance += params.dailyAllowance;
    
    // Add initial capital if it's the start date (normally won't happen in middle projections, but just in case)
    if (date === params.startDate) {
      balance += params.initialCapital;
    }

    // Clamp balance
    if (balance < 0) {
      balance = 0;
    }

    // Calculate interest
    const interest = balance * params.dailyInterestRate;
    balance += interest;
  }

  const bonus = balance * params.finalBonusRate;
  return balance + bonus;
}

/**
 * Calculates the daily evolution of the budget based on the parameters and approved transactions.
 */
export function calculateDailyEvolution(
  params: FinancialParams,
  transactions: Transaction[]
): DailyEvolutionRow[] {
  const dates = getDatesInRange(params.startDate, params.endDate);
  const evolution: DailyEvolutionRow[] = [];
  
  let balance = 0.0;
  let cumulativeInterest = 0.0;

  // Filter approved transactions once
  const approvedTx = transactions.filter((t) => t.status === 'approved');

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const dayIndex = i + 1;
    const startBalance = balance;

    // 1. Initial capital (only on first day)
    const initialCapitalAdded = date === params.startDate ? params.initialCapital : 0;

    // 2. Daily allowance
    const allowanceAdded = params.dailyAllowance;

    // 3. Find other transactions for this day
    const dayTx = approvedTx.filter((t) => t.date === date);
    
    const adjustmentsAdded = dayTx
      .filter((t) => t.type === 'adjustment')
      .reduce((sum, t) => sum + t.amount, 0);

    // Withdrawals are stored as negative numbers, convert to positive count for subtraction
    const withdrawalsSubtracted = Math.abs(
      dayTx
        .filter((t) => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    // 4. Calculate balance before interest
    let balanceBeforeInterest =
      startBalance +
      initialCapitalAdded +
      allowanceAdded +
      adjustmentsAdded -
      withdrawalsSubtracted;

    // Prevent negative balance
    if (balanceBeforeInterest < 0) {
      balanceBeforeInterest = 0;
    }

    // 5. Interest calculation
    const interestEarned = balanceBeforeInterest * params.dailyInterestRate;
    cumulativeInterest += interestEarned;

    // 6. End balance
    const endBalance = balanceBeforeInterest + interestEarned;
    balance = endBalance;

    // 7. Calculate projected final balance if no more withdrawals are made
    // The projection starts the NEXT day, starting with this day's end balance
    const nextDay = addDays(date, 1);
    const projectedFinalBalance = runProjection(params, nextDay, endBalance);

    evolution.push({
      date,
      dayIndex,
      startBalance,
      allowanceAdded,
      initialCapitalAdded,
      adjustmentsAdded,
      withdrawalsSubtracted,
      balanceBeforeInterest,
      interestRate: params.dailyInterestRate,
      interestEarned,
      endBalance,
      cumulativeInterest,
      projectedFinalBalance,
    });
  }

  return evolution;
}

/**
 * Simulates a custom scenario based on simulated withdrawals.
 */
export function calculateScenario(
  params: FinancialParams,
  scenarioWithdrawals: SimulatedWithdrawal[],
  scenarioName = 'Simulation'
): SimulationResult {
  // Convert simulated withdrawals to Transaction objects
  const dummyTransactions: Transaction[] = scenarioWithdrawals.map((sw, index) => ({
    id: `sim-${index}`,
    date: sw.date,
    type: 'withdrawal',
    amount: -Math.abs(sw.amount),
    label: sw.label,
    status: 'approved',
  }));

  const evolution = calculateDailyEvolution(params, dummyTransactions);
  
  const finalRow = evolution[evolution.length - 1];
  const finalBalanceBeforeBonus = finalRow ? finalRow.endBalance : 0;
  const finalBonus = finalBalanceBeforeBonus * params.finalBonusRate;
  const finalBalanceWithBonus = finalBalanceBeforeBonus + finalBonus;
  const cumulativeInterest = finalRow ? finalRow.cumulativeInterest : 0;
  
  const totalWithdrawn = scenarioWithdrawals.reduce((sum, sw) => sum + Math.abs(sw.amount), 0);

  // We will compute interest lost by comparing to a "no withdrawal" scenario
  const noWithdrawalEvolution = calculateDailyEvolution(params, []);
  const noWithdrawalFinalRow = noWithdrawalEvolution[noWithdrawalEvolution.length - 1];
  const noWithdrawalCumulativeInterest = noWithdrawalFinalRow ? noWithdrawalFinalRow.cumulativeInterest : 0;
  const noWithdrawalFinalWithBonus = noWithdrawalFinalRow 
    ? noWithdrawalFinalRow.endBalance + (noWithdrawalFinalRow.endBalance * params.finalBonusRate)
    : 0;

  const interestLost = Math.max(0, noWithdrawalCumulativeInterest - cumulativeInterest);
  const differenceFromMax = Math.max(0, noWithdrawalFinalWithBonus - finalBalanceWithBonus);

  return {
    scenarioName,
    totalWithdrawn,
    finalBalanceBeforeBonus,
    finalBonus,
    finalBalanceWithBonus,
    cumulativeInterest,
    interestLost,
    differenceFromMax,
    evolution,
  };
}

/**
 * Calculates interest lost between a real scenario and a simulated one,
 * or simply helper to compare two sets of withdrawals.
 */
export function calculateInterestLost(
  params: FinancialParams,
  realWithdrawals: Transaction[],
  simulatedWithdrawals: SimulatedWithdrawal[]
): { interestLost: number; balanceDifference: number } {
  const realRes = calculateScenario(
    params,
    realWithdrawals
      .filter((t) => t.status === 'approved' && t.type === 'withdrawal')
      .map((t) => ({ date: t.date, amount: Math.abs(t.amount), label: t.label }))
  );
  
  const simRes = calculateScenario(params, simulatedWithdrawals);

  return {
    interestLost: Math.max(0, realRes.cumulativeInterest - simRes.cumulativeInterest),
    balanceDifference: Math.max(0, realRes.finalBalanceWithBonus - simRes.finalBalanceWithBonus),
  };
}

/**
 * Returns the maximum available balance Lisa can withdraw at a specific date.
 */
export function getAvailableBalanceAtDate(
  params: FinancialParams,
  transactions: Transaction[],
  date: string
): number {
  if (date < params.startDate || date > params.endDate) {
    return 0;
  }

  const dates = getDatesInRange(params.startDate, date);
  const approvedTx = transactions.filter((t) => t.status === 'approved');
  
  let balance = 0.0;

  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    const isLastDay = d === date;

    const initialCapitalAdded = d === params.startDate ? params.initialCapital : 0;
    const allowanceAdded = params.dailyAllowance;
    
    const dayTx = approvedTx.filter((t) => t.date === d);
    
    const adjustments = dayTx
      .filter((t) => t.type === 'adjustment')
      .reduce((sum, t) => sum + t.amount, 0);

    // We exclude withdrawals from the active date if we want the balance BEFORE this day's withdrawals,
    // or include them. The prompt says "impossible de demander plus que le solde disponible estimé à cette date".
    // If she is requesting a new withdrawal, she can withdraw up to the current day's balance
    // before the new withdrawal, but after other already approved withdrawals on that day.
    const withdrawals = Math.abs(
      dayTx
        .filter((t) => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const balanceBeforeInterest = balance + initialCapitalAdded + allowanceAdded + adjustments - withdrawals;
    
    if (isLastDay) {
      return Math.max(0, balanceBeforeInterest);
    }

    const clamped = Math.max(0, balanceBeforeInterest);
    const interest = clamped * params.dailyInterestRate;
    balance = clamped + interest;
  }

  return Math.max(0, balance);
}

/**
 * Validates a withdrawal request.
 */
export function validateWithdrawal(
  params: FinancialParams,
  transactions: Transaction[],
  date: string,
  amount: number
): { valid: boolean; error?: string; adjustedAmount: number } {
  if (date < params.startDate || date > params.endDate) {
    return { valid: false, error: "La date du retrait doit être comprise dans la période de l'application.", adjustedAmount: amount };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Le montant du retrait doit être supérieur à 0 €.', adjustedAmount: amount };
  }

  // Round to nearest euro as required: "les retraits saisis par Lisa sont arrondis à l'euro"
  const adjustedAmount = Math.round(amount);

  const availableBalance = getAvailableBalanceAtDate(params, transactions, date);
  if (adjustedAmount > availableBalance) {
    return {
      valid: false,
      error: `Solde insuffisant à cette date. Solde disponible : ${availableBalance.toFixed(2)} €, montant demandé (arrondi) : ${adjustedAmount} €.`,
      adjustedAmount,
    };
  }

  return { valid: true, adjustedAmount };
}
