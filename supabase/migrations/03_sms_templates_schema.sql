-- Create sms_templates table
CREATE TABLE public.sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users_sms_templates" 
ON public.sms_templates FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users_sms_templates" 
ON public.sms_templates FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users_sms_templates" 
ON public.sms_templates FOR UPDATE
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users_sms_templates" 
ON public.sms_templates FOR DELETE
TO authenticated 
USING (true);

-- Set up auto-updating updated_at trigger
CREATE TRIGGER on_sms_templates_updated
    BEFORE UPDATE ON public.sms_templates
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
