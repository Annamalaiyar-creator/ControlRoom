-- Control Room ERP - PostgreSQL Supabase Schema
-- This schema establishes dedicated, indexed tables for all Control Room modules
-- Run this script in the Supabase SQL Editor if you want dedicated relational tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Control Room Central KV / Document Store
CREATE TABLE IF NOT EXISTS public.controlroom_store (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  record_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT DEFAULT 'system'
);

-- Enable Row Level Security (RLS) & Public Access
ALTER TABLE public.controlroom_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for controlroom_store" 
  ON public.controlroom_store FOR ALL USING (true) WITH CHECK (true);

-- 2. BOM Orders Table
CREATE TABLE IF NOT EXISTS public.bom_orders (
  id TEXT PRIMARY KEY,
  bom_code TEXT UNIQUE NOT NULL,
  source_pi_no TEXT,
  customer_name TEXT NOT NULL,
  customer_code TEXT,
  sales_person TEXT,
  total_panels INTEGER DEFAULT 0,
  total_kw NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  delivery_date DATE,
  items JSONB DEFAULT '[]'::jsonb,
  payments JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bom_code ON public.bom_orders(bom_code);
CREATE INDEX IF NOT EXISTS idx_bom_customer ON public.bom_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_bom_status ON public.bom_orders(status);

ALTER TABLE public.bom_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for bom_orders" 
  ON public.bom_orders FOR ALL USING (true) WITH CHECK (true);

-- 3. Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_id TEXT,
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Draft',
  status_type TEXT DEFAULT 'draft',
  approved_by TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_vendor ON public.purchase_orders(vendor_name);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for purchase_orders" 
  ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

-- 4. Work Orders Table
CREATE TABLE IF NOT EXISTS public.production_work_orders (
  id TEXT PRIMARY KEY,
  work_order_no TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  planned_qty NUMERIC DEFAULT 0,
  completed_qty NUMERIC DEFAULT 0,
  raw_material TEXT,
  customer_name TEXT,
  target_date DATE,
  status TEXT DEFAULT 'Pending',
  status_color TEXT DEFAULT '#D97706',
  delay_days INTEGER DEFAULT 0,
  delay_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wo_number ON public.production_work_orders(work_order_no);

ALTER TABLE public.production_work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-write for production_work_orders" 
  ON public.production_work_orders FOR ALL USING (true) WITH CHECK (true);

-- 5. Realtime Publication Configuration
ALTER PUBLICATION supabase_realtime ADD TABLE public.controlroom_store;
