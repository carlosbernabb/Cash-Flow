-- Cash & Flow gallery section migration
-- Creates/normalizes the editable gallery that appears before Events.

CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag TEXT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gallery_items" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins write gallery_items" ON public.gallery_items;
DROP POLICY IF EXISTS "Public FULL ACCESS on gallery_items" ON public.gallery_items;

CREATE POLICY "Public read gallery_items"
ON public.gallery_items
FOR SELECT
USING (true);

CREATE POLICY "Admins write gallery_items"
ON public.gallery_items
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

