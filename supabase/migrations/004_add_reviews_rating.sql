-- Add rating column to reviews (1-5 stars)
-- Run in Supabase SQL Editor if reviews table already exists

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
