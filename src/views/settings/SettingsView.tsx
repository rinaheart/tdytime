/**
 * SettingsView — Full Settings Page
 * App identity header + settings cards + toast notification system.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Settings2, Mail, Globe, RefreshCw } from 'lucide-react';
import CourseTypeCard from './CourseTypeCard';
import AbbreviationsCard from './AbbreviationsCard';
import ThresholdsCard from './ThresholdsCard';
import DangerZoneCard from './DangerZoneCard';
import PeriodStandardsCard from './PeriodStandardsCard';
import AboutCard from './AboutCard';
import { APP_VERSION } from '@/core/constants';

const SettingsView: React.FC = () => {
    const { t } = useTranslation();
    const [toast, setToast] = useState<{ message: string } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSuccess = (message: string) => setToast({ message });

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-6 relative">
            {/* Toast */}
            {toast && (
                <div className="fixed top-20 right-4 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                        <div className="bg-green-500 rounded-full p-1 text-white">
                            <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-xs font-bold">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* App Identity Header */}
            <div className="pt-1 pb-4 flex flex-col items-center text-center">
                <img src="/favicon.svg" alt="App Logo" className="w-16 h-16 mb-4 drop-shadow-sm" />

                <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-baseline gap-1.5">
                    TdyTime <span className="text-slate-400 font-num text-[10px] font-medium">v{APP_VERSION}</span>
                </h1>
                <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5 font-medium tracking-wide">
                    {t('app.tagline')}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 max-w-xs mx-auto leading-relaxed">
                    {t('about.description')}
                </p>
                <div className="flex justify-center gap-2 mt-3">
                    <a href="mailto:tdyphan@gmail.com" aria-label="Email" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-accent-100 dark:hover:bg-accent-900/20 transition-colors text-slate-500 dark:text-slate-400 hover:text-accent-600">
                        <Mail size={16} />
                    </a>
                    <a href="https://github.com/tdyphan" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-accent-100 dark:hover:bg-accent-900/20 transition-colors text-slate-500 dark:text-slate-400 hover:text-accent-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                    </a>
                    <a href="https://tdyphan.com" target="_blank" rel="noopener noreferrer" aria-label="Website" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-accent-100 dark:hover:bg-accent-900/20 transition-colors text-slate-500 dark:text-slate-400 hover:text-accent-600">
                        <Globe size={16} />
                    </a>
                </div>
            </div>

            {/* PWA Update Check */}
            <div className="flex justify-center -mt-4">
                <button
                    onClick={() => (window as unknown as { checkPWAUpdate?: () => void }).checkPWAUpdate?.()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 dark:bg-accent-900/10 text-accent-600 dark:text-accent-400 rounded-xl text-[11px] font-bold hover:bg-accent-100 dark:hover:bg-accent-900/20 active:scale-95 transition-all border border-accent-100/50 dark:border-accent-900/20"
                >
                    <RefreshCw size={12} strokeWidth={2.5} />
                    {t('pwa.update_check')}
                </button>
            </div>

            {/* Primary Settings */}
            <AbbreviationsCard onSuccess={handleSuccess} />

            {/* Advanced Settings Collapsible */}
            <div className="space-y-4">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 group-hover:text-accent-600 transition-colors">
                            <Settings2 size={20} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                {t('settings.advanced.title')}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium">
                                {t('settings.advanced.description')}
                            </p>
                        </div>
                    </div>
                    <div className={`text-slate-400 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </button>

                {showAdvanced && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        <CourseTypeCard onSuccess={handleSuccess} />
                        <ThresholdsCard onSuccess={handleSuccess} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <DangerZoneCard />
                            <div className="hidden md:block" />
                        </div>
                    </div>
                )}
            </div>

            {/* Period Standards & Changelog */}
            <PeriodStandardsCard />
            <AboutCard />

            <div className="text-center text-slate-400 text-[10px] mt-8">
                {t('common.copyright')}
            </div>
        </div>
    );
};

export default SettingsView;
