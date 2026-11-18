import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, Save, StickyNote, Trash2, Clock, MapPin, Calendar, Users } from 'lucide-react';
import { useNotesStore } from '../../core/stores/notes.store';
import { useUIStore } from '../../core/stores/ui.store';
import ConfirmModal from '../primitives/ConfirmModal';

import { draftService } from '../../core/notes/draft.service';

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

    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const initialContent = useMemo(() => isOpen ? getNote(sessionId) : '', [isOpen, sessionId, getNote]);
    const [content, setContent] = useState('');
    const [isDraftRestored, setIsDraftRestored] = useState(false);

    // Sync content when modal opens or initialContent changes, checking for session drafts
    useEffect(() => {
        if (isOpen) {
            const draft = draftService.getDraft(sessionId, initialContent);
            if (draft !== null && draft !== initialContent) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setContent(draft);
                setIsDraftRestored(true);
            } else {
                setContent(initialContent);
                setIsDraftRestored(false);
            }
        }
    }, [isOpen, sessionId, initialContent]);

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
            draftService.clearDraft(sessionId);
            onClose();
        }
    }, [isDirty, sessionId, onClose]);

    const handleSave = useCallback(() => {
        draftService.clearDraft(sessionId);
        setNote(sessionId, content);
        setToast(t('notes.saved') || 'Đã lưu ghi chú!');
        onClose();
    }, [sessionId, content, setNote, setToast, t, onClose]);

    const handleDelete = useCallback(() => {
        if (deleteState === 'idle') {
            setDeleteState('confirming');
            return;
        }
        draftService.clearDraft(sessionId);
        deleteNote(sessionId);
        setToast(t('notes.deleted') || 'Đã xóa ghi chú');
        setDeleteState('idle');
        onClose();
    }, [deleteState, sessionId, deleteNote, setToast, t, onClose]);

    // Handle Esc key, Ctrl+Enter to save, Focus Trap (Tab / Shift+Tab) & Focus Restoration
    useEffect(() => {
        if (!isOpen) return;

        previousFocusRef.current = document.activeElement as HTMLElement | null;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isDiscardConfirmOpen) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isDirty) {
                e.preventDefault();
                handleSave();
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                handleDismiss();
                return;
            }
            if (e.key === 'Tab' && modalRef.current) {
                const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === first || !modalRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last || !modalRef.current.contains(document.activeElement)) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [isOpen, isDiscardConfirmOpen, isDirty, handleDismiss, handleSave]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleDismiss}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`note-modal-title-${sessionId}`}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-4 sm:zoom-in-95 fade-in duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            >
                {/* Header: Compact */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="text-accent-600 dark:text-accent-400">
                            <StickyNote size={18} strokeWidth={2.5} />
                        </div>
                        <h2 id={`note-modal-title-${sessionId}`} className="font-bold text-slate-900 dark:text-white leading-tight text-base">
                            {t('notes.title') || 'Ghi chú'}
                        </h2>
                        {isDraftRestored && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 animate-in fade-in">
                                {t('notes.draftRestored', 'Đã khôi phục bản nháp')}
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        aria-label={t('common.close', 'Đóng cửa sổ ghi chú')}
                        title={t('common.close', 'Đóng')}
                        className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Session Context Block */}
                <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-2 line-clamp-2">
                        {sessionTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {date && (
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar size={12} className="text-slate-400" />
                                <span>{date}</span>
                            </span>
                        )}
                        {time && (
                            <span className="inline-flex items-center gap-1.5 font-num text-accent-700 dark:text-accent-300">
                                <Clock size={12} className="text-accent-500" />
                                <span>{time}</span>
                            </span>
                        )}
                        {room && (
                            <span className="inline-flex items-center gap-1.5">
                                <MapPin size={12} className="text-slate-400" />
                                <span>{room}</span>
                            </span>
                        )}
                        {sessionClassName && (
                            <span className="inline-flex items-center gap-1.5">
                                <Users size={12} className="text-slate-400" />
                                <span className="max-w-[140px] truncate">{sessionClassName}</span>
                            </span>
                        )}
                    </div>
                </div>

                {/* Body: Textarea */}
                <div className="px-6 py-4 flex-1">
                    <div className="relative h-full flex flex-col">
                        <label htmlFor={`note-textarea-${sessionId}`} className="sr-only">
                            {t('notes.title') || 'Ghi chú'} - {sessionTitle}
                        </label>
                        <textarea
                            id={`note-textarea-${sessionId}`}
                            value={content}
                            onChange={(e) => {
                                const val = e.target.value;
                                setContent(val);
                                draftService.saveDraftDebounced(sessionId, val, initialContent, 300);
                            }}
                            aria-label={`${t('notes.title') || 'Ghi chú'}: ${sessionTitle}`}
                            placeholder={t('notes.placeholder') || 'Nhập ghi chú tại đây...'}
                            className="w-full min-h-[180px] bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none resize-none text-sm leading-relaxed transition-all"
                            autoFocus
                        />
                        <div className="mt-1.5 text-right">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {t('notes.charCount', { count: charCount }) || `${charCount} ký tự`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer: Actions */}
                <div className="px-6 py-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] sm:pb-5 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800">
                    {hasNote && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            aria-label={deleteState === 'confirming' ? (t('common.confirm') || 'Xác nhận xóa ghi chú') : (t('notes.clear') || 'Xóa ghi chú')}
                            className={`h-11 shrink-0 rounded-2xl transition-all flex items-center justify-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                                deleteState === 'confirming'
                                    ? 'bg-red-600 border-red-600 text-white px-4 gap-2 animate-in zoom-in-95 duration-200'
                                    : 'w-11 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-slate-200 dark:border-slate-800'
                            }`}
                            title={t('notes.clear') || 'Xóa ghi chú'}
                        >
                            <Trash2 size={18} strokeWidth={2.2} />
                            {deleteState === 'confirming' && (
                                <span className="text-xs font-bold whitespace-nowrap">
                                    {t('common.confirm') || 'Xóa?'}
                                </span>
                            )}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="flex-1 h-11 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                        {t('common.cancel')}
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={`flex-[1.5] h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
                            isDirty
                                ? 'bg-accent-600 hover:bg-accent-700 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} strokeWidth={2.2} />
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
                    draftService.clearDraft(sessionId);
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
