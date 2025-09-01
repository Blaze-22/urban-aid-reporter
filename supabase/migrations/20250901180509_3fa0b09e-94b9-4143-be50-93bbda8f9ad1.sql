-- Enhance the existing issues table and add new functionality
-- First, let's add missing columns to the issues table
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS video_urls TEXT[],
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing date_reported to created_at if data exists
UPDATE public.issues SET created_at = date_reported WHERE date_reported IS NOT NULL AND created_at IS NULL;

-- Drop the old date_reported column
ALTER TABLE public.issues DROP COLUMN IF EXISTS date_reported;

-- Ensure tracking_id is unique and auto-generated
ALTER TABLE public.issues 
ALTER COLUMN tracking_id SET DEFAULT 'ISS-' || EXTRACT(YEAR FROM now()) || '-' || LPAD(nextval('issues_id_seq')::text, 6, '0');

-- Create storage buckets for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('issue-media', 'issue-media', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for issues
CREATE POLICY "Anyone can view issues" 
ON public.issues 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create issues" 
ON public.issues 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own issues" 
ON public.issues 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Create storage policies for issue media
CREATE POLICY "Anyone can view issue media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'issue-media');

CREATE POLICY "Authenticated users can upload issue media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'issue-media' AND auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_issues_updated_at ON public.issues;
CREATE TRIGGER update_issues_updated_at
  BEFORE UPDATE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create categories enum for better data consistency
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_category') THEN
    CREATE TYPE issue_category AS ENUM (
      'Road & Transportation',
      'Water & Sanitation', 
      'Public Safety',
      'Parks & Recreation',
      'Utilities',
      'Waste Management',
      'Street Lighting',
      'Public Buildings',
      'Other'
    );
  END IF;
END $$;

-- Create priority enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
    CREATE TYPE issue_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
  END IF;
END $$;

-- Create status enum  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
    CREATE TYPE issue_status AS ENUM ('Pending', 'In Progress', 'Resolved', 'Rejected');
  END IF;
END $$;

-- Update table to use enums (after data migration if needed)
-- We'll keep text for now to avoid breaking existing data