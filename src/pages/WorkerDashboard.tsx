import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { Switch } from '@/components/ui/switch';
import { CATEGORY_GROUPS } from '@/data/mockWorkers';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Loader2, Check, XCircle, MessageCircle, Calendar, Clock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import ChangePassword from '@/components/ChangePassword';

type WorkerCategory = Database['public']['Enums']['worker_category'];

interface BookingItem {
  id: string;
  customer_id: string;
  job_description: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  accepted: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-success/10 text-success',
};

const WorkerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, workerProfile, loading, signOut, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<'profile' | 'bookings' | 'portfolio'>('bookings');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<{ id: string; image_url: string }[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [form, setForm] = useState({
    name: '', phone: '', phone2: '', city: '', pincode: '',
    state: '', category: '' as string, experience: '', bio: '',
  });

  useEffect(() => {
    if (!loading && !user) navigate('/worker/login');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (workerProfile) {
      setIsActive(workerProfile.status === 'active');
      setForm({
        name: workerProfile.name,
        phone: workerProfile.phone,
        phone2: workerProfile.phone2 || '',
        city: workerProfile.city,
        pincode: workerProfile.pincode,
        state: workerProfile.state,
        category: workerProfile.category,
        experience: String(workerProfile.experience),
        bio: workerProfile.description || '',
      });
      supabase.from('worker_portfolio').select('id, image_url').eq('worker_id', workerProfile.id)
        .then(({ data }) => { if (data) setPortfolioImages(data); });
      fetchBookings();
    }
  }, [workerProfile]);

  // Realtime booking updates
  useEffect(() => {
    if (!workerProfile) return;
    const channel = supabase
      .channel('worker-bookings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `worker_id=eq.${workerProfile.id}`,
      }, () => { fetchBookings(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workerProfile]);

  const fetchBookings = async () => {
    if (!workerProfile) return;
    setLoadingBookings(true);
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('worker_id', workerProfile.id)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const customerIds = [...new Set(data.map(b => b.customer_id))];
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone')
        .in('id', customerIds);
      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);
      setBookings(data.map(b => ({
        ...b,
        customer_name: customerMap.get(b.customer_id)?.name || 'Unknown',
        customer_phone: customerMap.get(b.customer_id)?.phone || '',
      })));
    } else {
      setBookings([]);
    }
    setLoadingBookings(false);
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status } as any).eq('id', bookingId);
    if (error) toast.error(error.message);
    else {
      toast.success(`Booking ${status}`);
      fetchBookings();
    }
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleToggleStatus = async (active: boolean) => {
    setIsActive(active);
    if (!workerProfile) return;
    await supabase.from('workers').update({ status: active ? 'active' : 'inactive' }).eq('id', workerProfile.id);
    await refreshProfile();
  };

  const handleSave = async () => {
    if (!workerProfile) return;
    setSaving(true);
    const { error } = await supabase.from('workers').update({
      name: form.name, phone: form.phone, phone2: form.phone2 || null,
      city: form.city, pincode: form.pincode, state: form.state,
      category: form.category as WorkerCategory,
      experience: parseInt(form.experience) || 0, description: form.bio || null,
    }).eq('id', workerProfile.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(t('save_changes') + ' ✓'); await refreshProfile(); }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !workerProfile) return;
    setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/profile.${ext}`;
    const { error: uploadError } = await supabase.storage.from('worker-images').upload(path, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setUploadingImage(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('worker-images').getPublicUrl(path);
    await supabase.from('workers').update({ image_url: publicUrl }).eq('id', workerProfile.id);
    await refreshProfile();
    setUploadingImage(false);
    toast.success('Profile image updated!');
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !workerProfile) return;
    setUploadingPortfolio(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('worker-portfolio').upload(path, file);
    if (uploadError) { toast.error(uploadError.message); setUploadingPortfolio(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('worker-portfolio').getPublicUrl(path);
    const { data, error } = await supabase.from('worker_portfolio').insert({ worker_id: workerProfile.id, image_url: publicUrl }).select('id, image_url').single();
    if (error) toast.error(error.message);
    else if (data) { setPortfolioImages(prev => [...prev, data]); toast.success('Photo uploaded!'); }
    setUploadingPortfolio(false);
  };

  const handleDeletePortfolio = async (id: string) => {
    await supabase.from('worker_portfolio').delete().eq('id', id);
    setPortfolioImages(prev => prev.filter(p => p.id !== id));
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  if (loading || !workerProfile) {
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
      <div className="container py-8 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-heading text-2xl font-bold text-foreground">{t('dashboard')}</h1>
            <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {t('logout')}
            </button>
          </div>

          {/* Profile header + availability */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={workerProfile.image_url || `https://api.dicebear.com/7.x/personas/svg?seed=${workerProfile.name}`} alt={workerProfile.name} className="w-16 h-16 rounded-xl object-cover bg-muted" />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
              </div>
              <div>
                <h2 className="font-heading font-semibold text-foreground">{workerProfile.name}</h2>
                <p className="text-sm text-primary">{t(`categories.${workerProfile.category}`)}</p>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="mt-1 text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} {t('profile_image')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isActive ? 'text-success' : 'text-muted-foreground'}`}>
                {isActive ? `🟢 ${t('active')}` : `⚪ ${t('offline')}`}
              </span>
              <Switch checked={isActive} onCheckedChange={handleToggleStatus} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
            {(['bookings', 'profile', 'portfolio'] as const).map(tb => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === tb ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tb === 'bookings' ? t('dashboard_page.bookings') : tb === 'profile' ? t('dashboard_page.profile_settings') : t('my_portfolio')}
              </button>
            ))}
          </div>

          {/* Bookings tab */}
          {tab === 'bookings' && (
            <div className="space-y-3">
              {loadingBookings ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                   <p className="text-foreground font-medium">{t('dashboard_page.no_bookings')}</p>
                   <p className="text-sm text-muted-foreground mt-1">{t('dashboard_page.bookings_will_appear')}</p>
                </div>
              ) : (
                bookings.map(booking => (
                  <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{booking.customer_name}</h3>
                        {booking.customer_phone && <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusColors[booking.status] || 'bg-muted text-muted-foreground'}`}>
                        {t(`booking_status.${booking.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{booking.job_description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {booking.booking_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.booking_time}</span>
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => updateBookingStatus(booking.id, 'accepted')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
                          <Check className="w-3 h-3" /> {t('dashboard_page.accept')}
                         </button>
                         <button onClick={() => updateBookingStatus(booking.id, 'rejected')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors">
                           <XCircle className="w-3 h-3" /> {t('dashboard_page.reject')}
                        </button>
                      </div>
                    )}
                    {booking.status === 'accepted' && (
                      <div className="flex gap-2 mt-3">
                        <Link to={`/chat/${booking.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                           <MessageCircle className="w-3 h-3" /> {t('dashboard_page.chat')}
                         </Link>
                         <button onClick={() => updateBookingStatus(booking.id, 'completed')} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
                           <Check className="w-3 h-3" /> {t('dashboard_page.mark_completed')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('full_name')}</label>
                  <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_number')}</label>
                    <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('second_phone')}</label>
                    <input type="tel" value={form.phone2} onChange={e => update('phone2', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('city_village')}</label>
                    <input type="text" value={form.city} onChange={e => update('city', e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('pincode')}</label>
                    <input type="text" value={form.pincode} onChange={e => update('pincode', e.target.value.replace(/\D/g, ''))} className={inputClass} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('state')}</label>
                    <input type="text" value={form.state} onChange={e => update('state', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('category')}</label>
                    <select value={form.category} onChange={e => update('category', e.target.value)} className={inputClass}>
                      {Object.entries(CATEGORY_GROUPS).map(([group, cats]) => (
                        <optgroup key={group} label={t(`category_groups.${group}`)}>
                          {cats.map(cat => (
                            <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('experience')}</label>
                    <input type="number" min={0} max={50} value={form.experience} onChange={e => update('experience', e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('bio')}</label>
                  <textarea rows={3} value={form.bio} onChange={e => update('bio', e.target.value)} className={inputClass} />
                </div>
                <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {saving ? '...' : t('save_changes')}
                </button>
              </div>
            </div>
          )}

          {/* Portfolio tab */}
          {tab === 'portfolio' && (
            <div className="bg-card rounded-2xl border border-border p-6">
              {portfolioImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {portfolioImages.map(img => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                      <img src={img.image_url} alt="Portfolio" className="w-full h-full object-cover" />
                      <button onClick={() => handleDeletePortfolio(img.id)} className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={portfolioInputRef} type="file" accept="image/*" className="hidden" onChange={handlePortfolioUpload} />
              <button onClick={() => portfolioInputRef.current?.click()} disabled={uploadingPortfolio} className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm hover:border-primary/30 transition-colors flex items-center justify-center gap-2">
                {uploadingPortfolio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {t('upload_photos')}
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

export default WorkerDashboard;
