/**
 * BackupRestoreCard — Settings sub-component
 * Full User Data Backup Export & Atomic Restore UI.
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, ShieldCheck, AlertTriangle, FileJson, Check, X, Loader2, Calendar, FileText, Bookmark } from 'lucide-react';
import { backupService, type BackupFile, type BackupSummary } from '@/core/backup/backup.service';

interface BackupRestoreCardProps {
    onSuccess: (message: string) => void;
    onError?: (message: string) => void;
}

const BackupRestoreCard: React.FC<BackupRestoreCardProps> = ({ onSuccess, onError }) => {
    const { t, i18n } = useTranslation();
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => backupService.getLastBackupDate());
    const [isExporting, setIsExporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // Modal state for restore confirmation
    const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null);
    const [pendingSummary, setPendingSummary] = useState<BackupSummary | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatTimestamp = (isoString?: string) => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
            return d.toLocaleString(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await backupService.exportFullBackup();
            setLastBackupDate(result.summary.exportedAt);
            onSuccess(t('settings.backup.exportSuccess'));
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Export failed';
            onError?.(msg);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input value so same file can be selected again
        e.target.value = '';

        if (file.size > 10 * 1024 * 1024) {
            onError?.('File sao lưu quá lớn (>10MB).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (!content) return;

            const validation = backupService.validateBackupContent(content);
            if (!validation.isValid || !validation.backup || !validation.summary) {
                onError?.(validation.errorMessage || t('settings.backup.invalidFile'));
                return;
            }

            setPendingBackup(validation.backup);
            setPendingSummary(validation.summary);
            setIsConfirmModalOpen(true);
        };
        reader.readAsText(file);
    };

    const handleConfirmRestore = async () => {
        if (!pendingBackup) return;
        setIsRestoring(true);

        try {
            const result = await backupService.restoreFromBackup(pendingBackup);
            if (result.success) {
                setIsConfirmModalOpen(false);
                setPendingBackup(null);
                setPendingSummary(null);
                onSuccess(t('settings.backup.restoreSuccess'));
            } else {
                onError?.(t('settings.backup.restoreError', { error: result.error || 'Unknown' }));
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Restore error';
            onError?.(t('settings.backup.restoreError', { error: msg }));
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 rounded-xl shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm md:text-base">
                                {t('settings.backup.title')}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {t('settings.backup.description')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status indicator */}
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className={`w-2 h-2 rounded-full ${lastBackupDate ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span>
                        {lastBackupDate
                            ? t('settings.backup.lastBackup', { date: formatTimestamp(lastBackupDate) })
                            : t('settings.backup.noBackupYet')}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="w-full h-11 px-4 bg-accent-600 hover:bg-accent-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:opacity-50"
                    >
                        {isExporting ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        <span>{t('settings.backup.exportBtn')}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 active:scale-[0.98] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                        <Upload size={16} />
                        <span>{t('settings.backup.restoreBtn')}</span>
                    </button>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleFileInputChange}
                    />
                </div>

                {/* Guidance note */}
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-2">
                    <span className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">💡</span>
                    <span>{t('settings.backup.guidance')}</span>
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            {isConfirmModalOpen && pendingSummary && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="restore-modal-title"
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
                                <AlertTriangle size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 id="restore-modal-title" className="font-bold text-slate-900 dark:text-white text-base">
                                    {t('settings.backup.confirmRestoreTitle')}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {t('settings.backup.confirmRestoreDesc')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                                aria-label={t('common.close', 'Đóng')}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content: Summary */}
                        <div className="p-5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                {t('settings.backup.summaryTitle')}
                            </h4>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                    <Calendar size={15} className="text-accent-500 shrink-0" />
                                    <span className="font-medium truncate">
                                        {pendingSummary.hasActiveSchedule && pendingSummary.scheduleTeacher
                                            ? t('settings.backup.activeSchedule', {
                                                teacher: pendingSummary.scheduleTeacher,
                                                semester: pendingSummary.scheduleSemester,
                                                year: pendingSummary.scheduleYear,
                                            })
                                            : t('settings.backup.noActiveSchedule')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                        <FileJson size={15} className="text-sky-500 shrink-0" />
                                        <span>{t('settings.backup.historyCount', { count: pendingSummary.historyCount })}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                        <FileText size={15} className="text-emerald-500 shrink-0" />
                                        <span>{t('settings.backup.notesCount', { count: pendingSummary.notesCount })}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                                    <Bookmark size={15} className="text-amber-500 shrink-0" />
                                    <span>{t('settings.backup.abbreviationsCount', { count: pendingSummary.abbreviationsCount })}</span>
                                </div>

                                <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 text-right">
                                    {t('settings.backup.exportedAt', { date: formatTimestamp(pendingSummary.exportedAt) })}
                                </div>
                            </div>
                        </div>

                        {/* Footer: Confirmation actions */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isRestoring}
                                className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                {t('settings.backup.cancelBtn')}
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmRestore}
                                disabled={isRestoring}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50"
                            >
                                {isRestoring ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>{t('common.loading')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} strokeWidth={2.5} />
                                        <span>{t('settings.backup.confirmBtn')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BackupRestoreCard;
