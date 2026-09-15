import { supabase } from './supabase';
import type { Goal } from './folo-data';

type GoalChanges = Pick<Goal, 'name' | 'type' | 'targetMinor'>;

/**
 * Create a new financial goal
 */
export async function createGoal(
  userId: string,
  goal: Omit<Goal, 'id' | 'percent' | 'icon' | 'detail'>
) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        user_id: userId,
        goal_type: goal.type,
        name: goal.name,
        target_amount: goal.targetMinor / 100, // Convert from minor units
        current_progress: goal.progressMinor / 100,
        starting_amount: 0,
        is_completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      type: data.goal_type as 'SAVINGS' | 'DEBT',
      targetMinor: Math.round(data.target_amount * 100),
      progressMinor: Math.round(data.current_progress * 100),
      percent: Math.round((data.current_progress / data.target_amount) * 100),
      icon: getDefaultIcon(data.goal_type),
      detail: `Target · ${new Date().toLocaleDateString('en-US', { year: '2-digit', month: 'short' })}`,
    };
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}

/**
 * Fetch all goals for a user
 */
export async function fetchGoals(userId: string) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any): Goal => ({
      id: row.id,
      name: row.name,
      type: row.goal_type as 'SAVINGS' | 'DEBT',
      targetMinor: Math.round(row.target_amount * 100),
      progressMinor: Math.round(row.current_progress * 100),
      percent: Math.min(
        100,
        Math.round((row.current_progress / row.target_amount) * 100)
      ),
      icon: getDefaultIcon(row.goal_type),
      detail: row.is_completed
        ? row.goal_type === 'DEBT'
          ? 'Completed · Cleared'
          : 'Completed · Achieved'
        : `Target · ${new Date(row.goal_date || new Date()).toLocaleDateString('en-US', {
            year: '2-digit',
            month: 'short',
          })}`,
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(goalId: string, newProgressMinor: number) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .update({ current_progress: newProgressMinor / 100 })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
}

/** Update the editable fields for a goal owned by the current user. */
export async function updateGoal(userId: string, goalId: string, changes: GoalChanges) {
  const { data: currentGoal, error: currentGoalError } = await supabase
    .from('financial_goals')
    .select('current_progress')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (currentGoalError) throw currentGoalError;

  const progressMinor = Math.round(currentGoal.current_progress * 100);
  if (changes.targetMinor < progressMinor) {
    throw new Error('Target amount cannot be less than the current progress.');
  }

  const { data, error } = await supabase
    .from('financial_goals')
    .update({
      name: changes.name,
      goal_type: changes.type,
      target_amount: changes.targetMinor / 100,
      is_completed: changes.targetMinor <= progressMinor,
    })
    .eq('id', goalId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    type: data.goal_type as Goal['type'],
    targetMinor: Math.round(data.target_amount * 100),
    progressMinor: Math.round(data.current_progress * 100),
    percent: Math.min(100, Math.round((data.current_progress / data.target_amount) * 100)),
    icon: getDefaultIcon(data.goal_type),
    detail: `Target · ${new Date(data.goal_date || new Date()).toLocaleDateString('en-US', { year: '2-digit', month: 'short' })}`,
  } satisfies Goal;
}

/**
 * Mark goal as completed
 */
export async function completeGoal(goalId: string) {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .update({ is_completed: true })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing goal:', error);
    throw error;
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(userId: string, goalId: string) {
  try {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

/**
 * Get default icon based on goal type
 */
function getDefaultIcon(goalType: string): string {
  const icons: Record<string, string> = {
    SAVINGS: 'Shield',
    DEBT: 'CreditCard',
  };
  return icons[goalType] || 'Shield';
}
