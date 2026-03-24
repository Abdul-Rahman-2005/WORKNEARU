-- Allow the default bootstrap admin (synthetic email) to insert their own admin role after signup.
-- Matches app mapping: username "Admin@123" -> admin_admin123@worknear.local
CREATE POLICY "Bootstrap admin can insert own admin role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'::public.app_role
    AND (auth.jwt() ->> 'email') = 'admin_admin123@worknear.local'
  );
