import { supabase } from './supabase';

/**
 * Clear all user data from Supabase (for testing/reset)
 */
export async function resetAllUserData(userId: string) {
  try {
    console.log('🗑️  Starting data reset for user:', userId);

    // Delete in order of foreign key dependencies
    const results = {
      goalTransactions: 0,
      goals: 0,
      transactions: 0,
      budgetItems: 0,
      budgetPeriods: 0,
      categories: 0,
    };

    // Delete goal transactions first (references goals)
    const { count: gtCount } = await supabase
      .from('goal_transactions')
      .delete()
      .eq('user_id', userId);
    results.goalTransactions = gtCount || 0;

    // Delete goals
    const { count: gCount } = await supabase
      .from('financial_goals')
      .delete()
      .eq('user_id', userId);
    results.goals = gCount || 0;

    // Delete transactions (references budget_items and budget_periods)
    const { count: tCount } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    results.transactions = tCount || 0;

    // Delete budget items
    const { data: budgetPeriods } = await supabase
      .from('budget_periods')
      .select('id')
      .eq('user_id', userId);

    if (budgetPeriods?.length) {
      const periodIds = budgetPeriods.map((p) => p.id);
      const { count: biCount } = await supabase
        .from('budget_items')
        .delete()
        .in('budget_period_id', periodIds);
      results.budgetItems = biCount || 0;
    }

    // Delete budget periods
    const { count: bpCount } = await supabase
      .from('budget_periods')
      .delete()
      .eq('user_id', userId);
    results.budgetPeriods = bpCount || 0;

    // Delete categories
    const { count: cCount } = await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId);
    results.categories = cCount || 0;

    console.log('✅ Data reset complete:', results);
    return results;
  } catch (error) {
    console.error('❌ Error resetting data:', error);
    throw error;
  }
}
