-- Cash & Flow: General inquiries support
-- Adds lead_type and subject to vehicle_leads so one table handles both
-- vehicle quotes AND general "chat with advisor" requests.
--
-- Run this in Supabase Dashboard → SQL Editor AFTER supabase_vehicle_leads_migration.sql

ALTER TABLE public.vehicle_leads
    ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'vehicle_quote'
        CHECK (lead_type IN ('vehicle_quote', 'general'));

ALTER TABLE public.vehicle_leads
    ADD COLUMN IF NOT EXISTS subject TEXT;

CREATE INDEX IF NOT EXISTS vehicle_leads_type_idx ON public.vehicle_leads(lead_type);

-- Re-seed gallery_items with local paths (works on local server immediately).
-- For production: upload images to Supabase Storage via Admin → Galeria tab and update URLs.
INSERT INTO public.gallery_items (tag, title, description, image_url)
SELECT *
FROM (VALUES
    (
        'NUESTRA HISTORIA',
        '¿Qué es Cash & Flow?',
        'Nacimos en Querétaro con una misión simple: acercar los vehículos de la pantalla al pavimento. Somos el punto de encuentro entre quienes viven rápido y los coches que lo hacen posible.',
        'multimedia_cash/flipbook_garage.png'
    ),
    (
        'EVENTOS',
        'Noches que no se olvidan',
        'Cada reunión de Cash & Flow es una experiencia: motores que encienden conversaciones, modelos que detienen el tiempo y una comunidad que comparte la misma pasión.',
        'multimedia_cash/flipbook_event.png'
    ),
    (
        'COMUNIDAD',
        'Más que clientes, somos familia',
        'El verdadero motor de Cash & Flow está en cada persona que confía en nosotros para encontrar su próximo vehículo.',
        'multimedia_cash/cash0403.png'
    )
) AS seed(tag, title, description, image_url)
WHERE NOT EXISTS (
    SELECT 1 FROM public.gallery_items existing WHERE existing.title = seed.title
);
