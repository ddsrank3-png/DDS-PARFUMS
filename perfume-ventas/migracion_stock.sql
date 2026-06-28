-- Agregar precio de compra y stock a productos
ALTER TABLE productos 
  ADD COLUMN IF NOT EXISTS precio_compra NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- Agregar precio de compra snapshot a venta_items
ALTER TABLE venta_items
  ADD COLUMN IF NOT EXISTS precio_compra NUMERIC(10,2) DEFAULT 0;
