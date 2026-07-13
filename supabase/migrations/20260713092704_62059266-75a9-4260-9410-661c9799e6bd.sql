
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS cost_task numeric(12,6),
  ADD COLUMN IF NOT EXISTS cost_brief numeric(12,6),
  ADD COLUMN IF NOT EXISTS cost_image numeric(12,6),
  ADD COLUMN IF NOT EXISTS cost_total numeric(12,6),
  ADD COLUMN IF NOT EXISTS tokens_task jsonb,
  ADD COLUMN IF NOT EXISTS tokens_brief jsonb,
  ADD COLUMN IF NOT EXISTS tokens_image jsonb;
