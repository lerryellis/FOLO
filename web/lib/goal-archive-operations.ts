/**
 * Goal archiving operations
 * Archive completed goals to keep active goals clean
 */

import { supabase } from './supabase';
import type { Goal } from './folo-data';

/**
 * Mark a goal as completed/archived
 */
export async function archiveGoal(userId: string, goalId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('financial_goals')
      .update({
        is_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error archiving goal:', error);
    throw error;
  }
}

/**
 * Unarchive a goal (mark as active again)
 */
export async function unarchiveGoal(userId: string, goalId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('financial_goals')
      .update({
        is_completed: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unarchiving goal:', error);
    throw error;
  }
}

/**
 * Delete a goal permanently
 */
export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  try {
    // First delete associated goal transactions
    const { error: txError } = await supabase
      .from('goal_transactions')
      .delete()
      .eq('goal_id', goalId)
      .eq('user_id', userId);

    if (txError) throw txError;

    // Then delete the goal
    const { error: goalError } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (goalError) throw goalError;
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

/**
 * Archive all completed goals at once
 */
export async function archiveAllCompletedGoals(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('id')
      .eq('user_id', userId)
      .eq('is_completed', false); // Get all active goals

    if (error) throw error;

    if (!data || data.length === 0) return 0;

    // Find completed goals by fetching and checking percentage
    const { data: allGoals, error: fetchError } = await supabase
      .from('financial_goals')
      .select('id, current_progress, target_amount')
      .eq('user_id', userId)
      .eq('is_completed', false);

    if (fetchError) throw fetchError;

    const completedGoalIds = (allGoals || [])
      .filter((goal) => {
        const percent = (Number(goal.current_progress) / Number(goal.target_amount)) * 100;
        return percent >= 100;
      })
      .map((goal) => goal.id);

    if (completedGoalIds.length === 0) return 0;

    // Archive all completed goals
    const { error: updateError } = await supabase
      .from('financial_goals')
      .update({ is_completed: true })
      .in('id', completedGoalIds)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return completedGoalIds.length;
  } catch (error) {
    console.error('Error archiving completed goals:', error);
    throw error;
  }
}

/**
 * Get active goals (not completed)
 */
export function filterActiveGoals(goals: Goal[]): Goal[] {
  return goals.filter((goal) => goal.percent < 100);
}

/**
 * Get completed/archived goals
 */
export function filterCompletedGoals(goals: Goal[]): Goal[] {
  return goals.filter((goal) => goal.percent >= 100);
}
