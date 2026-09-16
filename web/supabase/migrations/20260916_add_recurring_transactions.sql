-- Add recurring transaction columns to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_end_date DATE;

-- Create index for recurring transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_recurring
  ON public.transactions(user_id, is_recurring, recurring_end_date);
