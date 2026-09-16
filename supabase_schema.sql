-- ============================================
-- BUDGET PLANNER APP - SUPABASE SCHEMA
-- ============================================

-- 1. Users (using Supabase Auth, but storing additional profile info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    currency_symbol TEXT NOT NULL DEFAULT '₵',
    currency_code TEXT NOT NULL DEFAULT 'GHS',
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Keep defaults aligned when this setup file is rerun against an existing project.
ALTER TABLE public.user_profiles ALTER COLUMN currency_symbol SET DEFAULT '₵';
ALTER TABLE public.user_profiles ALTER COLUMN currency_code SET DEFAULT 'GHS';

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    category_type TEXT NOT NULL, -- 'INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_type, name)
);

-- 3. Budget Periods (monthly/custom budgets)
CREATE TABLE IF NOT EXISTS public.budget_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    starting_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, start_date, end_date)
);

-- 4. Budget Items (per category per budget period)
CREATE TABLE IF NOT EXISTS public.budget_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_period_id UUID NOT NULL REFERENCES public.budget_periods(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    subcategory_name TEXT, -- e.g., "Paycheck", "Rent", "Food"
    budgeted_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(budget_period_id, category_id, subcategory_name)
);

-- 5. Transactions (Income/Expense entries)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    budget_period_id UUID NOT NULL REFERENCES public.budget_periods(id) ON DELETE CASCADE,
    budget_item_id UUID REFERENCES public.budget_items(id) ON DELETE SET NULL,
    category_type TEXT NOT NULL, -- 'INCOME', 'BILLS', 'EXPENSES', 'SAVINGS', 'DEBT'
    category_name TEXT NOT NULL,
    subcategory_name TEXT,
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Financial Goals (Savings & Debt)
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL, -- 'SAVINGS' or 'DEBT'
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    starting_amount DECIMAL(12,2) DEFAULT 0,
    current_progress DECIMAL(12,2) DEFAULT 0,
    goal_date DATE,
    description TEXT,
    is_completed BOOLEAN DEFAULT false,
    -- Monthly payment tracking
    monthly_payment_amount DECIMAL(12,2), -- Amount paid monthly (optional)
    payment_start_date DATE, -- When monthly payments start
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Goal Transactions (Payments towards goals)
CREATE TABLE IF NOT EXISTS public.goal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_periods_user_id ON public.budget_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_period ON public.budget_items(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category ON public.budget_items(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_user_id ON public.budget_items(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_period ON public.transactions(budget_period_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_item ON public.transactions(budget_item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_period_date
    ON public.transactions(user_id, budget_period_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_goal_id ON public.goal_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_user_id ON public.goal_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_transactions_transaction_id ON public.goal_transactions(transaction_id);
CREATE UNIQUE INDEX IF NOT EXISTS goal_transactions_goal_transaction_key
    ON public.goal_transactions(goal_id, transaction_id)
    WHERE transaction_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;

-- Explicit grants are required for projects using the newer opt-in Data API model.
-- Signed-out users receive no access to financial data.
REVOKE ALL ON TABLE
    public.user_profiles,
    public.categories,
    public.budget_periods,
    public.budget_items,
    public.transactions,
    public.financial_goals,
    public.goal_transactions
FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.user_profiles,
    public.categories,
    public.budget_periods,
    public.budget_items,
    public.transactions,
    public.financial_goals,
    public.goal_transactions
TO authenticated;

-- Drop before recreating so this setup file remains safe to rerun.
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own budget periods" ON public.budget_periods;
DROP POLICY IF EXISTS "Users can insert own budget periods" ON public.budget_periods;
DROP POLICY IF EXISTS "Users can update own budget periods" ON public.budget_periods;
DROP POLICY IF EXISTS "Users can delete own budget periods" ON public.budget_periods;
CREATE POLICY "Users can view own budget periods" ON public.budget_periods
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own budget periods" ON public.budget_periods
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own budget periods" ON public.budget_periods
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own budget periods" ON public.budget_periods
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can insert own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can update own budget items" ON public.budget_items;
DROP POLICY IF EXISTS "Users can delete own budget items" ON public.budget_items;
CREATE POLICY "Users can view own budget items" ON public.budget_items
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own budget items" ON public.budget_items
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own budget items" ON public.budget_items
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own budget items" ON public.budget_items
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.financial_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.financial_goals;
CREATE POLICY "Users can view own goals" ON public.financial_goals
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own goals" ON public.financial_goals
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own goals" ON public.financial_goals
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own goals" ON public.financial_goals
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own goal transactions" ON public.goal_transactions;
DROP POLICY IF EXISTS "Users can insert own goal transactions" ON public.goal_transactions;
DROP POLICY IF EXISTS "Users can update own goal transactions" ON public.goal_transactions;
DROP POLICY IF EXISTS "Users can delete own goal transactions" ON public.goal_transactions;
CREATE POLICY "Users can view own goal transactions" ON public.goal_transactions
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own goal transactions" ON public.goal_transactions
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own goal transactions" ON public.goal_transactions
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own goal transactions" ON public.goal_transactions
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- SHARED REPORTING VIEWS
-- ============================================
-- security_invoker makes every view obey the RLS policies on its source tables.

CREATE OR REPLACE VIEW public.v_budget_item_actuals
WITH (security_invoker = true)
AS
SELECT
    bi.id AS budget_item_id,
    bi.user_id,
    bi.budget_period_id,
    bi.category_id,
    c.category_type,
    c.name AS category_name,
    bi.subcategory_name,
    bi.budgeted_amount,
    COALESCE(
        SUM(t.amount) FILTER (
            WHERE t.transaction_date BETWEEN bp.start_date AND bp.end_date
        ),
        0
    )::DECIMAL(12,2) AS actual_amount,
    (
        COALESCE(
            SUM(t.amount) FILTER (
                WHERE t.transaction_date BETWEEN bp.start_date AND bp.end_date
            ),
            0
        ) - bi.budgeted_amount
    )::DECIMAL(12,2) AS variance_amount
FROM public.budget_items AS bi
JOIN public.budget_periods AS bp
    ON bp.id = bi.budget_period_id
    AND bp.user_id = bi.user_id
JOIN public.categories AS c
    ON c.id = bi.category_id
    AND c.user_id = bi.user_id
LEFT JOIN public.transactions AS t
    ON t.budget_item_id = bi.id
    AND t.budget_period_id = bi.budget_period_id
    AND t.user_id = bi.user_id
GROUP BY
    bi.id,
    bi.user_id,
    bi.budget_period_id,
    bi.category_id,
    c.category_type,
    c.name,
    bi.subcategory_name,
    bi.budgeted_amount;

CREATE OR REPLACE VIEW public.v_budget_group_totals
WITH (security_invoker = true)
AS
WITH group_types(category_type) AS (
    VALUES
        ('INCOME'::TEXT),
        ('BILLS'::TEXT),
        ('EXPENSES'::TEXT),
        ('SAVINGS'::TEXT),
        ('DEBT'::TEXT)
),
budgeted AS (
    SELECT
        bi.user_id,
        bi.budget_period_id,
        c.category_type,
        SUM(bi.budgeted_amount)::DECIMAL(12,2) AS budgeted_amount
    FROM public.budget_items AS bi
    JOIN public.categories AS c
        ON c.id = bi.category_id
        AND c.user_id = bi.user_id
    GROUP BY bi.user_id, bi.budget_period_id, c.category_type
),
actual AS (
    SELECT
        t.user_id,
        t.budget_period_id,
        t.category_type,
        SUM(t.amount)::DECIMAL(12,2) AS actual_amount
    FROM public.transactions AS t
    JOIN public.budget_periods AS bp
        ON bp.id = t.budget_period_id
        AND bp.user_id = t.user_id
        AND t.transaction_date BETWEEN bp.start_date AND bp.end_date
    GROUP BY t.user_id, t.budget_period_id, t.category_type
)
SELECT
    bp.user_id,
    bp.id AS budget_period_id,
    gt.category_type,
    COALESCE(b.budgeted_amount, 0)::DECIMAL(12,2) AS budgeted_amount,
    COALESCE(a.actual_amount, 0)::DECIMAL(12,2) AS actual_amount,
    (COALESCE(a.actual_amount, 0) - COALESCE(b.budgeted_amount, 0))::DECIMAL(12,2) AS variance_amount
FROM public.budget_periods AS bp
CROSS JOIN group_types AS gt
LEFT JOIN budgeted AS b
    ON b.user_id = bp.user_id
    AND b.budget_period_id = bp.id
    AND b.category_type = gt.category_type
LEFT JOIN actual AS a
    ON a.user_id = bp.user_id
    AND a.budget_period_id = bp.id
    AND a.category_type = gt.category_type;

CREATE OR REPLACE VIEW public.v_period_summary
WITH (security_invoker = true)
AS
SELECT
    bp.id AS budget_period_id,
    bp.user_id,
    bp.start_date,
    bp.end_date,
    bp.starting_balance,
    COALESCE(SUM(gt.budgeted_amount) FILTER (WHERE gt.category_type = 'INCOME'), 0)::DECIMAL(12,2) AS budgeted_income,
    COALESCE(SUM(gt.actual_amount) FILTER (WHERE gt.category_type = 'INCOME'), 0)::DECIMAL(12,2) AS actual_income,
    COALESCE(SUM(gt.budgeted_amount) FILTER (WHERE gt.category_type <> 'INCOME'), 0)::DECIMAL(12,2) AS budgeted_outflow,
    COALESCE(SUM(gt.actual_amount) FILTER (WHERE gt.category_type <> 'INCOME'), 0)::DECIMAL(12,2) AS actual_outflow,
    (
        bp.starting_balance
        + COALESCE(SUM(gt.budgeted_amount) FILTER (WHERE gt.category_type = 'INCOME'), 0)
        - COALESCE(SUM(gt.budgeted_amount) FILTER (WHERE gt.category_type <> 'INCOME'), 0)
    )::DECIMAL(12,2) AS planned_left_to_spend,
    (
        bp.starting_balance
        + COALESCE(SUM(gt.actual_amount) FILTER (WHERE gt.category_type = 'INCOME'), 0)
        - COALESCE(SUM(gt.actual_amount) FILTER (WHERE gt.category_type <> 'INCOME'), 0)
    )::DECIMAL(12,2) AS left_to_spend,
    (
        COALESCE(SUM(gt.actual_amount) FILTER (WHERE gt.category_type = 'INCOME'), 0)
        - COALESCE(SUM(gt.actual_amount) FILTER (WHERE gt.category_type <> 'INCOME'), 0)
    )::DECIMAL(12,2) AS net_position,
    GREATEST(bp.end_date - CURRENT_DATE, 0) AS days_remaining,
    CASE
        WHEN CURRENT_DATE < bp.start_date THEN 'upcoming'
        WHEN CURRENT_DATE > bp.end_date THEN 'complete'
        ELSE 'active'
    END AS period_status
FROM public.budget_periods AS bp
LEFT JOIN public.v_budget_group_totals AS gt
    ON gt.user_id = bp.user_id
    AND gt.budget_period_id = bp.id
GROUP BY bp.id, bp.user_id, bp.start_date, bp.end_date, bp.starting_balance;

CREATE OR REPLACE VIEW public.v_goal_progress
WITH (security_invoker = true)
AS
SELECT
    fg.id AS goal_id,
    fg.user_id,
    fg.goal_type,
    fg.name,
    fg.target_amount,
    fg.starting_amount,
    fg.current_progress,
    (COALESCE(fg.starting_amount, 0) + COALESCE(fg.current_progress, 0))::DECIMAL(12,2) AS progress_amount,
    GREATEST(
        fg.target_amount - (COALESCE(fg.starting_amount, 0) + COALESCE(fg.current_progress, 0)),
        0
    )::DECIMAL(12,2) AS remaining_amount,
    LEAST(
        100,
        ROUND(
            (
                (COALESCE(fg.starting_amount, 0) + COALESCE(fg.current_progress, 0))
                / NULLIF(fg.target_amount, 0)
            ) * 100,
            2
        )
    ) AS progress_percent,
    (
        fg.is_completed
        OR (COALESCE(fg.starting_amount, 0) + COALESCE(fg.current_progress, 0)) >= fg.target_amount
    ) AS is_achieved,
    CASE
        WHEN fg.is_completed
            OR (COALESCE(fg.starting_amount, 0) + COALESCE(fg.current_progress, 0)) >= fg.target_amount
            THEN CASE WHEN fg.goal_type = 'DEBT' THEN 'Cleared' ELSE 'Achieved' END
        ELSE 'In progress'
    END AS status_label,
    fg.goal_date,
    fg.description,
    fg.created_at,
    fg.updated_at
FROM public.financial_goals AS fg;

REVOKE ALL ON TABLE
    public.v_budget_item_actuals,
    public.v_budget_group_totals,
    public.v_period_summary,
    public.v_goal_progress
FROM anon, authenticated;

GRANT SELECT ON TABLE
    public.v_budget_item_actuals,
    public.v_budget_group_totals,
    public.v_period_summary,
    public.v_goal_progress
TO authenticated;
