/**
 * SettingsView — Option A: Segmented Bento Hub (3-tab segmented layout)
 * Tab 1 (courses): Unified Course Abbreviations & LT/TH Course Type Table
 * Tab 2 (data): System & PWA Offline Cache (Update/Sync, Clear Cache, Install) + BackupRestore + DangerZone
 * Tab 3 (info): Compact App Identity + Modal Triggers for PeriodStandardsCard & AboutCard (Changelog)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Database,
    Info,
    RefreshCw,
    Download,
    Trash2,
    Clock,
    Sparkles,
    ChevronRight,
    Mail,
    Code2,
    Globe,
    Wifi,
    WifiOff,
    Check,
    AlertTriangle,
    Upload,
    X,
} from 'lucide-react';
import { useScheduleStore, useUIStore } from '@/core/stores';
import { useAnalytics } from '@/core/hooks/useAnalytics';
import { APP_LINKS } from '@/core/config/constants';
import { Card, Badge } from '@/ui/primitives';
import AbbreviationsCard from './AbbreviationsCard';
import CourseTypeCard from './CourseTypeCard';
import BackupRestoreCard from './BackupRestoreCard';
import DangerZoneCard from './DangerZoneCard';
import PeriodStandardsCard from './PeriodStandardsCard';
import AboutCard from './AboutCard';

type SettingsTabId = 'courses' | 'data' | 'info';

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2026.11.24';

const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { trackInteraction } = useAnalytics();
    const hasCourses = useScheduleStore((s) => Boolean(s.data && s.data.allCourses.length > 0));

    // Default to 'data' (Dữ liệu & PWA) tab so users can immediately check for updates or clear cache
    const [activeTab, setActiveTab] = useState<SettingsTabId>('data');
    const [isOnline, setIsOnline] = useState<boolean>(() =>
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [isStandalone] = useState<boolean>(() =>
        typeof window !== 'undefined' &&
        ((typeof window.matchMedia === 'function' &&
            window.matchMedia('(display-mode: standalone)').matches) ||
            Boolean((window.navigator as unknown as { standalone?: boolean }).standalone))
    );
    const [confirmClearCache, setConfirmClearCache] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [activeModal, setActiveModal] = useState<'periods' | 'changelog' | null>(null);
    const setToast = useUIStore((s) => s.setToast);

    const tabRefs = useRef<Record<SettingsTabId, HTMLButtonElement | null>>({
        courses: null,
        data: null,
        info: null,
    });

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!activeModal) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setActiveModal(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeModal]);

    const showSuccessToast = (msg: string) => {
        setToast(msg, 'success');
    };

    const tabs: { id: SettingsTabId; label: string; icon: React.ReactNode }[] = [
        {
            id: 'data',
            label: t('settings.tabs.data', 'Dữ liệu & PWA'),
            icon: <Database size={15} />,
        },
        {
            id: 'courses',
            label: t('settings.tabs.courses', 'Môn học'),
            icon: <BookOpen size={15} />,
        },
        {
            id: 'info',
            label: t('settings.tabs.info', 'Thông tin'),
            icon: <Info size={15} />,
        },
    ];

    const handleTabChange = (tabId: SettingsTabId) => {
        setActiveTab(tabId);
        trackInteraction('settings_tab_change', { tab: tabId });
    };

    const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
        let nextIndex: number | null = null;
        if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') nextIndex = 0;
        else if (e.key === 'End') nextIndex = tabs.length - 1;

        if (nextIndex !== null) {
            e.preventDefault();
            const nextTab = tabs[nextIndex].id;
            handleTabChange(nextTab);
            tabRefs.current[nextTab]?.focus();
        }
    };

    const handleTriggerClearCache = async () => {
        if (!confirmClearCache) {
            setConfirmClearCache(true);
            window.setTimeout(() => setConfirmClearCache(false), 4500);
            return;
        }

        setIsClearingCache(true);
        trackInteraction('clear_pwa_cache', { source: 'settings_data_tab' });

        const win = window as unknown as { clearPWACache?: () => Promise<void> };
        if (win.clearPWACache) {
            await win.clearPWACache();
        } else {
            if ('caches' in window) {
                const keys = await window.caches.keys();
                await Promise.all(keys.map((key) => window.caches.delete(key)));
            }
            window.location.reload();
        }
    };

    const handleTriggerUpdateCheck = () => {
        trackInteraction('manual_pwa_update_check', { source: 'settings_data_tab' });
        const win = window as unknown as { checkPWAUpdate?: () => void };
        if (win.checkPWAUpdate) {
            win.checkPWAUpdate();
        } else {
            window.location.reload();
        }
    };

    const handleTriggerInstall = () => {
        trackInteraction('manual_pwa_install_click', { source: 'settings_data_tab' });
        const win = window as unknown as { triggerPWAInstall?: () => void; installPWA?: () => void };
        if (win.triggerPWAInstall) {
            win.triggerPWAInstall();
        } else if (win.installPWA) {
            win.installPWA();
        }
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header + 3-Tab Segmented Bento Control */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {t('settings.title')}
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t('settings.subtitle')}
                    </p>
                </div>

                <div
                    role="tablist"
                    aria-label={t('settings.title')}
                    className="grid grid-cols-3 p-1 bg-slate-100/90 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/70 dark:border-slate-700/60 w-full sm:w-auto sm:min-w-[360px]"
                >
                    {tabs.map((tab, idx) => {
                        const isSelected = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                role="tab"
                                id={`settings-tab-${tab.id}`}
                                aria-selected={isSelected}
                                aria-controls={`settings-panel-${tab.id}`}
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => handleTabChange(tab.id)}
                                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                                className={`min-h-[44px] px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition-all select-none cursor-pointer whitespace-nowrap ${
                                    isSelected
                                        ? 'bg-white dark:bg-slate-900 text-accent-600 dark:text-accent-400 shadow-xs border border-slate-200/50 dark:border-slate-700/60'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TAB 1: MÔN HỌC (COURSES) */}
            {activeTab === 'courses' && (
                <div
                    role="tabpanel"
                    id="settings-panel-courses"
                    aria-labelledby="settings-tab-courses"
                    className="animate-in fade-in duration-200"
                >
                    {hasCourses ? (
                        <div className="space-y-6">
                            <AbbreviationsCard onSuccess={showSuccessToast} />
                            <CourseTypeCard onSuccess={showSuccessToast} />
                        </div>
                    ) : (
                        <Card className="p-8 text-center flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                <BookOpen size={22} />
                            </div>
                            <div className="space-y-1 max-w-md">
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {t('settings.coursesEmptyTitle', 'Chưa có dữ liệu học phần')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {t(
                                        'settings.coursesEmptyDesc',
                                        'Tải lên file lịch giảng hoặc tải dữ liệu mẫu để tùy chỉnh tên viết tắt và phân loại Lý thuyết (LT) / Thực hành (TH).'
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="mt-1 px-4 h-10 bg-accent-600 hover:bg-accent-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Upload size={14} />
                                {t('nav.changeFile', 'Đổi file lịch')}
                            </button>
                        </Card>
                    )}
                </div>
            )}

            {/* TAB 2: DỮ LIỆU & PWA (DATA & PWA) */}
            {activeTab === 'data' && (
                <div
                    role="tabpanel"
                    id="settings-panel-data"
                    aria-labelledby="settings-tab-data"
                    className="space-y-5 animate-in fade-in duration-200"
                >
                    {/* System & PWA Offline Cache Bento Card */}
                    <Card className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
                                    <RefreshCw size={20} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                            {t('settings.pwaCache.title', 'Bộ nhớ đệm PWA & Đồng bộ Offline')}
                                        </h3>
                                        <Badge
                                            variant={isOnline ? 'live' : 'morning'}
                                            className="text-[10px] py-0.5 px-2 flex items-center gap-1"
                                        >
                                            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                                            {isOnline
                                                ? t('settings.pwaCache.online', 'Trực tuyến')
                                                : t('settings.pwaCache.offline', 'Ngoại tuyến (100% Offline Ready)')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {t(
                                            'settings.pwaCache.subtitle',
                                            'Làm mới giao diện đã lưu trong Service Worker mà vẫn giữ nguyên 100% lịch giảng dạy của bạn.'
                                        )}
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
                                SW v{APP_VERSION}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Update / Sync Button */}
                            <button
                                type="button"
                                onClick={handleTriggerUpdateCheck}
                                className="w-full min-h-[44px] px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 text-xs font-bold transition-colors cursor-pointer"
                            >
                                <RefreshCw size={15} />
                                {isOnline ? t('pwa.update_check', 'Cập nhật/Đồng bộ') : t('about.reloadApp', 'Tải lại ứng dụng')}
                            </button>

                            {/* Clear Cache Button (2-step safe confirmation) */}
                            <button
                                type="button"
                                onClick={handleTriggerClearCache}
                                disabled={isClearingCache}
                                className={`w-full min-h-[44px] px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                                    confirmClearCache
                                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                        : 'text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200/60 dark:border-amber-800/50'
                                }`}
                            >
                                {confirmClearCache ? <AlertTriangle size={15} /> : <Trash2 size={15} />}
                                {isClearingCache
                                    ? t('settings.pwaCache.clearing', 'Đang xóa cache...')
                                    : confirmClearCache
                                      ? t('settings.pwaCache.confirmClear', 'Bấm lần nữa để xóa Cache')
                                      : t('settings.pwaCache.clearBtn', 'Xóa bộ nhớ đệm (Clear Cache)')}
                            </button>

                            {/* Install PWA Button */}
                            {!isStandalone ? (
                                <button
                                    type="button"
                                    onClick={handleTriggerInstall}
                                    className="w-full min-h-[44px] px-4 rounded-xl bg-accent-600 hover:bg-accent-700 text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                                >
                                    <Download size={15} />
                                    {t('pwa.install_app', 'Cài đặt ứng dụng')}
                                </button>
                            ) : (
                                <div className="min-h-[44px] px-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    <Check size={15} />
                                    {t('settings.pwaCache.installed', 'Đã cài đặt PWA')}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Backup/Restore & Danger Zone Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                        <BackupRestoreCard onSuccess={showSuccessToast} />
                        <DangerZoneCard />
                    </div>
                </div>
            )}

            {/* TAB 3: THÔNG TIN (INFO) */}
            {activeTab === 'info' && (
                <div
                    role="tabpanel"
                    id="settings-panel-info"
                    aria-labelledby="settings-tab-info"
                    className="space-y-4 animate-in fade-in duration-200"
                >
                    {/* Compact App Identity Bento Card */}
                    <Card className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-slate-800 border border-accent-100 dark:border-slate-700 flex items-center justify-center shadow-xs shrink-0">
                                    <img src="/favicon.svg" alt="TdyTime Logo" className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                                            TdyTime
                                        </h3>
                                        <Badge variant="info" className="text-[10px] py-0.5 px-2">
                                            v{APP_VERSION}
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                                        {t('about.tagline', 'Your Time Your Today')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <a
                                    href={APP_LINKS.mailto}
                                    title={APP_LINKS.email}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-accent-50 dark:hover:bg-accent-900/20 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                                >
                                    <Mail size={14} />
                                    <span>Email</span>
                                </a>
                                <a
                                    href={APP_LINKS.github}
                                    title={APP_LINKS.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-accent-50 dark:hover:bg-accent-900/20 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                                >
                                    <Code2 size={14} />
                                    <span>GitHub</span>
                                </a>
                                <a
                                    href={APP_LINKS.web}
                                    title={APP_LINKS.web}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-accent-50 dark:hover:bg-accent-900/20 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                                >
                                    <Globe size={14} />
                                    <span>Web</span>
                                </a>
                            </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/60">
                            {t('about.description')}
                        </p>
                    </Card>

                    {/* Interactive Bento Modal Trigger Rows */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveModal('periods');
                                trackInteraction('open_settings_modal', { modal: 'periods' });
                            }}
                            className="min-h-[64px] p-4 rounded-2xl bg-white/95 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-accent-300 dark:hover:border-accent-700 shadow-xs flex items-center justify-between gap-3 text-left transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Clock size={19} strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {t('about.periodStandards')}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {t('about.note')}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight
                                size={18}
                                className="text-slate-400 group-hover:text-accent-600 dark:group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveModal('changelog');
                                trackInteraction('open_settings_modal', { modal: 'changelog' });
                            }}
                            className="min-h-[64px] p-4 rounded-2xl bg-white/95 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-accent-300 dark:hover:border-accent-700 shadow-xs flex items-center justify-between gap-3 text-left transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Sparkles size={19} strokeWidth={2.2} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                        {t('about.changelog')}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        v{APP_VERSION} • {t('about.tagline', 'Your Time Your Today')}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight
                                size={18}
                                className="text-slate-400 group-hover:text-accent-600 dark:group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                        </button>
                    </div>
                </div>
            )}

            {/* On-Demand Accessible Modal Dialog for Period Standards & Changelog */}
            {activeModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="settings-modal-title"
                    onClick={() => setActiveModal(null)}
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                    >
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                            <h2
                                id="settings-modal-title"
                                className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider"
                            >
                                {activeModal === 'periods'
                                    ? t('about.periodStandards')
                                    : `${t('about.changelog')} (v${APP_VERSION})`}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setActiveModal(null)}
                                aria-label={t('common.close', 'Đóng')}
                                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
                            {activeModal === 'periods' ? (
                                <PeriodStandardsCard hideHeader />
                            ) : (
                                <AboutCard hideHeader />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
