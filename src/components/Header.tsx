import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wrench, Menu, X, Shield } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl text-foreground">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          {t('app_name')}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {t('home')}
          </Link>
          {user && role === 'worker' ? (
            <Link
              to="/worker/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/worker/dashboard' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t('dashboard')}
            </Link>
          ) : user && role === 'customer' ? (
            <Link
              to="/customer/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/customer/dashboard' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {t('dashboard_page.my_dashboard')}
            </Link>
          ) : (
            <>
              <Link
                to="/worker/login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/worker') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('for_workers')}
              </Link>
              <Link
                to="/customer/login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/customer') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('customer_login')}
              </Link>
              <Link
                to="/admin/login"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  location.pathname.startsWith('/admin') ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                {t('admin_login')}
              </Link>
            </>
          )}
          <ThemeToggle />
          <LanguageSwitcher />
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{t('home')}</Link>
          {user && role === 'worker' ? (
            <Link to="/worker/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{t('dashboard')}</Link>
          ) : user && role === 'customer' ? (
            <Link to="/customer/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{t('dashboard_page.my_dashboard')}</Link>
          ) : (
            <>
              <Link to="/worker/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{t('for_workers')}</Link>
              <Link to="/customer/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{t('customer_login')}</Link>
              <Link to="/admin/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                <Shield className="w-3.5 h-3.5" /> {t('admin_login')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
