-- Add transaction_id to banner table (store provider transaction id only)
ALTER TABLE public.banner
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);

-- Optional index for quick lookups by transaction_id
CREATE INDEX IF NOT EXISTS idx_banner_transaction_id ON public.banner (transaction_id);
