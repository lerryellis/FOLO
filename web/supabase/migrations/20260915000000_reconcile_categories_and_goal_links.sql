-- Reconcile the early global-category migration with FOLO's canonical,
-- tenant-owned category model. Also make a goal log entry refer to the exact
-- transaction that funded it, so deleting one link cannot remove every entry.

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE;

-- A legacy installation has one global row per category type. Create an owned
-- copy for every existing budget owner before moving its budget items over.
INSERT INTO public.categories (user_id, category_type, name)
SELECT DISTINCT bi.user_id, legacy.category_type, legacy.name
FROM public.budget_items AS bi
JOIN public.categories AS legacy ON legacy.id = bi.category_id
WHERE legacy.user_id IS NULL
ON CONFLICT (user_id, category_type, name) DO NOTHING;

UPDATE public.budget_items AS bi
SET category_id = owned.id
FROM public.categories AS legacy
JOIN public.categories AS owned
  ON owned.user_id = bi.user_id
 AND owned.category_type = legacy.category_type
 AND owned.name = legacy.name
WHERE legacy.id = bi.category_id
  AND legacy.user_id IS NULL;

-- Replace the legacy global uniqueness rule if it is present. This leaves any
-- already-correct user-scoped constraint untouched.
DO $$
DECLARE constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.categories'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) = 'UNIQUE (category_type)';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.categories DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.categories'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) = 'UNIQUE (user_id, category_type, name)'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_user_type_name_key UNIQUE (user_id, category_type, name);
  END IF;
END $$;

-- Global rows are no longer used once dependent budget items are migrated.
DELETE FROM public.categories WHERE user_id IS NULL;

ALTER TABLE public.categories
  ALTER COLUMN user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_user_type
  ON public.categories (user_id, category_type);

ALTER TABLE public.goal_transactions
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Legacy manually-entered goal logs remain valid with a NULL transaction_id.
-- New application links are unique per goal/transaction pair.
CREATE UNIQUE INDEX IF NOT EXISTS goal_transactions_goal_transaction_key
  ON public.goal_transactions (goal_id, transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_goal_transactions_transaction_id
  ON public.goal_transactions (transaction_id);
