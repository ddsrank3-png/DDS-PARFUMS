-- =============================================
-- SCHEMA PARA REGISTRO DE VENTAS DE PERFUMES
-- Pega esto en el SQL Editor de Supabase
-- =============================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Perfume', -- 'Perfume' | 'Decant'
  precio NUMERIC(10,2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ventas (cabecera)
CREATE TABLE IF NOT EXISTS ventas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT NOT NULL DEFAULT 'Efectivo', -- 'Efectivo' | 'Transferencia' | 'Yape/Plin'
  notas TEXT,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de items de cada venta
CREATE TABLE IF NOT EXISTS venta_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  nombre_producto TEXT NOT NULL, -- snapshot del nombre al momento de vender
  precio_unitario NUMERIC(10,2) NOT NULL, -- precio con descuento aplicado
  precio_original NUMERIC(10,2) NOT NULL, -- precio sin descuento
  descuento NUMERIC(10,2) DEFAULT 0,
  cantidad INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) - acceso público para uso personal
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (ajusta si quieres auth después)
CREATE POLICY "Acceso público productos" ON productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público ventas" ON ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso público venta_items" ON venta_items FOR ALL USING (true) WITH CHECK (true);

-- Algunos productos de ejemplo para empezar
INSERT INTO productos (nombre, categoria, precio) VALUES
  ('Decant 5ml - Baccarat Rouge 540', 'Decant', 35.00),
  ('Decant 10ml - Baccarat Rouge 540', 'Decant', 60.00),
  ('Decant 5ml - Bleu de Chanel', 'Decant', 25.00),
  ('Decant 10ml - Bleu de Chanel', 'Decant', 45.00),
  ('Perfume 50ml - La Vie Est Belle', 'Perfume', 180.00),
  ('Decant 5ml - Good Girl Carolina Herrera', 'Decant', 28.00);
