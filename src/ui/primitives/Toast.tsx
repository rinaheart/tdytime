import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { useUIStore } from '@/core/stores';

export const Toast: React.FC = () => {
    const message = useUIStore(s => s.toast.message);
    const type = useUIStore(s => s.toast.type);
    const clearToast = useUIStore(s => s.clearToast);
    const [isVisible, setIsVisible] = useState(false);
    const [displayMessage, setDisplayMessage] = useState('');

    useEffect(() => {
        if (message) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayMessage(message);
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                // Clear state in store after animation
                setTimeout(clearToast, 300);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, clearToast]);

    if (!isVisible) return null;

    const isError = type === 'error';

    return (
        <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-lg border border-slate-700/50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
                }`}
        >
            <CheckCircle2 size={18} className={isError ? 'text-red-400' : 'text-emerald-400'} />
            <span className="text-sm font-medium">{displayMessage}</span>
            <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="min-w-[28px] min-h-[28px] p-1.5 flex items-center justify-center cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                aria-label="Đóng thông báo"
            >
                <X size={14} className="text-slate-300" />
            </button>
        </div>
    );
};
