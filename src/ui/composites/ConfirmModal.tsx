/**
 * ConfirmModal — Composite component for critical confirmations.
 * Uses backdrop-blur and scale-in animation for premium feel.
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    type = 'danger'
}) => {
    const { t } = useTranslation();

    // Handle Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onCancel();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 fade-in duration-300">
                {/* Header with Icon */}
                <div className="p-6 pb-0 flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                        type === 'danger' 
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                        : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                    }`}>
                        <AlertTriangle size={28} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                        {description}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-8 flex flex-col gap-2">
                    <button
                        onClick={onConfirm}
                        className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 ${
                            type === 'danger'
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
                            : 'bg-accent-600 hover:bg-accent-700 text-white shadow-accent-500/20'
                        }`}
                    >
                        {confirmText || t('common.confirm')}
                    </button>
                    
                    <button
                        onClick={onCancel}
                        className="w-full py-3 rounded-2xl font-semibold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        {cancelText || t('common.cancel')}
                    </button>
                </div>

                {/* Close Button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmModal;
