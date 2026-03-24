import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSetup = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const navigate = useNavigate();

  const adminUsername = 'Admin@123';
  const adminPassword = 'Rahman@2005';
  const adminEmail = `admin_${adminUsername.toLowerCase().replace(/[^a-z0-9]/g, '')}@worknear.local`;

  useEffect(() => {
    checkIfAdminExists();
  }, []);

  const checkIfAdminExists = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (!error && data.user) {
        await supabase.auth.signOut();
        setAlreadySetup(true);
      }
    } catch {
      // ignore, treated as not existing
    } finally {
      setChecking(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: { emailRedirectTo: undefined },
      });

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered')) {
          setAlreadySetup(true);
          toast('Admin already exists', {
            description: 'The default admin account is already created.',
          });
          return;
        }
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('Failed to create admin user');
      }

      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin',
      });

      if (roleError) {
        throw roleError;
      }

      await supabase.auth.signOut();

      toast('Setup complete', {
        description: 'Default admin account created. You can now log in.',
      });
      setAlreadySetup(true);
    } catch (error: any) {
      toast('Setup failed', {
        description: error.message || 'An error occurred during setup.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            {alreadySetup ? 'Admin Setup Complete' : 'Initial Admin Setup'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {alreadySetup
              ? 'The default admin account has been created.'
              : 'Create the default admin account to get started.'}
          </p>
        </div>

        {alreadySetup ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center text-green-500">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Admin credentials:</p>
              <p className="text-muted-foreground">
                <strong>Username:</strong> {adminUsername}
              </p>
              <p className="text-muted-foreground">
                <strong>Password:</strong> {adminPassword}
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Go to Admin Login
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="text-muted-foreground">
                This will create the default admin account with the following credentials:
              </p>
              <ul className="mt-2 space-y-1">
                <li>
                  <strong>Username:</strong> {adminUsername}
                </li>
                <li>
                  <strong>Password:</strong> {adminPassword}
                </li>
              </ul>
            </div>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Admin Account
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminSetup;

