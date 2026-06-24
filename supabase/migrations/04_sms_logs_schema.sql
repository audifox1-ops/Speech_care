-- Create sms_logs table
CREATE TABLE public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipients JSONB NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'partial'
    provider TEXT NOT NULL, -- 'mock', 'solapi', etc.
    error_detail TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for authenticated users_sms_logs" 
ON public.sms_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users_sms_logs" 
ON public.sms_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users_sms_logs" 
ON public.sms_logs FOR UPDATE
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users_sms_logs" 
ON public.sms_logs FOR DELETE
TO authenticated 
USING (true);
