export interface FinancialParams {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  initialCapital: number;
  dailyAllowance: number;
  dailyInterestRate: number; // e.g. 0.05 for 5%
  finalBonusRate: number; // e.g. 0.10 for 10%
  maxBudget: number; // e.g. 200
  currency: string;
  appName: string;
}

export type TransactionType =
  | 'initial'
  | 'daily_allowance'
  | 'withdrawal'
  | 'interest'
  | 'final_bonus'
  | 'adjustment';

export type TransactionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'deleted';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number; // Positive for income/initial, negative for withdrawal
  label: string;
  note?: string;
  status: TransactionStatus;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  withdrawalsJson: string; // Serialized array of SimulatedWithdrawal
  resultFinalBalance: number;
  resultInterestLost: number;
  createdAt: string;
}

export interface SimulatedWithdrawal {
  date: string;
  amount: number;
  label: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValueJson?: string;
  newValueJson?: string;
  createdAt: string;
}

export interface DailyEvolutionRow {
  date: string;
  dayIndex: number;
  startBalance: number;
  allowanceAdded: number;
  initialCapitalAdded: number;
  adjustmentsAdded: number;
  withdrawalsSubtracted: number;
  balanceBeforeInterest: number;
  interestRate: number;
  interestEarned: number;
  endBalance: number;
  cumulativeInterest: number;
  projectedFinalBalance: number; // what the final balance would be if no more withdrawals from this point
}

export interface SimulationResult {
  scenarioName: string;
  totalWithdrawn: number;
  finalBalanceBeforeBonus: number;
  finalBonus: number;
  finalBalanceWithBonus: number;
  cumulativeInterest: number;
  interestLost: number;
  differenceFromMax: number; // difference compared to "no withdrawal" scenario
  evolution: DailyEvolutionRow[];
}
