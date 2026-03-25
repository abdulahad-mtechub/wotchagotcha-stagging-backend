-- Create subscription table to track active and historical subscriptions
CREATE TABLE IF NOT EXISTS public.subscription (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_id VARCHAR(255) NOT NULL, -- Strike Lookup Key
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active',
    transaction_id INT REFERENCES public.stripe_payments(id) ON DELETE SET NULL,
    expired_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON public.subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_id ON public.subscription(plan_id);
