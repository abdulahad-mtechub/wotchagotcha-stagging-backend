-- Migration: add sub_category column to item table and foreign key to item_sub_category
ALTER TABLE IF EXISTS public.item
ADD COLUMN IF NOT EXISTS sub_category INT;

-- add foreign key constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'item' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'sub_category'
    ) THEN
        ALTER TABLE public.item
        ADD CONSTRAINT item_sub_category_fkey FOREIGN KEY (sub_category) REFERENCES public.item_sub_category(id) ON DELETE SET NULL;
    END IF;
END$$;
