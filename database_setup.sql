-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  role text check (role in ('artist', 'visitor'))
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile.
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile.
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage RLS for avatars
-- Everyone can view avatars
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload an avatar
CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Users can update their own avatar
CREATE POLICY "Anyone can update their own avatar." ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Trigger to create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================================
-- PHASE 2: Expanded Profiles + New Tables
-- Run this section after the initial setup above is complete.
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
CREATE POLICY "Artists view own submissions" ON public.artwork_submissions FOR SELECT USING (auth.uid() = artist_id);
CREATE POLICY "Artists insert submissions" ON public.artwork_submissions FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists update pending submissions" ON public.artwork_submissions FOR UPDATE USING (auth.uid() = artist_id AND status = 'pending');

-- Submissions storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Artists upload submission images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'submissions' AND auth.role() = 'authenticated');
CREATE POLICY "Submission images are public" ON storage.objects FOR SELECT USING (bucket_id = 'submissions');
