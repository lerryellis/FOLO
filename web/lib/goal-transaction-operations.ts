import { supabase } from './supabase';

/**
 * Link a transaction to a goal (add to goal_transactions)
 */
export async function linkTransactionToGoal(
  userId: string,
  goalId: string,
  transactionId: string
) {
  try {
    const [{ data: transaction, error: transactionError }, { data: goal, error: goalError }] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, amount, transaction_date')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('financial_goals')
        .select('id')
        .eq('id', goalId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    if (transactionError) throw transactionError;
    if (goalError) throw goalError;
    if (!transaction || !goal) throw new Error('The transaction or goal is no longer available.');

    const { data, error } = await supabase
      .from('goal_transactions')
      .insert({
        user_id: userId,
        goal_id: goalId,
        transaction_id: transactionId,
        // Read these from the persisted transaction instead of trusting a
        // stale UI payload. `amount` remains for historical/manual entries.
        amount: Math.abs(transaction.amount),
        transaction_date: transaction.transaction_date,
      })
      .select()
      .single();

    if (error) throw error;

    // Update goal progress
    await updateGoalProgressFromTransactions(userId, goalId);
    return data;
  } catch (error) {
    console.error('Error linking transaction to goal:', error);
    throw error;
  }
}

/**
 * Unlink a transaction from a goal
 */
export async function unlinkTransactionFromGoal(userId: string, goalId: string, transactionId: string) {
  try {
    const { error } = await supabase
      .from('goal_transactions')
      .delete()
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .eq('transaction_id', transactionId);

    if (error) throw error;

    // Update goal progress
    await updateGoalProgressFromTransactions(userId, goalId);
  } catch (error) {
    console.error('Error unlinking transaction from goal:', error);
    throw error;
  }
}

/**
 * Get all transactions linked to a goal
 */
export async function getGoalTransactions(goalId: string) {
  try {
    const { data, error } = await supabase
      .from('goal_transactions')
      .select('*')
      .eq('goal_id', goalId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching goal transactions:', error);
    return [];
  }
}

/**
 * Calculate and update goal progress based on linked transactions
 */
export async function updateGoalProgressFromTransactions(userId: string, goalId: string) {
  try {
    // Sum all transactions for this goal
    const { data: goalTxns, error: fetchError } = await supabase
      .from('goal_transactions')
      .select('amount')
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const totalProgress = (goalTxns || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Update the goal's current_progress
    const { error: updateError } = await supabase
      .from('financial_goals')
      .update({ current_progress: totalProgress })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
}

/**
 * Get the goal progress percentage
 */
export async function getGoalProgress(goalId: string, targetAmount: number) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('current_progress')
      .eq('id', goalId)
      .single();

    if (error) throw error;

    const progress = data?.current_progress || 0;
    const percent = Math.min(100, Math.round((progress / targetAmount) * 100));
    return { progress, percent };
  } catch (error) {
    console.error('Error getting goal progress:', error);
    return { progress: 0, percent: 0 };
  }
}
