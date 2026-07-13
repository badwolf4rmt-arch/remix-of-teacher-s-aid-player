
CREATE TABLE public.generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_name text,
  model text,
  params jsonb,
  task_format text,
  task_content text,
  teacher_notes text,
  raw_stage1 text,
  image_brief text,
  image_url text
);
GRANT SELECT, INSERT ON public.generations TO anon, authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert generations" ON public.generations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read generations" ON public.generations FOR SELECT TO anon, authenticated USING (true);
