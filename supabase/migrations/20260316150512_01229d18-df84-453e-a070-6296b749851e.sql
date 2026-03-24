-- Fix: restrict user_roles SELECT to only allow users to see their own roles or admins
DROP POLICY IF EXISTS "Admins can read roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Also allow admins to manage reports
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read all reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage workers
CREATE POLICY "Admins can update workers" ON public.workers
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete workers" ON public.workers
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));