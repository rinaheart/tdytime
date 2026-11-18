/**
 * DangerZoneCard — Settings sub-component
 * Reset app data with 2-step confirmation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScheduleStore } from '@/core/stores';

const DangerZoneCard: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const resetAll = useScheduleStore((s) => s.resetAll);
    const [isConfirming, setIsConfirming] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const handleClick = async () => {
        if (isConfirming) {
            await resetAll();
            setIsConfirming(false);
            navigate('/', { replace: true });
        } else {
            setIsConfirming(true);
            timeoutRef.current = setTimeout(() => setIsConfirming(false), 3000);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-red-50 dark:border-red-900/30">
                <h2 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={20} /> {t('settings.dangerZone.title')}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t('settings.dangerZone.description')}</p>
            </div>
            <div className="p-4 md:p-6 flex flex-col gap-3 flex-1 justify-center">
                <button
                    type="button"
                    onClick={handleClick}
                    className={`w-full h-12 border rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${isConfirming
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-sm'
                        : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/20'
                        }`}
                >
                    {isConfirming ? (
                        <><AlertTriangle size={18} className="animate-pulse" /> {t('settings.dangerZone.confirmButton')}</>
                    ) : (
                        <><RotateCcw size={18} /> {t('settings.dangerZone.resetButton')}</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DangerZoneCard;
