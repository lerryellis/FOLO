-- Track monthly savings achievements
CREATE TABLE IF NOT EXISTS public.monthly_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL, -- First day of the month (e.g., 2026-09-01)
    income_amount DECIMAL(12,2) NOT NULL,
    expenses_amount DECIMAL(12,2) NOT NULL,
    savings_amount DECIMAL(12,2) NOT NULL, -- income - expenses
    is_confirmed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month)
);

-- Index for quick lookups by user and month
CREATE INDEX IF NOT EXISTS idx_achievements_user_month
ON public.monthly_achievements(user_id, month DESC);
