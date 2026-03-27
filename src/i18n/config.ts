/**
 * i18n Configuration — TdyTime v2
 * Loads Vietnamese and English translations with localStorage persistence.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_VERSION } from '@/core/constants';

// Detect saved language preference
let defaultLanguage = 'vi';
try {
    defaultLanguage = localStorage.getItem('language') || 'vi';
} catch {
    console.warn('LocalStorage not accessible, falling back to "vi"');
}

// Pre-load the initial language statically for first render if possible, 
// but since we want to split chunks, we'll initialize without resources 
// and add them immediately.
i18n.use(initReactI18next).init({
    resources: {},
    lng: defaultLanguage,
    fallbackLng: 'vi',
    interpolation: {
        escapeValue: false,
        defaultVariables: { version: APP_VERSION },
    },
    react: {
        useSuspense: true, // Enable suspense for lazy loading
    },
});

/**
 * Lazy load a resource bundle
 */
export const loadLanguage = async (lng: string) => {
    if (!i18n.hasResourceBundle(lng, 'translation')) {
        try {
            const resources = await import(`./locales/${lng}.json`);
            i18n.addResourceBundle(lng, 'translation', resources.default, true, true);
        } catch (error) {
            console.error(`Failed to load language: ${lng}`, error);
        }
    }
};

// Initial load
loadLanguage(defaultLanguage);

/**
 * Custom change language function that ensures resource is loaded
 */
export const changeLanguage = async (lng: string) => {
    await loadLanguage(lng);
    await i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
};

// Sync document lang attribute
i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
});
document.documentElement.lang = i18n.language || defaultLanguage;

export default i18n;
