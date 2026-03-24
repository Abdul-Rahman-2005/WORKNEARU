
-- Drop the overly permissive review insert policy and replace with a more controlled one
-- We still allow anonymous inserts but require reviewer_name to be non-empty
DROP POLICY "Anyone can insert reviews" ON public.reviews;

-- Require basic validation - reviewer name must be provided
CREATE POLICY "Anyone can insert reviews with name"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_name IS NOT NULL AND length(trim(reviewer_name)) > 0);
