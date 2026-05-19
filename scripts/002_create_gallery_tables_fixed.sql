-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_selections table
CREATE TABLE IF NOT EXISTS customer_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  notes TEXT,
  selected_photos UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for photos (public read access)
CREATE POLICY "Photos are viewable by everyone" ON photos
  FOR SELECT USING (is_active = true);

-- Create policies for customer_selections (public insert access)
CREATE POLICY "Anyone can insert customer selections" ON customer_selections
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for photos bucket
CREATE POLICY "Photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Anyone can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');
