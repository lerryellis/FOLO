-- Add monthly payment tracking to financial_goals
ALTER TABLE public.financial_goals
ADD COLUMN IF NOT EXISTS monthly_payment_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_start_date DATE;

-- Create an index on payment_start_date for query optimization
CREATE INDEX IF NOT EXISTS idx_goals_payment_start_date
ON public.financial_goals(user_id, payment_start_date)
WHERE payment_start_date IS NOT NULL;
