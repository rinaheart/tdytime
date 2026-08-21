/**
 * PWAUpdateHandler — Manages PWA Registration & Notifications
 * Handles "Check for updates" and Install Prompt.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Download, Check, X } from 'lucide-react';

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

    const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
    const timeoutIds = useRef<number[]>([]);

    const addTimeout = (fn: () => void, delay: number) => {
        const id = window.setTimeout(() => {
            fn();
            timeoutIds.current = timeoutIds.current.filter(t => t !== id);
        }, delay);
        timeoutIds.current.push(id);
    };

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

        return () => {
             
            timeoutIds.current.forEach(id => window.clearTimeout(id));
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
        const handleInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    }, []);

    const close = () => {
        if (needUpdate) {
            // Lưu ngày dismiss vào localStorage (YYYY-MM-DD)
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem(PWA_DISMISS_KEY, today);
        }
        setOfflineReady(false);
        setNeedUpdate(false);
        setUpdateBypassed(false);
    };

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    const handleInstall = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        } else {
            handleDismissInstall();
        }
    };

    const handleDismissInstall = () => {
        localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, Date.now().toString());
        setIsDismissed(true);
        setInstallPrompt(null);
    };

    // Expose check function to window for SettingsView to trigger
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
                                setUpdateBypassed(true); // Bypass dismiss logic on manual check
                                setCheckStatus('idle');
                            } else {
                                setCheckStatus('up-to-date');
                                addTimeout(() => setCheckStatus('idle'), 3000);
                            }
                        }, 1500);
                    } else {
                        throw new Error('No registration found');
                    }
                } else {
                    throw new Error('Service Workers not supported');
                }
            } catch {
                setCheckStatus('error');
                addTimeout(() => setCheckStatus('idle'), 3000);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).checkPWAUpdate = checkFn;

        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as any).checkPWAUpdate;
        };
    }, []);

    return (
        <>
            {/* Install Prompt Banner (Bottom Left/Center) */}
            {installPrompt && !isDismissed && !isStandalone && (
                <div className="fixed bottom-24 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-full md:max-w-sm z-[100] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 border-[1.5px] border-accent-500 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 relative mx-auto max-w-[calc(100vw-2rem)] md:max-w-none">
                        <button
                            onClick={handleDismissInstall}
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center"
                            aria-label="Close"
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
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                    {t('pwa.install_desc')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleInstall}
                            className="w-full py-2.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-accent-500/20 flex justify-center items-center gap-2"
                        >
                            <Download size={15} strokeWidth={2.5} />
                            {t('pwa.install_button')}
                        </button>
                    </div>
                </div>
            )}

            {/* Update / Offline Notification (Top Right) */}
            {(offlineReady || (needUpdate && (updateBypassed || localStorage.getItem(PWA_DISMISS_KEY) !== new Date().toISOString().split('T')[0]))) && (
                <div className="fixed top-20 right-4 z-[110] animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl min-w-[280px]">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex justify-center items-center w-full mb-2 relative">
                                <h4 className="text-xs font-bold text-accent-500 dark:text-accent-600">
                                    {needUpdate ? t('pwa.updateReady') : t('pwa.offlineReady')}
                                </h4>
                                <button onClick={close} className="absolute -top-1 -right-1 p-1 hover:bg-white/10 dark:hover:bg-slate-100 rounded-xl" aria-label={t('common.close', 'Đóng')}>
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-xs mb-3 font-medium whitespace-pre-line">
                                {needUpdate ? t('pwa.updateReadyDesc') : t('pwa.offlineReadyDesc')}
                            </p>
                        </div>
                        {needUpdate && (
                            <button
                                onClick={handleUpdate}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-accent-500 text-white rounded-xl text-xs font-bold hover:bg-accent-600 transition-colors shadow-lg shadow-accent-500/20"
                            >
                                <RefreshCw size={14} />
                                {t('pwa.reloadButton')}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Global Check for Update Toast */}
            {checkStatus !== 'idle' && (
                <div className="fixed top-36 right-4 z-[110] animate-in slide-in-from-right-10 fade-in duration-300">
                    <div className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
                        <div className={`${checkStatus === 'checking' ? 'animate-spin' : checkStatus === 'error' ? 'bg-red-500 rounded-full p-0.5 text-white' : 'bg-green-500 rounded-full p-0.5 text-white'}`}>
                            {checkStatus === 'checking' ? <RefreshCw size={14} /> : checkStatus === 'error' ? <X size={12} strokeWidth={4} /> : <Check size={12} strokeWidth={4} />}
                        </div>
                        <span className="text-xs font-bold">
                            {checkStatus === 'checking' ? t('pwa.checking') : checkStatus === 'error' ? t('pwa.check_error', 'Lỗi kiểm tra') : t('pwa.up_to_date')}
                        </span>
                    </div>
                </div>
            )}
        </>
    );
};
