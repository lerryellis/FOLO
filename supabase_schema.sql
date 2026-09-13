-- ============================================
-- BUDGET PLANNER APP - SUPABASE SCHEMA
-- ============================================

-- 1. Users (using Supabase Auth, but storing additional profile info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    currency_symbol TEXT DEFAULT '$',
    currency_code TEXT DEFAULT 'USD',
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Goal Transactions (Payments towards goals)
CREATE TABLE IF NOT EXISTS public.goal_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.financial_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_budget_periods_user_id ON public.budget_periods(user_id);
CREATE INDEX idx_budget_items_budget_period ON public.budget_items(budget_period_id);
CREATE INDEX idx_budget_items_category ON public.budget_items(category_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_budget_period ON public.transactions(budget_period_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX idx_goal_transactions_goal_id ON public.goal_transactions(goal_id);

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

-- User can only view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- User can only view their own data
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for budget_periods
CREATE POLICY "Users can view own budget periods" ON public.budget_periods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget periods" ON public.budget_periods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget periods" ON public.budget_periods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget periods" ON public.budget_periods
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for financial_goals
CREATE POLICY "Users can view own goals" ON public.financial_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON public.financial_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON public.financial_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON public.financial_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Budget items accessed through user_id check
CREATE POLICY "Users can view own budget items" ON public.budget_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget items" ON public.budget_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget items" ON public.budget_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget items" ON public.budget_items
    FOR DELETE USING (auth.uid() = user_id);

-- Goal transactions
CREATE POLICY "Users can view own goal transactions" ON public.goal_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal transactions" ON public.goal_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal transactions" ON public.goal_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal transactions" ON public.goal_transactions
    FOR DELETE USING (auth.uid() = user_id);
