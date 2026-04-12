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

    if (!isVisible && !displayMessage) return null;

    const isError = type === 'error';

    return (
        <div
            className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white shadow-xl border border-slate-700/50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95 pointer-events-none'
                }`}
        >
            <CheckCircle2 size={18} className={isError ? 'text-red-400' : 'text-emerald-400'} />
            <span className="text-sm font-medium">{displayMessage}</span>
            <button
                onClick={() => setIsVisible(false)}
                className="p-1 cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-700 rounded-md transition-colors ml-2"
                aria-label="Close"
            >
                <X size={14} className="text-slate-400" />
            </button>
        </div>
    );
};
