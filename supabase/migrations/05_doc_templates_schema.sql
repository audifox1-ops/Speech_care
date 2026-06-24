-- Create doc_templates table
CREATE TABLE public.doc_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for table
ALTER TABLE public.doc_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for table
CREATE POLICY "Enable read access for authenticated users_doc_templates" 
ON public.doc_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users_doc_templates" 
ON public.doc_templates FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users_doc_templates" 
ON public.doc_templates FOR DELETE
TO authenticated 
USING (true);

-- Insert Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('doc_templates', 'doc_templates', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage bucket
CREATE POLICY "Enable read access for authenticated users_storage_doc_templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'doc_templates');

CREATE POLICY "Enable insert access for authenticated users_storage_doc_templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doc_templates');

CREATE POLICY "Enable delete access for authenticated users_storage_doc_templates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doc_templates');
