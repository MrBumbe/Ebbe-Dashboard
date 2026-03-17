import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import sv from './locales/sv.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import nl from './locales/nl.json';

const SUPPORTED_LANGS = ['en', 'sv', 'fr', 'de', 'es', 'nl'];
const stored = localStorage.getItem('ebbe_lang') ?? 'en';
const lng = SUPPORTED_LANGS.includes(stored) ? stored : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    sv: { translation: sv },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    nl: { translation: nl },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
