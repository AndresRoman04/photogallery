-- Create photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_selections table
CREATE TABLE IF NOT EXISTS public.customer_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    notes TEXT,
    selected_photos UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for photos table (allow public read, admin write)
CREATE POLICY "Allow public read access to active photos" ON public.photos
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to insert photos" ON public.photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update photos" ON public.photos
    FOR UPDATE USING (true);

-- Create policies for customer_selections table (allow public insert, admin read)
CREATE POLICY "Allow public to insert selections" ON public.customer_selections
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read selections" ON public.customer_selections
    FOR SELECT USING (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for photos bucket
CREATE POLICY "Allow public read access to photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Allow authenticated users to update photos" ON storage.objects
    FOR UPDATE USING (bucket_id = 'photos');

CREATE POLICY "Allow authenticated users to delete photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'photos');
