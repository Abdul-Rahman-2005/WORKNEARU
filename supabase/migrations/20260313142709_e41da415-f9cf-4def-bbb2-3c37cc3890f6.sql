
-- Create worker categories enum
CREATE TYPE public.worker_category AS ENUM (
  'electrician', 'plumber', 'carpenter',
  'ac_technician', 'refrigerator_repair', 'washing_machine_repair', 'tv_repair',
  'car_mechanic', 'bike_mechanic', 'auto_electrician',
  'mason', 'painter', 'tile_worker', 'welder',
  'house_cleaner', 'office_cleaner',
  'security_guard',
  'driver', 'delivery_worker'
);

-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone2 TEXT,
  category worker_category NOT NULL,
  experience INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  state TEXT NOT NULL,
  image_url TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on pincode for fast search
CREATE INDEX idx_workers_pincode ON public.workers(pincode);
CREATE INDEX idx_workers_category ON public.workers(category);
CREATE INDEX idx_workers_status ON public.workers(status);
CREATE INDEX idx_workers_rating ON public.workers(rating DESC);

-- Enable RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active workers (customers don't need accounts)
CREATE POLICY "Anyone can view active workers"
  ON public.workers FOR SELECT
  USING (true);

-- Workers can insert their own profile
CREATE POLICY "Workers can insert own profile"
  ON public.workers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Workers can update their own profile
CREATE POLICY "Workers can update own profile"
  ON public.workers FOR UPDATE
  USING (auth.uid() = user_id);

-- Workers can delete their own profile
CREATE POLICY "Workers can delete own profile"
  ON public.workers FOR DELETE
  USING (auth.uid() = user_id);

-- Create worker portfolio table
CREATE TABLE public.worker_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_portfolio ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio images
CREATE POLICY "Anyone can view portfolio"
  ON public.worker_portfolio FOR SELECT
  USING (true);

-- Workers can manage their own portfolio
CREATE POLICY "Workers can insert portfolio"
  ON public.worker_portfolio FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workers WHERE id = worker_id AND user_id = auth.uid())
  );

CREATE POLICY "Workers can delete portfolio"
  ON public.worker_portfolio FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.workers WHERE id = worker_id AND user_id = auth.uid())
  );

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Anyone can leave a review (customers don't need accounts)
CREATE POLICY "Anyone can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- Function to update worker rating when a review is added
CREATE OR REPLACE FUNCTION public.update_worker_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workers
  SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE worker_id = NEW.worker_id),
    total_reviews = (SELECT COUNT(*) FROM public.reviews WHERE worker_id = NEW.worker_id)
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_worker_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets for profile images and portfolio
INSERT INTO storage.buckets (id, name, public) VALUES ('worker-images', 'worker-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('worker-portfolio', 'worker-portfolio', true);

-- Storage policies
CREATE POLICY "Worker images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('worker-images', 'worker-portfolio'));

CREATE POLICY "Authenticated users can upload worker images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('worker-images', 'worker-portfolio') AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('worker-images', 'worker-portfolio') AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('worker-images', 'worker-portfolio') AND auth.uid()::text = (storage.foldername(name))[1]);
