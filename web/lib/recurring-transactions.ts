import type { Transaction } from './folo-data';
import { saveTransaction } from './transaction-operations';

/**
 * Create next month's recurring transaction
 * Called monthly to duplicate recurring transactions
 */
export async function createRecurringTransactionForNextMonth(
  userId: string,
  transaction: Transaction
): Promise<Transaction | null> {
  // Only create if transaction is marked as recurring
  if (!transaction.isRecurring) {
    return null;
  }

  // Check if we've passed the recurring end date
  if (transaction.recurringEndDate) {
    const endDate = new Date(transaction.recurringEndDate);
    const today = new Date();
    if (today > endDate) {
      return null; // Stop recurring
    }
  }

  try {
    // Create next month's transaction
    const currentDate = new Date(transaction.date);
    const nextMonthDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      currentDate.getDate()
    );

    const nextMonthTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(), // New transaction ID
      date: nextMonthDate.toISOString().split('T')[0],
    };

    // Save the recurring transaction
    const savedTx = await saveTransaction(userId, nextMonthTransaction);
    return savedTx;
  } catch (error) {
    console.error('Failed to create recurring transaction:', error);
    return null;
  }
}

/**
 * Process all recurring transactions for a specific user
 * Typically called once per month
 */
export async function processMonthlyRecurringTransactions(
  userId: string,
  transactions: Transaction[]
): Promise<{ created: number; failed: number }> {
  let created = 0;
  let failed = 0;

  for (const transaction of transactions) {
    if (transaction.isRecurring) {
      try {
        const result = await createRecurringTransactionForNextMonth(userId, transaction);
        if (result) {
          created++;
        } else {
          // Transaction may have ended or other reason
          console.debug(`Skipped recurring transaction: ${transaction.id}`);
        }
      } catch (error) {
        failed++;
        console.error(`Failed to process recurring transaction ${transaction.id}:`, error);
      }
    }
  }

  return { created, failed };
}

/**
 * Get all recurring transactions for a user
 */
export function getRecurringTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter((tx) => tx.isRecurring);
}

/**
 * Check if a transaction should be repeated this month
 * Based on date and recurring settings
 */
export function shouldRepeatThisMonth(transaction: Transaction): boolean {
  if (!transaction.isRecurring) {
    return false;
  }

  if (transaction.recurringEndDate) {
    const endDate = new Date(transaction.recurringEndDate);
    const today = new Date();
    if (today > endDate) {
      return false;
    }
  }

  return true;
}

/**
 * Format recurring transaction info for display
 */
export function getRecurringLabel(transaction: Transaction): string {
  if (!transaction.isRecurring) {
    return 'One-time';
  }

  if (transaction.recurringEndDate) {
    const endDate = new Date(transaction.recurringEndDate);
    return `Repeats monthly until ${endDate.toLocaleDateString()}`;
  }

  return 'Repeats monthly';
}

/**
 * Get the next occurrence date for a recurring transaction
 */
export function getNextOccurrenceDate(transaction: Transaction): string | null {
  if (!transaction.isRecurring) {
    return null;
  }

  const currentDate = new Date(transaction.date);
  const nextDate = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );

  // Check end date
  if (transaction.recurringEndDate) {
    const endDate = new Date(transaction.recurringEndDate);
    if (nextDate > endDate) {
      return null; // No more occurrences
    }
  }

  return nextDate.toISOString().split('T')[0];
}
