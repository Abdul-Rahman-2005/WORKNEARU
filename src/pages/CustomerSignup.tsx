import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CustomerSignup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUpCustomer } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', password: '', confirmPassword: '',
    city: '', district: '', pincode: '',
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
    const { error } = await signUpCustomer(form.phone, form.password, {
      name: form.name,
      phone: form.phone,
      city: form.city,
      district: form.district,
      pincode: form.pincode,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Account created successfully!');
      navigate('/customer/dashboard');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8 md:py-12 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">Customer Sign Up</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">
            Already have an account? <Link to="/customer/login" className="text-primary font-medium hover:underline">{t('login')}</Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('full_name')}</label>
              <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_number')}</label>
              <input type="tel" required value={form.phone} onChange={e => update('phone', e.target.value)} className={inputClass} />
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
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">District</label>
                <input type="text" required value={form.district} onChange={e => update('district', e.target.value)} className={inputClass} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('pincode')}</label>
                <input type="text" required inputMode="numeric" maxLength={6} value={form.pincode} onChange={e => update('pincode', e.target.value.replace(/\D/g, ''))} className={inputClass} />
              </div>
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? '...' : t('sign_up')}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-xs mt-6">
            Are you a worker? <Link to="/worker/signup" className="text-primary font-medium hover:underline">Register as Worker</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerSignup;
