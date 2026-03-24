import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

interface BookingModalProps {
  worker: Tables<'workers'>;
  open: boolean;
  onClose: () => void;
}

const timeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
];

const BookingModal = ({ worker, open, onClose }: BookingModalProps) => {
  const { user, customerProfile, role } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !customerProfile) {
      toast.error('Please login as a customer to book a service');
      navigate('/customer/login');
      return;
    }

    if (role !== 'customer') {
      toast.error('Only customers can book workers');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('bookings').insert({
      worker_id: worker.id,
      customer_id: customerProfile.id,
      job_description: description.trim(),
      booking_date: date,
      booking_time: time,
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Booking request sent!');
      onClose();
      setDate('');
      setTime('');
      setDescription('');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  const today = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6 z-10"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <h2 className="font-heading text-xl font-bold text-foreground">Book Service</h2>
            <p className="text-sm text-muted-foreground mt-1">Book {worker.name} — {worker.category.replace(/_/g, ' ')}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input type="date" required min={today} value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time
                </label>
                <select required value={time} onChange={e => setTime(e.target.value)} className={inputClass}>
                  <option value="">Select time</option>
                  {timeSlots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Job Description
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the work you need done..."
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? 'Sending...' : 'Confirm Booking'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
