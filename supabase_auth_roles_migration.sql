-- Cash & Flow Supabase Auth + roles migration
-- Run this in Supabase SQL Editor after creating the first Auth user.
--
-- Flow:
-- 1) Supabase Dashboard > Authentication > Users > Add user.
-- 2) Copy the new user's UUID.
-- 3) Run this script.
-- 4) Replace the UUID in the INSERT at the bottom and run that INSERT.

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$;

DROP POLICY IF EXISTS "Profiles readable by owner or admins" ON public.user_profiles;
DROP POLICY IF EXISTS "Profiles manageable by admins" ON public.user_profiles;

CREATE POLICY "Profiles readable by owner or admins"
ON public.user_profiles
FOR SELECT
USING (id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Profiles manageable by admins"
ON public.user_profiles
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- Public can read inventory/events/site media. Only admins can write.
DROP POLICY IF EXISTS "Public FULL ACCESS on inventory_cars" ON public.inventory_cars;
DROP POLICY IF EXISTS "Public read inventory_cars" ON public.inventory_cars;
DROP POLICY IF EXISTS "Admins write inventory_cars" ON public.inventory_cars;

CREATE POLICY "Public read inventory_cars"
ON public.inventory_cars
FOR SELECT
USING (true);

CREATE POLICY "Admins write inventory_cars"
ON public.inventory_cars
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Public FULL ACCESS on events" ON public.events;
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Admins write events" ON public.events;

CREATE POLICY "Public read events"
ON public.events
FOR SELECT
USING (true);

CREATE POLICY "Admins write events"
ON public.events
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Public FULL ACCESS on site_media" ON public.site_media;
DROP POLICY IF EXISTS "Public read site_media" ON public.site_media;
DROP POLICY IF EXISTS "Admins write site_media" ON public.site_media;

CREATE POLICY "Public read site_media"
ON public.site_media
FOR SELECT
USING (true);

CREATE POLICY "Admins write site_media"
ON public.site_media
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- Editable story gallery before Events.
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag TEXT,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public FULL ACCESS on gallery_items" ON public.gallery_items;
DROP POLICY IF EXISTS "Public read gallery_items" ON public.gallery_items;
DROP POLICY IF EXISTS "Admins write gallery_items" ON public.gallery_items;

CREATE POLICY "Public read gallery_items"
ON public.gallery_items
FOR SELECT
USING (true);

CREATE POLICY "Admins write gallery_items"
ON public.gallery_items
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

-- Vehicle-specific lead capture for inventory appointments.
CREATE TABLE IF NOT EXISTS public.vehicle_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id UUID REFERENCES public.inventory_cars(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    budget_mxn NUMERIC,
    message TEXT,
    source TEXT NOT NULL DEFAULT 'inventario_web',
    status TEXT NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo', 'contactado', 'agendado', 'cerrado')),
    appointment_at TIMESTAMP WITH TIME ZONE,
    appointment_notes TEXT,
    car_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicle_leads
    ADD COLUMN IF NOT EXISTS appointment_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS appointment_notes TEXT;

ALTER TABLE public.vehicle_leads DROP CONSTRAINT IF EXISTS vehicle_leads_status_check;
ALTER TABLE public.vehicle_leads
    ADD CONSTRAINT vehicle_leads_status_check
    CHECK (status IN ('nuevo', 'contactado', 'agendado', 'cerrado'));

ALTER TABLE public.vehicle_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert vehicle_leads" ON public.vehicle_leads;
DROP POLICY IF EXISTS "Admins read vehicle_leads" ON public.vehicle_leads;
DROP POLICY IF EXISTS "Admins update vehicle_leads" ON public.vehicle_leads;
DROP POLICY IF EXISTS "Admins delete vehicle_leads" ON public.vehicle_leads;

CREATE POLICY "Public insert vehicle_leads"
ON public.vehicle_leads
FOR INSERT
WITH CHECK (status = 'nuevo');

CREATE POLICY "Admins read vehicle_leads"
ON public.vehicle_leads
FOR SELECT
USING (public.current_user_role() = 'admin');

CREATE POLICY "Admins update vehicle_leads"
ON public.vehicle_leads
FOR UPDATE
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "Admins delete vehicle_leads"
ON public.vehicle_leads
FOR DELETE
USING (public.current_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS vehicle_leads_car_id_idx ON public.vehicle_leads(car_id);
CREATE INDEX IF NOT EXISTS vehicle_leads_status_idx ON public.vehicle_leads(status);
CREATE INDEX IF NOT EXISTS vehicle_leads_created_at_idx ON public.vehicle_leads(created_at DESC);

CREATE TABLE IF NOT EXISTS public.vehicle_lead_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES public.vehicle_leads(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('cliente', 'admin', 'sistema')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vehicle_lead_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public insert client vehicle_lead_messages" ON public.vehicle_lead_messages;
DROP POLICY IF EXISTS "Admins manage vehicle_lead_messages" ON public.vehicle_lead_messages;

CREATE POLICY "Public insert client vehicle_lead_messages"
ON public.vehicle_lead_messages
FOR INSERT
WITH CHECK (sender_type = 'cliente');

CREATE POLICY "Admins manage vehicle_lead_messages"
ON public.vehicle_lead_messages
FOR ALL
USING (public.current_user_role() = 'admin')
WITH CHECK (public.current_user_role() = 'admin');

CREATE INDEX IF NOT EXISTS vehicle_lead_messages_lead_id_idx ON public.vehicle_lead_messages(lead_id, created_at);

-- Storage policies for the public car_media bucket.
DROP POLICY IF EXISTS "Public read car_media" ON storage.objects;
DROP POLICY IF EXISTS "Admins insert car_media" ON storage.objects;
DROP POLICY IF EXISTS "Admins update car_media" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete car_media" ON storage.objects;

CREATE POLICY "Public read car_media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'car_media');

CREATE POLICY "Admins insert car_media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'car_media' AND public.current_user_role() = 'admin');

CREATE POLICY "Admins update car_media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'car_media' AND public.current_user_role() = 'admin')
WITH CHECK (bucket_id = 'car_media' AND public.current_user_role() = 'admin');

CREATE POLICY "Admins delete car_media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'car_media' AND public.current_user_role() = 'admin');

-- Bootstrap example. Run this after replacing the UUID with your Auth user id.
-- INSERT INTO public.user_profiles (id, username, role)
-- VALUES ('REEMPLAZA-CON-UUID-DEL-USUARIO-AUTH', 'admin', 'admin')
-- ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role;
