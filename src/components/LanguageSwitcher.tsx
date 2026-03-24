import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const langs = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{langs.find(l => l.code === i18n.language)?.label || 'English'}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px]">
        {langs.map(lang => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`block w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted first:rounded-t-lg last:rounded-b-lg ${
              i18n.language === lang.code ? 'text-primary font-semibold bg-accent' : 'text-foreground'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
