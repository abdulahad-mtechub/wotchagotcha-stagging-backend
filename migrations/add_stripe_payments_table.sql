-- Create or alter stripe_payments table to store main fields and raw JSON
CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  stripe_session_id VARCHAR(255),
  provider_transaction_id VARCHAR(255),
  status VARCHAR(50),
  amount_cents BIGINT,
  amount_decimal NUMERIC(18,2),
  currency VARCHAR(10),
  price_id VARCHAR(255),
  product_id VARCHAR(255),
  payment_method VARCHAR(255),
  customer_id VARCHAR(255),
  receipt_url TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_payments_provider_txid ON public.stripe_payments (provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_user_id ON public.stripe_payments (user_id);
