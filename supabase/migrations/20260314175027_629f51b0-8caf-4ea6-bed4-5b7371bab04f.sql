
-- Customers table
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  city text NOT NULL,
  district text NOT NULL DEFAULT '',
  pincode text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers can insert own profile" ON public.customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers can update own profile" ON public.customers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Customers can delete own profile" ON public.customers FOR DELETE USING (auth.uid() = user_id);

-- Bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  job_description text NOT NULL,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own bookings
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customers WHERE customers.id = bookings.customer_id AND customers.user_id = auth.uid())
);

-- Workers can view bookings assigned to them
CREATE POLICY "Workers can view their bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workers WHERE workers.id = bookings.worker_id AND workers.user_id = auth.uid())
);

-- Customers can create bookings
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.customers WHERE customers.id = bookings.customer_id AND customers.user_id = auth.uid())
);

-- Workers can update booking status
CREATE POLICY "Workers can update booking status" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.workers WHERE workers.id = bookings.worker_id AND workers.user_id = auth.uid())
);

-- Messages table for chat
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  message_text text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Enable realtime for messages and bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Add customer_id and booking_id to reviews (optional link)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_bookings_worker_id ON public.bookings(worker_id);
CREATE INDEX idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_pincode ON public.customers(pincode);
