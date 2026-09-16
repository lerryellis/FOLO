import type { Transaction } from './folo-data';
import { saveTransaction } from './transaction-operations';

/**
 * Create all backdated recurring instances for a transaction
 * Called immediately when a recurring transaction is created with a past date
 */
export async function createBackdatedRecurringInstances(
  userId: string,
  transaction: Transaction
): Promise<{ created: number; failed: number }> {
  let created = 0;
  let failed = 0;

  if (!transaction.isRecurring) {
    return { created: 0, failed: 0 };
  }

  try {
    const transactionDate = new Date(transaction.date);
    const today = new Date();

    // Check end date
    const endDate = transaction.recurringEndDate ? new Date(transaction.recurringEndDate) : null;

    // Get first day of transaction month and first day of current month
    const startMonth = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // If the transaction date is already in the current month or future, no backdating needed
    if (startMonth >= endMonth) {
      return { created: 0, failed: 0 };
    }

    // Create instances for each month from transaction month to current month
    let currentMonth = new Date(startMonth);
    while (currentMonth < endMonth) {
      // Check if we've exceeded the end date
      if (endDate && currentMonth > endDate) {
        break;
      }

      // Create transaction for this month (on same day as original)
      const instanceDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        transactionDate.getDate()
      );

      // Skip the original transaction date (already saved)
      const isOriginalDate =
        instanceDate.getFullYear() === transactionDate.getFullYear() &&
        instanceDate.getMonth() === transactionDate.getMonth();

      if (!isOriginalDate) {
        try {
          const instanceTransaction: Transaction = {
            ...transaction,
            id: crypto.randomUUID(),
            date: instanceDate.toISOString().split('T')[0],
            // Mark as not pending since these are auto-generated from a fresh save
            pending: false,
          };

          await saveTransaction(userId, instanceTransaction);
          created++;
        } catch (error) {
          failed++;
          console.error(
            `Failed to create backdated recurring instance for ${instanceDate.toISOString().split('T')[0]}:`,
            error
          );
        }
      }

      // Move to next month
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
  } catch (error) {
    console.error('Error creating backdated recurring instances:', error);
  }

  return { created, failed };
}

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
