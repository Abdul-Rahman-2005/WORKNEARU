import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Calendar, MessageCircle, Star, User, Clock } from 'lucide-react';
import ChangePassword from '@/components/ChangePassword';

interface Booking {
  id: string;
  worker_id: string;
  job_description: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  worker_name?: string;
  worker_category?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  accepted: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-success/10 text-success',
};

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, customerProfile, loading, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'bookings' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', city: '', district: '', pincode: '' });

  useEffect(() => {
    if (!loading && !user) navigate('/customer/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (customerProfile) {
      setForm({
        name: customerProfile.name,
        phone: customerProfile.phone,
        city: customerProfile.city,
        district: customerProfile.district,
        pincode: customerProfile.pincode,
      });
      fetchBookings();
    }
  }, [customerProfile]);

  const fetchBookings = async () => {
    if (!customerProfile) return;
    setLoadingBookings(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerProfile.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      // Fetch worker names
      const workerIds = [...new Set(data.map(b => b.worker_id))];
      const { data: workers } = await supabase
        .from('workers')
        .select('id, name, category')
        .in('id', workerIds);

      const workerMap = new Map(workers?.map(w => [w.id, w]) || []);
      const enriched = data.map(b => ({
        ...b,
        worker_name: workerMap.get(b.worker_id)?.name || 'Unknown',
        worker_category: workerMap.get(b.worker_id)?.category || '',
      }));
      setBookings(enriched);
    } else {
      setBookings([]);
    }
    setLoadingBookings(false);
  };

  const handleSave = async () => {
    if (!customerProfile) return;
    setSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({
        name: form.name,
        phone: form.phone,
        city: form.city,
        district: form.district,
        pincode: form.pincode,
      } as any)
      .eq('id', customerProfile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('dashboard_page.profile_updated'));
      await refreshProfile();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  if (loading || !customerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">{t('dashboard_page.my_dashboard')}</h1>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {t('logout')}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
            {(['bookings', 'profile'] as const).map(tb => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === tb ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tb === 'bookings' ? t('dashboard_page.my_bookings') : t('dashboard_page.profile_settings')}
              </button>
            ))}
          </div>

          {tab === 'bookings' && (
            <div className="space-y-3">
              {loadingBookings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                   <p className="text-foreground font-medium">{t('dashboard_page.no_bookings')}</p>
                   <p className="text-sm text-muted-foreground mt-1">{t('dashboard_page.find_workers_hint')}</p>
                   <Link to="/" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                     {t('dashboard_page.browse_workers')}
                   </Link>
                </div>
              ) : (
                bookings.map(booking => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl border border-border p-5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{booking.worker_name}</h3>
                        <p className="text-xs text-primary capitalize">{booking.worker_category?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[booking.status] || 'bg-muted text-muted-foreground'}`}>
                        {t(`booking_status.${booking.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{booking.job_description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {booking.booking_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.booking_time}</span>
                    </div>
                    {booking.status === 'accepted' && (
                      <Link
                        to={`/chat/${booking.id}`}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" /> {t('dashboard_page.chat_with_worker')}
                      </Link>
                    )}
                    {booking.status === 'completed' && (
                      <Link
                        to={`/review/${booking.id}`}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors"
                      >
                        <Star className="w-3 h-3" /> {t('leave_review')}
                      </Link>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-foreground">{customerProfile.name}</p>
                  <p className="text-xs text-muted-foreground">{customerProfile.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('full_name')}</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_number')}</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('city_village')}</label>
                  <input type="text" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('district')}</label>
                  <input type="text" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className={inputClass} />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('pincode')}</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={form.pincode} onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))} className={inputClass} />
                </div>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? '...' : t('save_changes')}
              </button>
            </div>
          )}

          {/* Change Password - always visible */}
          <div className="mt-6">
            <ChangePassword />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
