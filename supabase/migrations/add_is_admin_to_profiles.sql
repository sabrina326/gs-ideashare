-- Migration: add is_admin column to profiles
-- Run this in the Supabase SQL editor or via the Supabase CLI.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Optionally grant your own account admin access immediately:
-- UPDATE public.profiles SET is_admin = true WHERE id = '<your-user-uuid>';
