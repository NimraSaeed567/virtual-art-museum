-- =====================================================================
-- PHASE 2 ONLY — Safe to run independently
-- Run this in Supabase SQL Editor → New Query
-- =====================================================================

-- Extend profiles with professional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS artist_statement text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS style_tags text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS media_tags text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_email text;

-- Visitor favourites
CREATE TABLE IF NOT EXISTS public.favourites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  artwork_id text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, artwork_id)
);
ALTER TABLE public.favourites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own favourites" ON public.favourites;
CREATE POLICY "Users manage own favourites" ON public.favourites USING (auth.uid() = user_id);

-- Artist follows
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade,
  artist_profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(follower_id, artist_profile_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own follows" ON public.follows;
CREATE POLICY "Users manage own follows" ON public.follows USING (auth.uid() = follower_id);

-- Artwork submissions
CREATE TABLE IF NOT EXISTS public.artwork_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  medium text,
  year int,
  dimensions text,
  description text,
  story text,
  image_url text,
  style_tags text[],
  price_small numeric,
  price_medium numeric,
  price_large numeric,
  status text default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'archived')),
  reviewer_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
ALTER TABLE public.artwork_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Artists view own submissions" ON public.artwork_submissions;
DROP POLICY IF EXISTS "Artists insert submissions" ON public.artwork_submissions;
DROP POLICY IF EXISTS "Artists update pending submissions" ON public.artwork_submissions;
CREATE POLICY "Artists view own submissions" ON public.artwork_submissions FOR SELECT USING (auth.uid() = artist_id);
CREATE POLICY "Artists insert submissions" ON public.artwork_submissions FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists update pending submissions" ON public.artwork_submissions FOR UPDATE USING (auth.uid() = artist_id AND status = 'pending');

-- Submissions storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Artists upload submission images" ON storage.objects;
DROP POLICY IF EXISTS "Submission images are public" ON storage.objects;
CREATE POLICY "Artists upload submission images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');
CREATE POLICY "Submission images are public" ON storage.objects FOR SELECT USING (bucket_id = 'submissions');
