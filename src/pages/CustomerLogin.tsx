import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CustomerLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signInCustomer, user, role, loading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && role === 'customer') navigate('/customer/dashboard');
  }, [user, role, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signInCustomer(phone, password);
    setSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      navigate('/customer/dashboard');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-12 md:py-20 max-w-sm mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-heading text-2xl font-bold text-foreground text-center">Customer Login</h1>
          <p className="text-center text-muted-foreground text-sm mt-2">
            Don't have an account? <Link to="/customer/signup" className="text-primary font-medium hover:underline">{t('sign_up')}</Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('phone_number')}</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('password')}</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
            </div>
            <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? '...' : t('login')}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-xs mt-6">
            Are you a worker? <Link to="/worker/login" className="text-primary font-medium hover:underline">Worker Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerLogin;
