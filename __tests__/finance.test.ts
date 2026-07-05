import { describe, it, expect } from 'vitest';
import {
  calculateDailyEvolution,
  calculateScenario,
  getAvailableBalanceAtDate,
  validateWithdrawal,
  diffDays,
} from '../src/lib/finance';
import { FinancialParams, Transaction } from '../src/types';

// Standard baseline params for Lisa's Budget
const baseParams: FinancialParams = {
  startDate: '2026-07-13',
  endDate: '2026-08-10',
  initialCapital: 10,
  dailyAllowance: 2.10,
  dailyInterestRate: 0.05, // 5%
  finalBonusRate: 0.10, // 10%
  maxBudget: 200,
  currency: 'EUR',
  appName: "Banque de l'été",
};

describe('Moteur Financier - Banque de l\'été', () => {
  
  it('doit calculer correctement le nombre de jours de la période (29 jours)', () => {
    const days = diffDays(baseParams.startDate, baseParams.endDate) + 1;
    expect(days).toBe(29);
  });

  it('1. Scénario sans retrait : doit aboutir à environ 196,44 € au 10 août bonus compris', () => {
    // Run the calculation with no withdrawals
    const evolution = calculateDailyEvolution(baseParams, []);
    const finalRow = evolution[evolution.length - 1];
    
    expect(finalRow).toBeDefined();
    
    // Balance before bonus
    const finalBalanceBeforeBonus = finalRow.endBalance;
    expect(parseFloat(finalBalanceBeforeBonus.toFixed(2))).toBe(178.58);
    
    // Final balance with 10% bonus
    const bonus = finalBalanceBeforeBonus * baseParams.finalBonusRate;
    const finalBalanceWithBonus = finalBalanceBeforeBonus + bonus;
    
    expect(parseFloat(finalBalanceWithBonus.toFixed(2))).toBe(196.44);
    expect(finalBalanceWithBonus).toBeLessThanOrEqual(baseParams.maxBudget);
  });

  it('2. Scénario avec un retrait unique et calcul des intérêts perdus', () => {
    // Lisa withdraws 10 € on 2026-07-20
    const withdrawals = [{ date: '2026-07-20', amount: 10, label: 'Glace et Cinéma' }];
    
    const result = calculateScenario(baseParams, withdrawals);
    
    // Total withdrawn should be 10
    expect(result.totalWithdrawn).toBe(10);
    
    // Interest lost compared to reference scenario
    expect(result.interestLost).toBeGreaterThan(0);
    
    // Final balance is lower than 196.44
    expect(result.finalBalanceWithBonus).toBeLessThan(196.44);
    
    // Coût réel (retrait + intérêts perdus)
    const costReal = result.differenceFromMax;
    expect(costReal).toBeGreaterThan(10); // cost is withdrawal + lost interest
  });

  it('3. Scénario avec plusieurs retraits', () => {
    // Lisa withdraws 5 € on July 18 and 15 € on August 1
    const withdrawals = [
      { date: '2026-07-18', amount: 5, label: 'Glace' },
      { date: '2026-08-01', amount: 15, label: 'Livre' },
    ];
    
    const result = calculateScenario(baseParams, withdrawals);
    
    expect(result.totalWithdrawn).toBe(20);
    expect(result.interestLost).toBeGreaterThan(0);
    expect(result.finalBalanceWithBonus).toBeLessThan(196.44);
  });

  it('4. Retrait impossible si le solde devient négatif', () => {
    // Day 1 available is 12.10
    const mockTx: Transaction[] = [];
    
    // Try to withdraw 15 € on day 1
    const validation1 = validateWithdrawal(baseParams, mockTx, '2026-07-13', 15);
    expect(validation1.valid).toBe(false);
    expect(validation1.error).toContain('Solde insuffisant');
    
    // Try to withdraw 10 € on day 1 (should be valid)
    const validation2 = validateWithdrawal(baseParams, mockTx, '2026-07-13', 10);
    expect(validation2.valid).toBe(true);
    expect(validation2.adjustedAmount).toBe(10);
  });

  it('5. Calcul des intérêts après retrait', () => {
    // Verify that daily interest rate is applied to the balance AFTER the daily withdrawal
    // Day 1: start balance 0 + allowance 2.10 + initial 10 = 12.10.
    // Let's add a transaction of type withdrawal of 5 € on day 1
    const transactions: Transaction[] = [
      {
        id: 'tx1',
        date: '2026-07-13',
        type: 'withdrawal',
        amount: -5,
        label: 'Achat',
        status: 'approved',
      },
    ];
    
    const evolution = calculateDailyEvolution(baseParams, transactions);
    const day1 = evolution[0];
    
    // Balance before interest should be 12.10 - 5 = 7.10
    expect(day1.balanceBeforeInterest).toBe(7.10);
    
    // Interest earned should be 7.10 * 0.05 = 0.355
    expect(day1.interestEarned).toBe(0.355);
    
    // End balance should be 7.10 + 0.355 = 7.455
    expect(day1.endBalance).toBe(7.455);
  });

  it('6. Calcul du bonus final de 10%', () => {
    const res = calculateScenario(baseParams, []);
    expect(res.finalBonus).toBe(res.finalBalanceBeforeBonus * 0.10);
    expect(res.finalBalanceWithBonus).toBe(res.finalBalanceBeforeBonus + res.finalBonus);
  });

  it('7. Respect du budget maximal de 200 €', () => {
    const res = calculateScenario(baseParams, []);
    expect(res.finalBalanceWithBonus).toBeLessThanOrEqual(200);
  });

  it('8. Calcul de la différence avec modification de paramètres', () => {
    // If daily interest rate increases to 10% (0.10)
    const customParams: FinancialParams = {
      ...baseParams,
      dailyInterestRate: 0.10,
    };
    
    const res = calculateScenario(customParams, []);
    
    // Should earn much more than with 5%
    expect(res.finalBalanceWithBonus).toBeGreaterThan(196.44);
    // And this now exceeds the 200 € budget!
    expect(res.finalBalanceWithBonus).toBeGreaterThan(200);
  });
});
