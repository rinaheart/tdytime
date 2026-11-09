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
    if (import.meta.env.DEV) {
        console.warn('LocalStorage not accessible, falling back to "vi"');
    }
}

/**
 * Lightweight core App Shell & WelcomeView translations (~2 KB) bundled synchronously
 * so the landing screen renders in 0ms without waiting for the 54 KB full locale chunk.
 */
const CORE_SHELL_TRANSLATIONS = {
    vi: {
        app: {
            title: 'TdyTime {{version}}',
            tagline: 'Your Today, Your Time',
            uploadTitle: 'Tải tệp lịch',
            uploadDesc: 'Hỗ trợ .html hoặc .json',
            pasteTitle: 'Dán mã HTML',
            pasteDesc: 'Dán trực tiếp từ trang web',
            pastePlaceholder: 'Dán nội dung HTML tại đây...',
            recentHistory: 'Dữ liệu gần đây',
            dropToUpload: 'Thả để tải lên',
        },
        common: {
            appName: 'TdyTime',
            copyright: '© 2026 TdyTime | Google AI Studio',
            version: 'v{{version}}',
            loading: 'Đang tải...',
            processing: 'Đang xử lý dữ liệu...',
            error: 'Lỗi',
            success: 'Thành công',
            cancel: 'Quay lại',
            delete: 'Xóa dữ liệu',
            save: 'Lưu',
            reset: 'Đặt lại',
            close: 'Đóng',
            back: 'Quay lại',
            switchLanguage: 'Chuyển ngữ',
            lightMode: 'Sáng',
            darkMode: 'Tối',
        },
        settings: {
            themes: {
                title: 'Giao diện',
                themeBlue: 'Xanh biển',
                themeGreen: 'Xanh ngọc',
                themePink: 'Hồng đào',
                themeViolet: 'Tím hoa',
                themeRed: 'Đỏ son',
                themeYellow: 'Vàng mật',
                themeGrey: 'Xám sương',
            },
            dangerZone: {
                title: 'Xóa dữ liệu',
                confirmButton: 'Xác nhận xóa',
            },
        },
        upload: {
            errors: {
                fileTooLarge: 'File quá lớn. Vui lòng chọn file dưới 2MB.',
            },
        },
        pwa: {
            offlineReady: 'Sẵn sàng hoạt động độc lập (Offline-First)',
            offlineReadyDesc: 'TdyTime hoạt động 100% trên thiết bị mà không cần kết nối mạng.',
            updateReady: 'TdyTime đã có bản cập nhật mới! 🚀',
            updateReadyDesc: 'Bản cập nhật tối ưu đã sẵn sàng.\nBạn có muốn nâng cấp?',
            reloadButton: 'Nâng cấp ngay',
            update_check: 'Cập nhật/Đồng bộ',
            checking: 'Đang cập nhật & đồng bộ...',
            up_to_date: 'Đã đồng bộ & ở bản mới nhất',
            check_error: 'Lỗi kiểm tra',
            install_title: 'Cài đặt TdyTime',
            install_desc: 'Thêm ứng dụng vào màn hình chính và theo dõi lịch giảng offline (không cần internet).',
            install_button: 'Cài đặt',
            install_app: 'Cài đặt ứng dụng',
            offline_mode: 'Đang ngoại tuyến — Mọi tính năng lịch vẫn hoạt động bình thường. Kết nối mạng để kiểm tra cập nhật mới.',
            ios_guide_title: 'Cài đặt TdyTime trên thiết bị',
            ios_guide_step1: '1. Nhấn vào biểu tượng Chia sẻ (Share) hoặc Menu trình duyệt.',
            ios_guide_step2: "2. Chọn 'Thêm vào Màn hình chính' (Add to Home Screen) hoặc 'Cài đặt ứng dụng'.",
        },
    },
    en: {
        app: {
            title: 'TdyTime {{version}}',
            tagline: 'Your Today, Your Time',
            uploadTitle: 'Upload Schedule File',
            uploadDesc: 'Supports .html or .json',
            pasteTitle: 'Paste HTML Code',
            pasteDesc: 'Paste directly from webpage',
            pastePlaceholder: 'Paste HTML content here...',
            recentHistory: 'Recent Data',
            dropToUpload: 'Drop to upload',
        },
        common: {
            appName: 'TdyTime',
            copyright: '© 2026 TdyTime | Google AI Studio',
            version: 'v{{version}}',
            loading: 'Loading...',
            processing: 'Processing data...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            delete: 'Delete Data',
            save: 'Save',
            reset: 'Reset',
            close: 'Close',
            back: 'Back',
            switchLanguage: 'Switch Language',
            lightMode: 'Light',
            darkMode: 'Dark',
        },
        settings: {
            themes: {
                title: 'Theme',
                themeBlue: 'Ocean Blue',
                themeGreen: 'Emerald Green',
                themePink: 'Sakura Pink',
                themeViolet: 'Lavender Purple',
                themeRed: 'Crimson Red',
                themeYellow: 'Honey Yellow',
                themeGrey: 'Mist Gray',
            },
            dangerZone: {
                title: 'Delete Data',
                confirmButton: 'Confirm Delete',
            },
        },
        upload: {
            errors: {
                fileTooLarge: 'File too large. Please select a file under 2MB.',
            },
        },
        pwa: {
            offlineReady: 'Offline-First Ready',
            offlineReadyDesc: 'TdyTime works 100% locally on your device without needing an internet connection.',
            updateReady: 'TdyTime new update is ready! 🚀',
            updateReadyDesc: 'Optimized version ready.\nUpdate now?',
            reloadButton: 'Upgrade Now',
            update_check: 'Update/Sync',
            checking: 'Updating & syncing...',
            up_to_date: 'Synced & up to date',
            check_error: 'Update check failed',
            install_title: 'Install TdyTime',
            install_desc: 'Add the app to your home screen to access your teaching schedule offline.',
            install_button: 'Install',
            install_app: 'Install App',
            offline_mode: "You're offline — All schedule features work normally. Connect to the internet to check for updates.",
            ios_guide_title: 'Install TdyTime on your device',
            ios_guide_step1: '1. Tap the Share icon or browser menu button.',
            ios_guide_step2: "2. Select 'Add to Home Screen' or 'Install App'.",
        },
    },
};

const loadedFullBundles = new Set<string>();

i18n.use(initReactI18next).init({
    resources: {
        vi: { translation: CORE_SHELL_TRANSLATIONS.vi },
        en: { translation: CORE_SHELL_TRANSLATIONS.en },
    },
    lng: defaultLanguage,
    fallbackLng: 'vi',
    partialBundledLanguages: true,
    interpolation: {
        escapeValue: false,
        defaultVariables: { version: APP_VERSION },
    },
    react: {
        useSuspense: false,
    },
});

/**
 * Lazy load the full locale dictionary (`vi.json` or `en.json`)
 */
export const loadLanguage = async (lng: string) => {
    const targetLng = lng === 'en' ? 'en' : 'vi';
    if (loadedFullBundles.has(targetLng)) return;
    try {
        const resources =
            targetLng === 'en'
                ? await import('./locales/en.json')
                : await import('./locales/vi.json');
        i18n.addResourceBundle(targetLng, 'translation', resources.default, true, true);
        loadedFullBundles.add(targetLng);
    } catch (error) {
        console.error(`Failed to load language: ${targetLng}`, error);
    }
};

// Load full locale immediately if user has existing data, is on an inner route, or in tests;
// otherwise defer full locale warmup until after initial WelcomeView idle window.
const shouldLoadFullLocaleImmediately = () => {
    try {
        if (import.meta.env.MODE === 'test') return true;
        if (typeof window === 'undefined') return true;
        const hash = window.location.hash;
        if (hash && hash !== '#' && hash !== '#/') return true;
        if (localStorage.getItem('last_schedule_data') || localStorage.getItem('exam-storage')) return true;
    } catch {
        return true;
    }
    return false;
};

if (shouldLoadFullLocaleImmediately()) {
    void loadLanguage(defaultLanguage);
} else if (typeof window !== 'undefined') {
    window.setTimeout(() => {
        void loadLanguage(defaultLanguage);
    }, 5500);
}

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
