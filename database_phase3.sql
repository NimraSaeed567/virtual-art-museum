-- =====================================================================
-- PHASE 3 — Curator Dashboard, Analytics, Published Artworks
-- Run this in Supabase SQL Editor → New Query
-- =====================================================================

-- 1. Add admin flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Curator RLS: admin can read ALL submissions
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.artwork_submissions;
CREATE POLICY "Admins can view all submissions"
    ON public.artwork_submissions FOR SELECT
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Curator RLS: admin can update status & reviewer_notes on any submission
DROP POLICY IF EXISTS "Admins can curate submissions" ON public.artwork_submissions;
CREATE POLICY "Admins can curate submissions"
    ON public.artwork_submissions FOR UPDATE
    USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 3. Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  artwork_id text,
  event_type text NOT NULL CHECK (event_type IN ('view', 'favourite', 'sale')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists view own analytics" ON public.analytics_events;
CREATE POLICY "Artists view own analytics"
    ON public.analytics_events FOR SELECT
    USING (auth.uid() = artist_id);

DROP POLICY IF EXISTS "Anyone can log events" ON public.analytics_events;
CREATE POLICY "Anyone can log events"
    ON public.analytics_events FOR INSERT
    WITH CHECK (true);

-- 4. Published artworks table (curator-approved submissions that appear in the gallery)
CREATE TABLE IF NOT EXISTS public.published_artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.artwork_submissions(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES public.profiles(id),
  room_id text NOT NULL,
  exhibition_id text,
  published_at timestamptz DEFAULT now()
);
ALTER TABLE public.published_artworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published artworks are public" ON public.published_artworks;
CREATE POLICY "Published artworks are public"
    ON public.published_artworks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can publish artworks" ON public.published_artworks;
CREATE POLICY "Admins can publish artworks"
    ON public.published_artworks FOR INSERT
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ));

DROP POLICY IF EXISTS "Admins can remove published artworks" ON public.published_artworks;
CREATE POLICY "Admins can remove published artworks"
    ON public.published_artworks FOR DELETE
    USING (EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    ));

-- =====================================================================
-- After running this script, promote yourself to admin:
-- UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
-- Or: UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
-- (run in Supabase Table Editor or SQL Editor as superuser)
-- =====================================================================
