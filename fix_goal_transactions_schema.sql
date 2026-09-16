-- Fix goal_transactions table structure - ensure all required columns exist
ALTER TABLE public.goal_transactions
ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

ALTER TABLE public.goal_transactions  
ADD COLUMN IF NOT EXISTS amount DECIMAL(12,2);

ALTER TABLE public.goal_transactions
ADD COLUMN IF NOT EXISTS transaction_date DATE;

ALTER TABLE public.goal_transactions
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_goal_transactions_transaction_id 
ON public.goal_transactions(transaction_id);

CREATE UNIQUE INDEX IF NOT EXISTS goal_transactions_goal_transaction_key
ON public.goal_transactions(goal_id, transaction_id)
WHERE transaction_id IS NOT NULL;
