
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  reason text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM customers WHERE customers.id = reports.customer_id AND customers.user_id = auth.uid())
  );

CREATE INDEX idx_reports_worker_id ON public.reports(worker_id);
CREATE INDEX idx_reports_status ON public.reports(status);
