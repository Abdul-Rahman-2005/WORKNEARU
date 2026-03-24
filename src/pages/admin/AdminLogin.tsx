import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Map username to email (lowercase)
    const email = `admin_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@worknear.local`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(t('admin.invalid_credentials'));
      setLoading(false);
      return;
    }

    // Check admin role
    const { data: hasRole } = await (supabase.rpc as any)('has_role', {
      _user_id: data.user.id,
      _role: 'admin'
    });

    if (!hasRole) {
      toast.error(t('admin.access_denied'));
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    navigate('/admin');
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t('admin.login_title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('admin.login_subtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('admin.username')}</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className={inputClass}
              placeholder={t('admin.username_placeholder')}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('login')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
