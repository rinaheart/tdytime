/**
 * i18n Configuration — TdyTime v2
 * Critical translations embedded directly for instant availability.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_VERSION } from '@/core/constants';

// 🎯 Critical translations embedded directly (no window dependency)
const CRITICAL_TRANSLATIONS: Record<string, Record<string, string>> = {
    vi: {
        'app.title': 'TdyTime {{version}}',
        'app.tagline': 'Your Today, Your Time',
        'app.uploadTitle': 'Tải tệp lịch',
        'app.uploadDesc': 'Hỗ trợ .html hoặc .json',
        'app.pasteTitle': 'Dán mã HTML',
        'app.pasteDesc': 'Dán trực tiếp từ trang web',
        'app.pastePlaceholder': 'Dán nội dung HTML tại đây...',
        'app.recentHistory': 'Dữ liệu gần đây',
        'app.demoMode': 'Chế độ demo',
        'common.copyright': '© 2026 TdyTime | Google AI Studio',
        'common.loading': 'Đang tải...',
        'common.processing': 'Đang xử lý dữ liệu...',
        'common.appName': 'TdyTime',
        'common.save': 'Lưu',
        'common.cancel': 'Hủy',
        'common.back': 'Quay lại',
        'common.close': 'Đóng',
        'common.switchLanguage': 'Chuyển ngữ',
        'common.lightMode': 'Sáng',
        'common.darkMode': 'Tối',
        'nav.today': 'Hôm nay',
        'nav.weekly': 'Lịch tuần',
        'nav.semester': 'Học kỳ',
        'nav.statistics': 'Thống kê',
        'nav.settings': 'Cài đặt',
        'nav.loadData': 'Nạp dữ liệu',
        'nav.appearance': 'Giao diện',
        'nav.expandSidebar': 'Mở rộng',
        'nav.collapseSidebar': 'Thu gọn',
        'settings.themes.title': 'Giao diện',
        'settings.themes.themeBlue': 'Xanh dương',
        'settings.themes.themeGreen': 'Xanh lá',
        'settings.themes.themePink': 'Hồng',
        'settings.themes.themeViolet': 'Tím',
        'settings.themes.themeRed': 'Đỏ',
        'settings.themes.themeYellow': 'Vàng',
        'settings.themes.themeGrey': 'Xám',
        'pwa.install_title': 'Cài đặt TdyTime',
        'pwa.install_desc': 'Cài app để truy cập nhanh và offline.',
        'pwa.install_button': 'Cài đặt',
        'pwa.updateReady': 'Đã có bản cập nhật! 🚀',
        'pwa.updateReadyDesc': 'Bản mới đã sẵn sàng. Nâng cấp để cập nhật tính năng.',
        'pwa.offlineReady': 'Sẵn sàng hoạt động ngoại tuyến',
        'pwa.offlineReadyDesc': 'Ứng dụng đã được cache để dùng khi không có mạng.',
        'pwa.reloadButton': 'Nâng cấp ngay',
        'pwa.checking': 'Đang kiểm tra...',
        'pwa.check_error': 'Lỗi kiểm tra',
        'pwa.up_to_date': 'Đã cập nhật',
    },
    en: {
        'app.title': 'TdyTime {{version}}',
        'app.tagline': 'Your Today, Your Time',
        'app.uploadTitle': 'Upload Schedule',
        'app.uploadDesc': 'Supports .html or .json',
        'app.pasteTitle': 'Paste HTML',
        'app.pasteDesc': 'Paste directly from portal',
        'app.pastePlaceholder': 'Paste HTML content here...',
        'app.recentHistory': 'Recent History',
        'app.demoMode': 'Demo Mode',
        'common.copyright': '© 2026 TdyTime | Google AI Studio',
        'common.loading': 'Loading...',
        'common.processing': 'Processing data...',
        'common.appName': 'TdyTime',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.back': 'Back',
        'common.close': 'Close',
        'common.switchLanguage': 'Switch Language',
        'common.lightMode': 'Light',
        'common.darkMode': 'Dark',
        'nav.today': 'Today',
        'nav.weekly': 'Weekly',
        'nav.semester': 'Semester',
        'nav.statistics': 'Statistics',
        'nav.settings': 'Settings',
        'nav.loadData': 'Load Data',
        'nav.appearance': 'Appearance',
        'nav.expandSidebar': 'Expand',
        'nav.collapseSidebar': 'Collapse',
        'settings.themes.title': 'Themes',
        'settings.themes.themeBlue': 'Blue',
        'settings.themes.themeGreen': 'Green',
        'settings.themes.themePink': 'Pink',
        'settings.themes.themeViolet': 'Violet',
        'settings.themes.themeRed': 'Red',
        'settings.themes.themeYellow': 'Yellow',
        'settings.themes.themeGrey': 'Grey',
        'pwa.install_title': 'Install TdyTime',
        'pwa.install_desc': 'Install the app for quick access and offline use.',
        'pwa.install_button': 'Install',
        'pwa.updateReady': 'Update Ready! 🚀',
        'pwa.updateReadyDesc': 'A new release is ready. Update to get latest features.',
        'pwa.offlineReady': 'Ready for offline use',
        'pwa.offlineReadyDesc': 'App assets cached for offline operation.',
        'pwa.reloadButton': 'Update Now',
        'pwa.checking': 'Checking...',
        'pwa.check_error': 'Check error',
        'pwa.up_to_date': 'Up to date',
    }
};

// Detect saved language preference
let defaultLanguage = 'vi';
try {
    defaultLanguage = localStorage.getItem('language') || 'vi';
} catch {
    console.warn('LocalStorage not accessible, falling back to "vi"');
}

// 🎯 Build initial resources with critical translations
const resources: Record<string, { translation: Record<string, any> }> = {
    vi: { translation: CRITICAL_TRANSLATIONS.vi },
    en: { translation: CRITICAL_TRANSLATIONS.en },
};

i18n.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'vi',
    interpolation: {
        escapeValue: false,
        defaultVariables: { version: APP_VERSION },
    },
    react: {
        useSuspense: false,
    },
    partialBundledLanguages: true,
});

/**
 * Lazy load a resource bundle (full translations)
 */
export const loadLanguage = async (lng: string) => {
    if (!i18n.hasResourceBundle(lng, 'translation')) {
        try {
            const resources = await import(`./locales/${lng}.json`);
            // false = don't deep overwrite, preserves critical translations
            i18n.addResourceBundle(lng, 'translation', resources.default, false, true);
        } catch (error) {
            console.error(`Failed to load language: ${lng}`, error);
        }
    }
};

// Initial load for fallback language and current language
if (defaultLanguage !== 'vi') {
    loadLanguage('vi'); // Always preload vi as fallback
}
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

// 🎯 Export promise for main.tsx to wait on (usually resolves <50ms)
export const i18nReady = new Promise<void>(async (resolve) => {
    const initPromise = new Promise<void>((res) => {
        if (i18n.isInitialized) res();
        else i18n.on('initialized', res);
    });
    await initPromise;
    try {
        await loadLanguage(defaultLanguage);
    } catch (e) {
        console.warn('i18n: failed to preload default language', e);
    }
    resolve();
});

export default i18n;
