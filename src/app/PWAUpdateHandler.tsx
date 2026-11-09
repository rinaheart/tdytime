/**
 * PWAUpdateHandler — Manages PWA Registration, Install Prompt, Offline Status & Update Notifications
 * Handles "Check for updates", In-App Install Prompt, iOS Install Guide, and Offline Indicator.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Download, Check, X, WifiOff } from 'lucide-react';
import { draftService } from '@/core/notes/draft.service';

const INSTALL_PROMPT_DISMISS_KEY = 'tdytime_install_prompt_dismissed';
const PWA_DISMISS_KEY = 'tdytime_pwa_dismiss_date';
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type CheckStatus = 'idle' | 'checking' | 'up-to-date' | 'error';

export const PWAUpdateHandler: React.FC = () => {
    const { t } = useTranslation();
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [checkStatus, setCheckStatus] = useState<CheckStatus>('idle');
    const [isDismissed, setIsDismissed] = useState(true);
    const [updateBypassed, setUpdateBypassed] = useState(false);
    const [showInstallGuide, setShowInstallGuide] = useState(false);
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );
    const [isInstalled, setIsInstalled] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true
        );
    });

    const timeoutIds = useRef<number[]>([]);
    const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

    const addTimeout = useCallback((fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            fn();
            timeoutIds.current = timeoutIds.current.filter(tid => tid !== id);
        }, delay);
        timeoutIds.current.push(id);
    }, []);

    // Check dismiss status on mount
    useEffect(() => {
        const lastDismissed = localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY);
        if (lastDismissed) {
            const ts = Number(lastDismissed);
            if (!Number.isNaN(ts)) {
                const timePassed = Date.now() - ts;
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setIsDismissed(timePassed < DISMISS_DURATION);
            } else {
                setIsDismissed(false);
            }
        } else {
            setIsDismissed(false);
        }

        const timeouts = timeoutIds.current;
        return () => {
            timeouts.forEach(id => window.clearTimeout(id));
        };
    }, []);

    // Online / Offline connectivity listener
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

    const sw = useRegisterSW({
        onRegistered() {
            // SW registered successfully
        },
        onRegisterError() {
            // SW registration failed silently
        },
    });

    const [offlineReady, setOfflineReady] = Array.isArray(sw.offlineReady)
        ? sw.offlineReady
        : [sw.offlineReady, () => { }];
    const [needUpdate, setNeedUpdate] = Array.isArray(sw.needRefresh)
        ? sw.needRefresh
        : [sw.needRefresh, () => { }];
    const { updateServiceWorker } = sw;

    const needUpdateRef = useRef(needUpdate);
    const checkStatusRef = useRef(checkStatus);

    useEffect(() => {
        needUpdateRef.current = needUpdate;
    }, [needUpdate]);

    useEffect(() => {
        checkStatusRef.current = checkStatus;
    }, [checkStatus]);

    useEffect(() => {
        installPromptRef.current = installPrompt;
    }, [installPrompt]);

    useEffect(() => {
        const handleInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
            setShowInstallGuide(false);
        };

        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const close = () => {
        if (needUpdate) {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(PWA_DISMISS_KEY, today);
        }
        setOfflineReady(false);
        setNeedUpdate(false);
        setUpdateBypassed(false);
    };

    const handleUpdate = () => {
        // Synchronously flush active drafts in current tab before service worker update reload
        draftService.flushAll();
        updateServiceWorker(true);
    };

    const handleDismissInstall = useCallback(() => {
        localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, Date.now().toString());
        setIsDismissed(true);
        setInstallPrompt(null);
    }, []);

    const handleInstall = useCallback(async () => {
        const currentPrompt = installPromptRef.current;
        if (!currentPrompt) {
            setShowInstallGuide(true);
            return;
        }
        await currentPrompt.prompt();
        const { outcome } = await currentPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
            setInstallPrompt(null);
        } else {
            handleDismissInstall();
        }
    }, [handleDismissInstall]);

    // Expose checkPWAUpdate and triggerPWAInstall functions to window for SettingsView to trigger
    useEffect(() => {
        const checkFn = async () => {
            if (checkStatusRef.current === 'checking') return;

            setCheckStatus('checking');

            try {
                if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        await registration.update();

                        addTimeout(() => {
                            if (needUpdateRef.current) {
                                setUpdateBypassed(true);
                                setCheckStatus('idle');
                            } else {
                                setCheckStatus('up-to-date');
                                addTimeout(() => setCheckStatus('idle'), 3000);
                            }
                        }, 1200);
                    } else {
                        // In dev mode or before initial SW activation, resolve cleanly as up-to-date
                        addTimeout(() => {
                            setCheckStatus('up-to-date');
                            addTimeout(() => setCheckStatus('idle'), 3000);
                        }, 800);
                    }
                } else {
                    throw new Error('Service Workers not supported');
                }
            } catch {
                setCheckStatus('error');
                addTimeout(() => setCheckStatus('idle'), 3000);
            }
        };

        const win = window as unknown as {
            checkPWAUpdate?: () => Promise<void>;
            triggerPWAInstall?: () => Promise<void>;
        };
        win.checkPWAUpdate = checkFn;
        win.triggerPWAInstall = handleInstall;

        return () => {
            delete win.checkPWAUpdate;
            delete win.triggerPWAInstall;
        };
    }, [addTimeout, handleInstall]);

    return (
        <>
            {/* Offline Mode Indicator Banner (Bottom Left) */}
            {!isOnline && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed bottom-20 lg:bottom-4 left-4 z-[95] flex items-center gap-2 rounded-xl bg-amber-500/95 dark:bg-amber-600/95 px-3.5 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-200"
                >
                    <WifiOff size={14} className="shrink-0" />
                    <span>{t('pwa.offline_mode')}</span>
                </div>
            )}

            {/* Install Prompt Banner (Bottom Left/Center) */}
            {installPrompt && !isDismissed && !isInstalled && (
                <div className="fixed bottom-24 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-sm z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border-[1.5px] border-accent-500 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 relative mx-auto max-w-[calc(100vw-2rem)] md:max-w-none">
                        <button
                            type="button"
                            onClick={handleDismissInstall}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center"
                            aria-label={t('common.close', 'Đóng')}
                        >
                            <X size={14} />
                        </button>
                        <div className="flex items-start gap-3 w-full pr-6 justify-center md:justify-start">
                            <div className="w-10 h-10 bg-accent-50 dark:bg-accent-900/20 rounded-xl flex items-center justify-center text-accent-600 shrink-0 mt-0.5">
                                <Download size={20} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                    {t('pwa.install_title')}
                                </h4>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                                    {t('pwa.install_desc')}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleInstall}
                            className="w-full py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-accent-500/20 flex justify-center items-center gap-2"
                        >
                            <Download size={15} strokeWidth={2.5} />
                            {t('pwa.install_button')}
                        </button>
                    </div>
                </div>
            )}

            {/* Install Guide Modal (iOS Safari / Manual Install Fallback) */}
            {showInstallGuide && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="pwa-install-guide-title"
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                >
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <img src="/pwa-64x64.png" alt="TdyTime" className="w-8 h-8 rounded-lg" />
                                <h3 id="pwa-install-guide-title" className="text-sm font-bold text-slate-800 dark:text-white">
                                    {t('pwa.ios_guide_title')}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowInstallGuide(false)}
                                aria-label={t('common.close', 'Đóng')}
                                className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                            {t('pwa.install_desc')}
                        </p>
                        <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <p>{t('pwa.ios_guide_step1')}</p>
                            <p>{t('pwa.ios_guide_step2')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowInstallGuide(false)}
                            className="mt-4 w-full rounded-xl bg-accent-600 hover:bg-accent-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
                        >
                            {t('common.close', 'Đóng')}
                        </button>
                    </div>
                </div>
            )}

            {/* Update / Offline Notification (Top Right) */}
            {(offlineReady || (needUpdate && (updateBypassed || localStorage.getItem(PWA_DISMISS_KEY) !== new Date().toISOString().split('T')[0]))) && (
                <aside role="region" aria-label={needUpdate ? t('pwa.updateReady') : t('pwa.offlineReady')} className="fixed top-20 right-4 z-[110] animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl min-w-[280px]">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex justify-center items-center w-full mb-2 relative">
                                <h4 className="text-xs font-bold text-accent-400 dark:text-accent-700">
                                    {needUpdate ? t('pwa.updateReady') : t('pwa.offlineReady')}
                                </h4>
                                <button type="button" onClick={close} className="absolute -top-1 -right-1 p-1 hover:bg-white/10 dark:hover:bg-slate-100 rounded-xl" aria-label={t('common.close', 'Đóng')}>
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-xs mb-3 font-medium whitespace-pre-line">
                                {needUpdate ? t('pwa.updateReadyDesc') : t('pwa.offlineReadyDesc')}
                            </p>
                        </div>
                        {needUpdate && (
                            <button
                                type="button"
                                onClick={handleUpdate}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-accent-500 text-white rounded-xl text-xs font-bold hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/20"
                            >
                                <RefreshCw size={14} />
                                {t('pwa.reloadButton')}
                            </button>
                        )}
                    </div>
                </aside>
            )}

            {/* Global Check for Update Toast */}
            {checkStatus !== 'idle' && (
                <div role="status" aria-live="polite" className="fixed top-36 right-4 z-[110] animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                        <div className={`${checkStatus === 'checking' ? 'animate-spin' : checkStatus === 'error' ? 'bg-red-500 rounded-full p-0.5 text-white' : 'bg-green-500 rounded-full p-0.5 text-white'}`}>
                            {checkStatus === 'checking' ? <RefreshCw size={14} /> : checkStatus === 'error' ? <X size={12} strokeWidth={4} /> : <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className="text-xs font-bold">
                            {checkStatus === 'checking' ? t('pwa.checking') : checkStatus === 'error' ? t('pwa.check_error') : t('pwa.up_to_date')}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};
