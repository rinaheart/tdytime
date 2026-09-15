/**
 * DangerZoneCard — Settings sub-component
 * Reset app data with 2-step confirmation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw, StickyNote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useScheduleStore, useNotesStore } from '@/core/stores';

const DangerZoneCard: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const resetAll = useScheduleStore((s) => s.resetAll);
    const clearAllNotes = useNotesStore((s) => s.clearAllNotes);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isConfirmingNotes, setIsConfirmingNotes] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { 
        if (timeoutRef.current) clearTimeout(timeoutRef.current); 
        if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
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

    const handleClearNotes = () => {
        if (isConfirmingNotes) {
            clearAllNotes();
            setIsConfirmingNotes(false);
        } else {
            setIsConfirmingNotes(true);
            notesTimeoutRef.current = setTimeout(() => setIsConfirmingNotes(false), 3000);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-red-50 dark:border-red-900/30">
                <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertTriangle size={20} /> {t('settings.dangerZone.title')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{t('settings.dangerZone.description')}</p>
            </div>
            <div className="p-4 md:p-6 flex flex-col gap-3 flex-1 justify-center">
                <button
                    onClick={handleClearNotes}
                    className={`w-full h-12 border rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${isConfirmingNotes
                        ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/30'
                        : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                        }`}
                >
                    {isConfirmingNotes ? (
                        <><AlertTriangle size={18} className="animate-pulse" /> {t('settings.dangerZone.confirmButton')}</>
                    ) : (
                        <><StickyNote size={18} /> {t('notes.clear')}</>
                    )}
                </button>

                <button
                    onClick={handleClick}
                    className={`w-full h-12 border rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${isConfirming
                        ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-lg shadow-red-500/30 scale-105'
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
