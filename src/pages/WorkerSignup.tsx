import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_GROUPS } from '@/data/mockWorkers';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type WorkerCategory = Database['public']['Enums']['worker_category'];

const WorkerSignup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUpWorker } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', phone2: '', password: '', confirmPassword: '',
    city: '', pincode: '', state: '', category: '' as string, experience: '',
    bio: '',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    const { error } = await signUpWorker(form.phone, form.password, {
      name: form.name,
      phone: form.phone,
      phone2: form.phone2 || null,
      city: form.city,
      pincode: form.pincode,
      state: form.state,
      category: form.category as WorkerCategory,
      experience: parseInt(form.experience) || 0,
      description: form.bio || null,
      image_url: null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Account created successfully!');
      navigate('/worker/dashboard');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">{t('worker_signup')}</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">
            {t('already_have_account')} <Link to="/worker/login" className="text-primary font-medium hover:underline">{t('login')}</Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('full_name')}</label>
              <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_number')}</label>
                <input type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('second_phone')}</label>
                <input type="tel" value={form.phone2} onChange={e => update('phone2', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('password')}</label>
                <input type="password" required value={form.password} onChange={e => update('password', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('confirm_password')}</label>
                <input type="password" required value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('city_village')}</label>
                <input type="text" required value={form.city} onChange={e => update('city', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('pincode')}</label>
                <input type="text" required inputMode="numeric" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value.replace(/\D/g, ''))} className={inputClass} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('state')}</label>
                <input type="text" required value={form.state} onChange={e => update('state', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('category')}</label>
                <select required value={form.category} onChange={e => update('category', e.target.value)} className={inputClass}>
                  <option value="">—</option>
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
                <input type="number" required min={0} max={50} value={form.experience} onChange={e => update('experience', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('bio')}</label>
              <textarea rows={3} value={form.bio} onChange={e => update('bio', e.target.value)} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? '...' : t('sign_up')}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkerSignup;
