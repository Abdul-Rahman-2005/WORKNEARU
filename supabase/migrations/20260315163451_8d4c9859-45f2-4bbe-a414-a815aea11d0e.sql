
-- Drop the duplicate indexes that already exist (if they do)
DROP INDEX IF EXISTS idx_reports_status;
DROP INDEX IF EXISTS idx_reports_worker_id;

-- Recreate them to ensure they exist
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_worker_id ON public.reports(worker_id);
