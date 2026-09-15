-- CRITICAL FIX: Correct budget_items RLS policies to use authenticated role
-- Previous policies were set to 'public' role instead of 'authenticated',
-- which prevented authenticated users from accessing their own budget items.

-- Drop incorrect policies
DROP POLICY IF EXISTS "Users can view their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can create their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can update their own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can delete their own budget items" ON public.budget_items;

-- Create correct policies for authenticated users
CREATE POLICY "Users can view their own budget items" ON public.budget_items
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget items" ON public.budget_items
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget items" ON public.budget_items
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget items" ON public.budget_items
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
