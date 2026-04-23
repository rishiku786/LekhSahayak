import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import paTranslations from '../locales/pa.json';
import mrTranslations from '../locales/mr.json';
import bnTranslations from '../locales/bn.json';
import taTranslations from '../locales/ta.json';
import teTranslations from '../locales/te.json';
import guTranslations from '../locales/gu.json';

// Supported languages list
const supportedLangs = ['en', 'hi', 'pa', 'mr', 'bn', 'ta', 'te', 'gu'];

// Browser/OS ki language detect karo
const getBrowserLang = () => {
  // navigator.languages = ['hi-IN', 'en-US'] type array hota hai
  const langs = navigator.languages || [navigator.language || 'en'];
  
  for (const lang of langs) {
    const code = lang.split('-')[0].toLowerCase(); // 'hi-IN' → 'hi'
    if (supportedLangs.includes(code)) {
      return code;
    }
  }
  return 'en'; // default
};

// Priority: 1. User ne manually select kiya  2. Browser language  3. English
const detectedLang = localStorage.getItem('suno-sarkar-lang') || getBrowserLang();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      pa: { translation: paTranslations },
      mr: { translation: mrTranslations },
      bn: { translation: bnTranslations },
      ta: { translation: taTranslations },
      te: { translation: teTranslations },
      gu: { translation: guTranslations },
    },
    lng: detectedLang,
    fallbackLng: 'en', // koi string missing ho toh English use karo
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
