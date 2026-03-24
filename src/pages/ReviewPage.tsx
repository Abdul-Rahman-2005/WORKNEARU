import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';

const ReviewPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, customerProfile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !bookingId) { navigate('/'); return; }
    loadBooking();
  }, [user, bookingId]);

  const loadBooking = async () => {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.status !== 'completed') {
      toast.error('Review is only available for completed jobs');
      navigate('/customer/dashboard');
      return;
    }

    const { data: worker } = await supabase.from('workers').select('id, name').eq('id', booking.worker_id).single();
    if (worker) {
      setWorkerId(worker.id);
      setWorkerName(worker.name);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !workerId || !customerProfile || !bookingId) return;

    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      worker_id: workerId,
      rating,
      review_text: reviewText.trim() || null,
      reviewer_name: customerProfile.name,
      customer_id: customerProfile.id,
      booking_id: bookingId,
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Review submitted! Thank you.');
      navigate('/customer/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">Leave a Review</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">Rate your experience with {workerName}</p>

          <form onSubmit={handleSubmit} className="mt-8 bg-card rounded-2xl border border-border p-6 space-y-6">
            {/* Stars */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      s <= (hoverRating || rating)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0 ? 'Tap to rate' : `${rating} star${rating > 1 ? 's' : ''}`}
            </p>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Review (optional)</label>
              <textarea
                rows={4}
                maxLength={500}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Tell others about your experience..."
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ReviewPage;
