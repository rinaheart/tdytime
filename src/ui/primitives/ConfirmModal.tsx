import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, X } from 'lucide-react';

export interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message?: string;
    description?: string;
    confirmLabel?: string;
    confirmText?: string;
    cancelLabel?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    onClose?: () => void;
    isDanger?: boolean;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    description,
    confirmLabel,
    confirmText,
    cancelLabel,
    cancelText,
    onConfirm,
    onCancel,
    onClose,
    isDanger,
    type,
}) => {
    const { t } = useTranslation();
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelBtnRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const handleCancel = useCallback(() => {
        if (onCancel) onCancel();
        else if (onClose) onClose();
    }, [onCancel, onClose]);
    const resolvedIsDanger = isDanger ?? type === 'danger';

    useEffect(() => {
        if (!isOpen) return;
        previousFocusRef.current = document.activeElement as HTMLElement;
        const timer = setTimeout(() => {
            cancelBtnRef.current?.focus();
        }, 10);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                handleCancel();
                return;
            }
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (
                        document.activeElement === first ||
                        !dialogRef.current.contains(document.activeElement)
                    ) {
                        e.preventDefault();
                        last.focus();
                    }
                } else if (
                    document.activeElement === last ||
                    !dialogRef.current.contains(document.activeElement)
                ) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleKeyDown, true);
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, handleCancel]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                onClick={handleCancel}
            />
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="primitive-confirm-title"
                aria-describedby="primitive-confirm-desc"
                className="relative w-full max-w-[320px] bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 fade-in duration-200"
            >
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                            resolvedIsDanger
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                : 'bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
                        }`}
                    >
                        <AlertCircle size={24} strokeWidth={2.5} />
                    </div>
                    <h2
                        id="primitive-confirm-title"
                        className="text-lg font-bold text-slate-900 dark:text-white mb-2"
                    >
                        {title}
                    </h2>
                    <p
                        id="primitive-confirm-desc"
                        className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed"
                    >
                        {message || description}
                    </p>
                    <div className="flex flex-col w-full gap-2">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`w-full h-11 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ${
                                resolvedIsDanger
                                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                                    : 'bg-accent-600 hover:bg-accent-700 text-white shadow-sm'
                            }`}
                        >
                            {confirmLabel || confirmText || t('common.confirm') || 'Xác nhận'}
                        </button>
                        <button
                            ref={cancelBtnRef}
                            type="button"
                            onClick={handleCancel}
                            className="w-full h-11 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                        >
                            {cancelLabel || cancelText || t('common.cancel') || 'Hủy'}
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleCancel}
                    aria-label={t('common.close', 'Đóng hộp thoại xác nhận')}
                    title={t('common.close', 'Đóng')}
                    className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body,
    );
};

export default ConfirmModal;
