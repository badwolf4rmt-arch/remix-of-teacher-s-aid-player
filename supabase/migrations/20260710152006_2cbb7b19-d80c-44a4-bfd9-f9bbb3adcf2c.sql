CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_name TEXT,
  model TEXT,
  params JSONB,
  markup_ok BOOLEAN,
  scores JSONB,
  overall_stars INT,
  comment TEXT,
  task_content TEXT,
  teacher_notes TEXT
);
GRANT SELECT, INSERT ON public.evaluations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert evaluations" ON public.evaluations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read evaluations" ON public.evaluations FOR SELECT TO anon, authenticated USING (true);