/**
 * Welcome View — TdyTime v2
 * Full-screen upload page with drag & drop, file input, paste, and history.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { formatSemester } from '@/core/schedule';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, FileText, History, Trash2, ArrowRight, ArrowLeft, Globe, Check, X } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import type { HistoryItem } from '@/core/schedule';
import { APP_VERSION } from '@/core/constants';
import ThemePicker from '@/ui/composites/ThemePicker';
import { changeLanguage } from '@/i18n/config';
import { useExamStore } from '@/core/stores/exam.store';
import { parseExamText } from '@/core/exam/exam.parser';
import { useUIStore } from '@/core/stores/ui.store';

// ============================================
// Sub-components
// ============================================

/** Single history item card */
const HistoryCard = React.memo(({ item, isActive, onLoad, onDelete }: {
    item: HistoryItem;
    isActive: boolean;
    onLoad: (item: HistoryItem) => void;
    onDelete: (id: string) => void;
}) => {
    const { t } = useTranslation();
    const [isConfirming, setIsConfirming] = useState(false);

    const { teacherName, avatarChar, dateLabel } = useMemo(() => {
        const name = item.data.metadata.teacher.trim();
        const names = name.split(' ');
        // Get last name initial (like StatsHeader)
        const avatar = names.pop()?.charAt(0) || '?';

        const d = new Date(item.savedAt);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        // Custom pale date format: # YYYY-MM-DD
        return {
            teacherName: name,
            avatarChar: avatar,
            dateLabel: `# ${year}-${month}-${day}`
        };
    }, [item]);

    // Reset confirmation when selection changes or mouse leaves could be nice
    // but let's keep it simple for now as requested (streamlined).

    return (
        <div
            onClick={() => onLoad(item)}
            className={`group p-4 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer border shadow-sm
                ${isActive
                    ? 'bg-white dark:bg-slate-900 border-accent-500 dark:border-accent-400 shadow-accent-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:shadow-md hover:border-accent-200 dark:hover:border-accent-900'
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-md uppercase transition-all
                    ${isActive ? 'bg-accent-600 text-white shadow-accent-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {avatarChar}
                </div>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate transition-colors ${isActive ? 'text-accent-600 dark:text-accent-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {teacherName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className={`text-[10px] font-bold whitespace-nowrap uppercase tracking-tighter ${isActive ? 'text-accent-500/70 dark:text-accent-400/70' : 'text-slate-400 dark:text-slate-500'}`}>
                            {item.data.metadata.academicYear} • {formatSemester(item.data.metadata.semester)}
                        </p>
                        <span className={`text-[10px] font-num ${isActive ? 'text-accent-300 dark:text-accent-700' : 'text-slate-300 dark:text-slate-600'}`}>
                            {dateLabel}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 min-w-[32px] justify-end">
                {isConfirming ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-3 duration-300">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter mr-1 select-none">
                            {t('common.save') === 'Lưu' ? 'Xóa?' : 'Delete?'}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"
                            aria-label={t('common.cancel')}
                        >
                            <X size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                            className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-90"
                            aria-label={t('settings.dangerZone.confirmButton')}
                        >
                            <Check size={14} strokeWidth={3} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsConfirming(true);
                        }}
                        className={`p-2 rounded-xl transition-all
                            ${isActive
                                ? 'text-accent-300 dark:text-accent-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                        aria-label={t('settings.dangerZone.title')}
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
});

/** Paste/text input area */
const PasteInput = React.memo(({ onCancel, onSubmit, isProcessing }: {
    onCancel: () => void;
    onSubmit: (content: string) => void;
    isProcessing: boolean;
}) => {
    const { t } = useTranslation();
    const [pastedContent, setPastedContent] = useState('');

    return (
        <div className="w-full max-w-lg md:max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <textarea
                autoFocus
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder={t('app.pastePlaceholder')}
                className="w-full h-[35vh] min-h-[180px] max-h-[450px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-300 resize-none focus-visible:ring-2 focus-visible:ring-accent-500 outline-none font-mono shadow-inner custom-scrollbar"
            />
            <div className="flex gap-2 mt-4">
                <button onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    {t('common.cancel')}
                </button>
                <button
                    onClick={() => pastedContent.trim() && onSubmit(pastedContent)}
                    disabled={isProcessing || !pastedContent.trim()}
                    className="flex-1 px-5 py-2.5 bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors transition-transform shadow-lg shadow-accent-500/20 active:scale-[0.98]"
                >
                    {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>{t('common.save')} <ArrowRight size={16} /></>
                    )}
                </button>
            </div>
        </div>
    );
});

// ============================================
// Main Component
// ============================================

const WelcomeView: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const isForceUpload = location.state?.forceUpload === true;

    const data = useScheduleStore((s) => s.data);
    const error = useScheduleStore((s) => s.error);
    const isProcessing = useScheduleStore((s) => s.isProcessing);
    const historyList = useScheduleStore((s) => s.historyList);
    const handleFileUpload = useScheduleStore((s) => s.handleFileUpload);
    const loadHistoryItem = useScheduleStore((s) => s.loadHistoryItem);
    const deleteHistoryItem = useScheduleStore((s) => s.deleteHistoryItem);
    const setExamData = useExamStore((s) => s.setExamData);

    const [isDragging, setIsDragging] = useState(false);
    const [showPaste, setShowPaste] = useState(false);
    const [clicks, setClicks] = useState(0);

    const handleVersionClick = useCallback(() => {
        setClicks(c => c + 1);
        if (clicks + 1 >= 5) {
            localStorage.setItem('devtools_enabled', 'true');
            navigate('/dev');
            setClicks(0);
        }
        setTimeout(() => setClicks(0), 2000);
    }, [clicks, navigate]);

    // Redirect if data exists AND we are not forcing an upload
    React.useEffect(() => {
        if (data && !isForceUpload) navigate('/today', { replace: true });
    }, [data, isForceUpload, navigate]);

    const processContent = useCallback((content: string) => {
        // Try parsing as Exam Schedule first
        try {
            const exams = parseExamText(content);
            if (exams && exams.length > 0) {
                setExamData('', exams);
                useUIStore.getState().setToast(
                    t('exam.toastSuccess', { count: exams.length, defaultValue: `Đã nhận diện ${exams.length} buổi coi thi.` }),
                    'success'
                );
                navigate('/exam', { replace: true });
                return;
            }
        } catch (e) {
            // Ignore error and fallthrough to HTML schedule parse
        }

        handleFileUpload(content, t, i18n.language);
        if (useScheduleStore.getState().data) {
            navigate('/today', { replace: true });
        }
    }, [handleFileUpload, t, i18n.language, navigate, setExamData]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) processContent(content);
        };
        reader.readAsText(file);
    }, [processContent]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) processContent(content);
        };
        reader.readAsText(file);
    }, [processContent]);

    const handleHistoryLoad = useCallback((item: HistoryItem) => {
        loadHistoryItem(item, t);
        navigate('/today', { replace: true });
    }, [loadHistoryItem, t, navigate]);

    const toggleLanguage = useCallback(() => {
        const newLang = i18n.language === 'vi' ? 'en' : 'vi';
        changeLanguage(newLang);
    }, [i18n]);

    // Sort history by saved date descending
    const sortedHistory = useMemo(() =>
        [...historyList].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()),
        [historyList]
    );

    return (
        <main className="min-h-dvh bg-white dark:bg-slate-950 flex transition-colors duration-200">
            {/* Pixel-perfect Header Bar matching AppLayout */}
            <header className="fixed top-0 left-0 right-0 z-40 h-12 md:h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors shadow-sm">
                <div className="flex items-center justify-between h-full px-3 md:px-6">
                    {/* Left: Back button or App Name */}
                    <div className="flex items-center gap-2">
                        {data && isForceUpload ? (
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 px-3 h-8 md:h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm transition-colors cursor-pointer"
                            >
                                <ArrowLeft size={18} /> <span className="hidden sm:inline">{t('common.back')}</span>
                            </button>
                        ) : (
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {t('common.appName', { defaultValue: 'TdyTime' })}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                            aria-label={t('common.switchLanguage')}
                            title={i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}
                        >
                            <Globe size={18} />
                        </button>
                        <ThemePicker />
                    </div>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-start p-3 md:p-8 max-w-xl mx-auto w-full pt-[60px] md:pt-[88px]">
                {/* Title Section - pt-1 to match Settings and other views */}
                <div className="pt-1 pb-4 flex flex-col items-center text-center mb-6">
                    <img src="/favicon.svg" alt="App Logo" className="w-16 h-16 mb-4 drop-shadow-sm" />

                    <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-baseline gap-1.5">
                        TdyTime 
                        <span 
                            onClick={handleVersionClick}
                            className="text-slate-400 font-num text-[10px] font-medium cursor-pointer select-none"
                            title="Tap 5 times for Developer Demo Mode"
                        >
                            v{APP_VERSION}
                        </span>
                    </h1>
                    <p className="text-xs text-accent-600 dark:text-accent-400 mt-0.5 font-medium tracking-wide text-balance">
                        {t('app.tagline')}
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Upload Zone or Paste Input */}
                {showPaste ? (
                    <PasteInput
                        onCancel={() => setShowPaste(false)}
                        onSubmit={processContent}
                        isProcessing={isProcessing}
                    />
                ) : (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`w-full border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${isDragging
                            ? 'border-accent-600 bg-accent-100/50 dark:bg-accent-900/20 shadow-lg shadow-accent-500/10'
                            : 'border-accent-400 dark:border-accent-500/50 bg-accent-50/10 dark:bg-accent-900/5 hover:border-accent-600 dark:hover:border-accent-400 hover:bg-accent-50/30 dark:hover:bg-accent-900/10 hover:shadow-md'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <Upload size={40} className="mx-auto text-accent-600 mb-4 transition-transform group-hover:scale-110" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {t('app.uploadTitle')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {t('app.uploadDesc')}
                        </p>
                        <input
                            id="file-input"
                            type="file"
                            accept=".html,.json"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                )}

                {/* Paste toggle */}
                {!showPaste && (
                    <button
                        onClick={() => setShowPaste(true)}
                        className="mt-3 text-xs text-accent-500 hover:text-accent-600 flex items-center gap-1 font-medium transition-colors"
                    >
                        <FileText size={12} /> {t('app.pasteTitle')}
                    </button>
                )}

                {/* History */}
                {historyList.length > 0 && !showPaste && (
                    <div className="w-full mt-8">
                        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-3 px-1">
                            <History size={14} /> {t('app.recentHistory')}
                        </h2>
                        <div className="space-y-2.5">
                            {sortedHistory.map((item) => {
                                const isActive = data?.metadata?.teacher === item.data.metadata.teacher &&
                                    data?.metadata?.semester === item.data.metadata.semester;
                                return (
                                    <HistoryCard
                                        key={item.id}
                                        item={item}
                                        isActive={isActive}
                                        onLoad={handleHistoryLoad}
                                        onDelete={deleteHistoryItem}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="pt-8 pb-4 text-center text-slate-400 text-[10px]">
                    {t('common.copyright')}
                </div>
            </div>
        </main>
    );
};

export default WelcomeView;
