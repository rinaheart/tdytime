/**
 * ConfirmModal — Composite component for critical confirmations.
 * Uses backdrop-blur, WAI-ARIA alertdialog semantics, and focus containment.
 */

import React, { useEffect, useRef } from 'react';
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
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelBtnRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Handle Esc key, focus containment (Tab / Shift+Tab), and focus restoration
    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current = document.activeElement as HTMLElement | null;
        const timer = setTimeout(() => {
            cancelBtnRef.current?.focus();
        }, 10);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onCancel();
                return;
            }
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleKeyDown);
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal Content */}
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="composite-confirm-title"
                aria-describedby="composite-confirm-desc"
                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 fade-in duration-200"
            >
                {/* Header with Icon */}
                <div className="p-6 pb-0 flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                        type === 'danger'
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                    }`}>
                        <AlertTriangle size={28} />
                    </div>

                    <h2 id="composite-confirm-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {title}
                    </h2>
                    <p id="composite-confirm-desc" className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-2">
                        {description}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-8 flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`w-full h-11 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
                            type === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-accent-600 hover:bg-accent-700 text-white'
                        }`}
                    >
                        {confirmText || t('common.confirm')}
                    </button>

                    <button
                        ref={cancelBtnRef}
                        type="button"
                        onClick={onCancel}
                        className="w-full h-11 rounded-2xl font-semibold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                        {cancelText || t('common.cancel')}
                    </button>
                </div>

                {/* Close Button */}
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label={t('common.close', 'Đóng hộp thoại xác nhận')}
                    title={t('common.close', 'Đóng')}
                    className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default ConfirmModal;
