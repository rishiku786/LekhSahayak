import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'mr', label: 'मराठी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'gu', label: 'ગુજરાતી' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (e) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('suno-sarkar-lang', lang);
  };

  return (
    <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--border-subtle)' }}>
      <Globe className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      <select
        value={i18n.language}
        onChange={changeLanguage}
        className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
        style={{ color: 'var(--text-secondary)' }}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{lang.label}</option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
