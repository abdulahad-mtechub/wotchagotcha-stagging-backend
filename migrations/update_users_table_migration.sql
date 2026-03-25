-- Update users table with subscription lookup keys and premium flag
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS banner_subscript_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS premium_subscription_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
