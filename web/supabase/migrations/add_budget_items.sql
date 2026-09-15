-- Create categories table (if not exists)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_type VARCHAR(20) NOT NULL UNIQUE,  -- 'INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard categories (if not already exists)
INSERT INTO public.categories (category_type, name) VALUES
  ('INCOME', 'Income'),
  ('BILLS', 'Bills'),
  ('EXPENSES', 'Expenses'),
  ('SAVINGS', 'Savings'),
  ('DEBT', 'Debt')
ON CONFLICT (category_type) DO NOTHING;

-- Create budget_items table
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_period_id UUID NOT NULL REFERENCES public.budget_periods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_name VARCHAR(100),  -- For detailed line items within a category
  budgeted_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_budget_item UNIQUE(budget_period_id, user_id, category_id, subcategory_name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_budget_items_period ON public.budget_items(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_user ON public.budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category_id);

-- Enable RLS
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own budget items
CREATE POLICY "Users can view their own budget items" ON public.budget_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget items" ON public.budget_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget items" ON public.budget_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget items" ON public.budget_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create view for budget item actuals
CREATE OR REPLACE VIEW public.v_budget_item_actuals AS
SELECT
  bi.id AS budget_item_id,
  bi.budget_period_id,
  bi.user_id,
  bi.category_id,
  bi.subcategory_name,
  bi.budgeted_amount,
  COALESCE(SUM(ABS(t.amount)), 0) AS actual_amount,
  bi.budgeted_amount - COALESCE(SUM(ABS(t.amount)), 0) AS remaining_amount
FROM public.budget_items bi
LEFT JOIN public.budget_periods p ON p.id = bi.budget_period_id
LEFT JOIN public.transactions t
  ON t.user_id = bi.user_id
  AND t.category_type = (SELECT category_type FROM public.categories WHERE id = bi.category_id)
  AND t.transaction_date BETWEEN p.start_date AND p.end_date
GROUP BY bi.id, bi.budget_period_id, bi.user_id, bi.category_id, bi.subcategory_name, bi.budgeted_amount;

-- Create view for budget group totals
CREATE OR REPLACE VIEW public.v_budget_group_totals AS
SELECT
  bi.budget_period_id,
  bi.user_id,
  c.category_type,
  SUM(bi.budgeted_amount) AS budgeted,
  COALESCE(SUM(a.actual_amount), 0) AS actual,
  COALESCE(SUM(a.actual_amount), 0) - SUM(bi.budgeted_amount) AS variance
FROM public.budget_items bi
JOIN public.categories c ON c.id = bi.category_id
LEFT JOIN public.v_budget_item_actuals a ON a.budget_item_id = bi.id
GROUP BY bi.budget_period_id, bi.user_id, c.category_type;

-- Create view for period summary (headline numbers)
CREATE OR REPLACE VIEW public.v_period_summary AS
SELECT
  p.id AS budget_period_id,
  p.user_id,
  p.starting_balance,
  COALESCE(g.income, 0) AS income_actual,
  COALESCE(g.bills, 0) AS bills_actual,
  COALESCE(g.expenses, 0) AS expenses_actual,
  COALESCE(g.savings, 0) AS savings_actual,
  COALESCE(g.debt, 0) AS debt_actual,
  p.starting_balance
    + COALESCE(g.income, 0)
    - COALESCE(g.bills, 0)
    - COALESCE(g.expenses, 0)
    - COALESCE(g.savings, 0)
    - COALESCE(g.debt, 0) AS left_to_spend,
  COALESCE(b.income_budget, 0) AS income_budget,
  COALESCE(b.bills_budget, 0) AS bills_budget,
  COALESCE(b.expenses_budget, 0) AS expenses_budget,
  COALESCE(b.savings_budget, 0) AS savings_budget,
  COALESCE(b.debt_budget, 0) AS debt_budget,
  GREATEST(LEAST(p.end_date - p.start_date + 1, p.end_date - CURRENT_DATE + 1), 0) AS days_left
FROM public.budget_periods p
LEFT JOIN LATERAL (
  SELECT
    SUM(actual) FILTER (WHERE category_type = 'INCOME') AS income,
    SUM(actual) FILTER (WHERE category_type = 'BILLS') AS bills,
    SUM(actual) FILTER (WHERE category_type = 'EXPENSES') AS expenses,
    SUM(actual) FILTER (WHERE category_type = 'SAVINGS') AS savings,
    SUM(actual) FILTER (WHERE category_type = 'DEBT') AS debt
  FROM public.v_budget_group_totals bgt
  WHERE bgt.budget_period_id = p.id
) g ON TRUE
LEFT JOIN LATERAL (
  SELECT
    SUM(budgeted_amount) FILTER (WHERE category_type = 'INCOME') AS income_budget,
    SUM(budgeted_amount) FILTER (WHERE category_type = 'BILLS') AS bills_budget,
    SUM(budgeted_amount) FILTER (WHERE category_type = 'EXPENSES') AS expenses_budget,
    SUM(budgeted_amount) FILTER (WHERE category_type = 'SAVINGS') AS savings_budget,
    SUM(budgeted_amount) FILTER (WHERE category_type = 'DEBT') AS debt_budget
  FROM public.budget_items bi
  WHERE bi.budget_period_id = p.id
) b ON TRUE;

-- Grant access to authenticated users
GRANT SELECT ON public.v_budget_item_actuals TO authenticated;
GRANT SELECT ON public.v_budget_group_totals TO authenticated;
GRANT SELECT ON public.v_period_summary TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
