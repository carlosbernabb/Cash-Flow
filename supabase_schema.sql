-- MEGA SCRIPT: Cash & Flow Full Dynamic Schema
-- This script drops old tables and creates the new structure with full access.

-- 1. DROP EXISTING TABLES IF ANY
DROP TABLE IF EXISTS inventory_cars CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS site_media CASCADE;

-- 2. CREATE TABLE: inventory_cars
CREATE TABLE inventory_cars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    transmission TEXT NOT NULL DEFAULT 'Automático',
    price TEXT NOT NULL,
    engine TEXT NOT NULL,
    hp TEXT NOT NULL,
    acceleration TEXT NOT NULL,
    image_url TEXT NOT NULL,
    preview_video_url TEXT NOT NULL DEFAULT 'BMW BY Jm.mp4', -- Default hover video
    mileage TEXT NOT NULL DEFAULT '0 km',
    owners INTEGER NOT NULL DEFAULT 1,
    is_featured BOOLEAN NOT NULL DEFAULT false, -- For showing on the homepage (max 4)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE TABLE: events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    month TEXT NOT NULL,
    day TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    is_upcoming BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE TABLE: site_media
CREATE TABLE site_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name TEXT UNIQUE NOT NULL,
    media_url TEXT NOT NULL,
    description TEXT
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS) FOR ALL
ALTER TABLE inventory_cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES: FULL PUBLIC ACCESS (CRUD)
-- This allows anyone to Read, Insert, Update, and Delete (ideal for fast dev/admin)

-- Policies for inventory_cars
CREATE POLICY "Public FULL ACCESS on inventory_cars" ON inventory_cars FOR ALL USING (true) WITH CHECK (true);

-- Policies for events
CREATE POLICY "Public FULL ACCESS on events" ON events FOR ALL USING (true) WITH CHECK (true);

-- Policies for site_media
CREATE POLICY "Public FULL ACCESS on site_media" ON site_media FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 7. INSERT DEFAULT DATA
-- ==========================================

-- Insert Cars (Marked as featured for the homepage)
INSERT INTO inventory_cars (brand, model, year, color, transmission, price, engine, hp, acceleration, image_url, preview_video_url, mileage, owners, is_featured) VALUES 
('Mercedes-Benz', 'AMG G63', 2023, 'Negro', 'Automático', '$4,500,000', 'V8 4.0L Biturbo', '577 CV', '4.5s', 'inventario/imagenes_coches/coche_1.jpeg', 'BMW BY Jm.mp4', '1,200 km', 1, true),
('Audi', 'RS Q8', 2024, 'Gris Daytona', 'Automático', '$3,200,000', 'V8 4.0L TFSI', '591 CV', '3.8s', 'inventario/imagenes_coches/coche_2.jpeg', 'BMW BY Jm.mp4', '500 km', 1, true),
('Porsche', '911 GT3 RS', 2023, 'Plata GT', 'Automático Pdk', '$4,800,000', 'F6 4.0L Atmosférico', '518 CV', '3.2s', 'inventario/imagenes_coches/coche_3.jpeg', 'BMW BY Jm.mp4', '2,500 km', 2, true),
('BMW', 'M4 Competition', 2022, 'Blanco Alpino', 'Automático', '$2,300,000', 'L6 3.0L TwinPower Turbo', '503 CV', '3.8s', 'inventario/imagenes_coches/coche_4.jpeg', 'BMW BY Jm.mp4', '15,000 km', 1, true);

-- Insert Events
INSERT INTO events (title, date, month, day, location, description, is_upcoming, image_url) VALUES 
('Roll''n''Rodz Rueda de Prensa', '4 de Abril, 2024', 'ABR', '04', 'Lugar por confirmar', 'Acompáñanos a la rueda de prensa oficial de Roll''n''Rodz. Conoce todos los detalles del evento, marcas participantes y sorpresas exclusivas.', true, 'imagenes/cash0404.jpeg'),
('Cash & Flow Night Vol. 2', 'N/A', 'OCT', '15', 'Ciudad de México', 'La segunda entrega de nuestras noches exclusivas...', false, 'imagenes/evento2.jpeg'),
('Cash & Flow Night Vol. 1', 'N/A', 'MAY', '20', 'Guadalajara', 'El evento que lo inició todo...', false, 'imagenes/evento3.jpeg');

-- Insert Site Media
INSERT INTO site_media (key_name, media_url, description) VALUES 
('bg_video', 'Video Project 2.mp4', 'Video de fondo cinemático de la página principal');
