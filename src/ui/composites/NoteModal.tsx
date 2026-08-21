import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Save, StickyNote, Trash2, Clock, MapPin, Calendar, Users } from 'lucide-react';
import { useNotesStore } from '../../core/stores/notes.store';
import { useUIStore } from '../../core/stores/ui.store';
import ConfirmModal from '../primitives/ConfirmModal';

interface NoteModalProps {
    isOpen: boolean;
    sessionId: string;
    sessionTitle: string;
    onClose: () => void;
    // Optional context for the redesign
    date?: string;
    room?: string;
    className?: string;
    time?: string;
}

const NoteModal: React.FC<NoteModalProps> = ({
    isOpen,
    sessionId,
    sessionTitle,
    onClose,
    date,
    room,
    className: sessionClassName,
    time
}) => {
    const { t } = useTranslation();
    const getNote = useNotesStore(s => s.getNote);
    const setNote = useNotesStore(s => s.setNote);
    const deleteNote = useNotesStore(s => s.deleteNote);
    const setToast = useUIStore(s => s.setToast);
    
    const initialContent = useMemo(() => isOpen ? getNote(sessionId) : '', [isOpen, sessionId, getNote]);
    const [content, setContent] = useState('');

    // Sync content when modal opens or initialContent changes
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setContent(initialContent);
        }
    }, [isOpen, initialContent]);

    const [deleteState, setDeleteState] = useState<'idle' | 'confirming'>('idle');
    const isDirty = content !== initialContent;
    const hasNote = initialContent.length > 0;
    const charCount = content.length;

    // Reset delete confirmation after 3s
    useEffect(() => {
        if (deleteState === 'confirming') {
            const timer = setTimeout(() => setDeleteState('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [deleteState]);

    const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

    const handleDismiss = useCallback(() => {
        if (isDirty) {
            setIsDiscardConfirmOpen(true);
        } else {
            onClose();
        }
    }, [isDirty, onClose]);

    // Handle Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) handleDismiss();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, handleDismiss]);

    const handleSave = useCallback(() => {
        setNote(sessionId, content);
        setToast(t('notes.saved') || 'Đã lưu ghi chú!');
        onClose();
    }, [sessionId, content, setNote, setToast, t, onClose]);

    const handleDelete = useCallback(() => {
        if (deleteState === 'idle') {
            setDeleteState('confirming');
            return;
        }
        deleteNote(sessionId);
        setToast(t('notes.deleted') || 'Đã xóa ghi chú');
        setDeleteState('idle');
        onClose();
    }, [deleteState, sessionId, deleteNote, setToast, t, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={handleDismiss}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl shadow-black/20 overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-300 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                
                {/* Header: Compact */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="text-accent-600 dark:text-accent-400">
                            <StickyNote size={18} strokeWidth={2.5} />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                            {t('notes.title') || 'Ghi chú'}
                        </h3>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="w-11 h-11 -mr-2 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Session Context Block */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                    {/* Mobile: Compact 1-line summary */}
                    <div className="sm:hidden flex items-center justify-between gap-2">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate flex-1">
                            {sessionTitle}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
                            <MapPin size={8} />
                            <span>{room || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Desktop: Full context */}
                    <h4 className="hidden sm:block font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 line-clamp-2">
                        {sessionTitle}
                    </h4>
                    
                    <div className="hidden sm:flex flex-wrap gap-2">
                        {date && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <Calendar size={10} />
                                <span>{date}</span>
                            </div>
                        )}
                        {time && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <Clock size={10} />
                                <span>{time}</span>
                            </div>
                        )}
                        {room && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <MapPin size={10} />
                                <span>{room}</span>
                            </div>
                        )}
                        {sessionClassName && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <Users size={10} />
                                <span className="max-w-[80px] truncate">{sessionClassName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Body: Textarea */}
                <div className="px-6 py-4 flex-1">
                    <div className="relative h-full flex flex-col">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t('notes.placeholder') || 'Nhập ghi chú tại đây...'}
                            className="w-full min-h-[200px] bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500/30 outline-none resize-none text-base leading-relaxed transition-all"
                            autoFocus
                        />
                        <div className="mt-1 text-right">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {t('notes.charCount', { count: charCount }) || `${charCount} ký tự`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer: Redesigned Actions */}
                <div className="px-6 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:pb-6 flex items-center gap-3">
                    {hasNote && (
                        <button
                            onClick={handleDelete}
                            className={`h-12 shrink-0 rounded-2xl transition-all flex items-center justify-center border ${
                                deleteState === 'confirming' 
                                ? 'bg-red-500 border-red-500 text-white px-4 gap-2 animate-in zoom-in-95 duration-200' 
                                : 'w-12 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-slate-100 dark:border-slate-800'
                            }`}
                            title={t('notes.clear') || 'Xóa ghi chú'}
                        >
                            <Trash2 size={20} strokeWidth={2.5} />
                            {deleteState === 'confirming' && (
                                <span className="text-xs font-bold whitespace-nowrap">
                                    {t('common.confirm') || 'Xóa?'}
                                </span>
                            )}
                        </button>
                    )}
                    
                    <button
                        onClick={handleDismiss}
                        className="flex-1 h-12 rounded-2xl font-bold text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    
                    <button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={`flex-[1.5] h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                            isDirty 
                            ? 'bg-accent-600 hover:bg-accent-700 text-white shadow-lg shadow-accent-500/25' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} strokeWidth={2.5} />
                        {t('notes.save')}
                    </button>
                </div>
            </div>

            {/* Nested Confirmation */}
            <ConfirmModal
                isOpen={isDiscardConfirmOpen}
                title={t('common.confirmDiscardTitle') || t('common.confirm') || 'Xác nhận'}
                message={t('common.confirmDiscard') || 'Bỏ thay đổi?'}
                onConfirm={() => {
                    setIsDiscardConfirmOpen(false);
                    onClose();
                }}
                onCancel={() => setIsDiscardConfirmOpen(false)}
                confirmLabel={t('common.discard') || 'Bỏ qua'}
                isDanger
            />
        </div>,
        document.body
    );
};

export default React.memo(NoteModal);
