-- Cash & Flow vehicle leads / interested customers
-- Links each request to inventory_cars.id for future Meta/Facebook/Instagram campaigns.

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
