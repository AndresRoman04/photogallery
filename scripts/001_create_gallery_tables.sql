-- Create photos table for admin uploaded photos
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create customer_selections table for tracking customer favorites
CREATE TABLE IF NOT EXISTS public.customer_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name TEXT,
  notes TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_selections ENABLE ROW LEVEL SECURITY;

-- Photos policies - allow public read access for gallery, but restrict admin operations
CREATE POLICY "photos_public_select" ON public.photos 
  FOR SELECT USING (is_active = true);

CREATE POLICY "photos_admin_all" ON public.photos 
  FOR ALL USING (true);

-- Customer selections policies - allow public insert for customer selections
CREATE POLICY "customer_selections_public_insert" ON public.customer_selections 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "customer_selections_admin_select" ON public.customer_selections 
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_active ON public.photos(is_active);
CREATE INDEX IF NOT EXISTS idx_customer_selections_email ON public.customer_selections(customer_email);
CREATE INDEX IF NOT EXISTS idx_customer_selections_photo ON public.customer_selections(photo_id);
