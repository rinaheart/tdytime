import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Wrench, Bug, Download, Upload, RotateCcw, LayoutGrid, Zap, Sun, Moon, Clock } from 'lucide-react';
import { APP_VERSION } from '@/core/constants';
import { useScheduleStore, useUIStore } from '@/core/stores';
import ScheduleBuilderForm from './sections/ScheduleBuilderForm';
import StateInspector from './sections/StateInspector';
import { 
    type ScheduleBuilderConfig, 
    type DayKey,
    type ShiftCount,
    DEFAULT_GRID, 
    patternToGrid,
    generateFromBuilder 
} from '@/utils/mockGenerator';
import { generateDebugSnapshot, downloadSnapshot } from './utils/snapshotGenerator';

// --- Helper: Base64 Serialization for URL ---
function encodeConfig(config: ScheduleBuilderConfig): string {
    return btoa(JSON.stringify(config));
}

function decodeConfig(cfgStr: string): ScheduleBuilderConfig | null {
    try {
        return JSON.parse(atob(cfgStr));
    } catch (e) {
        return null;
    }
}

const DevToolsView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [customConfig, setCustomConfig] = useState<Partial<ScheduleBuilderConfig> | undefined>(undefined);

    const handleFileUpload = useScheduleStore(s => s.handleFileUpload);
    const setMockState = useScheduleStore(s => s.setMockState);
    const mockState = useScheduleStore(s => s.mockState);
    const isMockEnabled = useScheduleStore(s => s.isMockEnabled);
    const toggleMockEnabled = useScheduleStore(s => s.toggleMockEnabled);
    const resetAll = useScheduleStore(s => s.resetAll);
    
    const darkMode = useUIStore(s => s.darkMode);
    const toggleDarkMode = useUIStore(s => s.toggleDarkMode);

    // --- URL State Handling ---
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const cfgParam = params.get('cfg');
        if (cfgParam) {
            const decoded = decodeConfig(cfgParam);
            if (decoded) {
                setCustomConfig(decoded);
                setShowForm(true);
                // Optionally auto-generate if coming from a shared link
            }
        }
    }, [location.search]);

    // --- Tab Scroll ---
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // --- Keybinding: Ctrl+Shift+I for Debug ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                setShowDebug(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- Action: Run Preset ---
    const runPreset = useCallback((presetName: string, configUpdates: Partial<ScheduleBuilderConfig>) => {
        const base: ScheduleBuilderConfig = {
            mockDate: new Date().toISOString().split('T')[0],
            mockTime: '14:00',
            weekCount: 3,
            speedMultiplier: 1,
            seed: `seed-${presetName}-${Date.now()}`,
            pattern: 'balanced',
            sessionsGrid: JSON.parse(JSON.stringify(DEFAULT_GRID)),
            teacherName: 'Nguyễn Văn A',
            semester: 'Spring 2026',
            academicYear: { start: 2025, end: 2026 },
            overlapMode: 'none',
            weekDistribution: 'decay',
            pastWeekFactor: 0.6,
            futureWeekFactor: 0.8,
            ...configUpdates
        };

        // Only auto-generate grid from pattern if sessionsGrid wasn't explicitly provided
        if (configUpdates.pattern && !configUpdates.sessionsGrid) {
            base.sessionsGrid = patternToGrid(configUpdates.pattern, base.seed);
        }

        const { data, mockTime: mt } = generateFromBuilder(base);
        handleFileUpload(JSON.stringify(data), t, i18n.language); 

        setMockState({
            startTimeLocal: Date.now(),
            startTimeMock: mt.getTime(),
            multiplier: base.speedMultiplier,
        });

        // Set form state so user can fine-tune
        setCustomConfig(base);
        setShowForm(true);

        navigate('/today');
    }, [handleFileUpload, navigate, setMockState, t, i18n.language]);

    // --- Action: Export/Import ---
    const handleExport = () => {
        // Find a way to get the current form state or just export a default
        const blob = new Blob([JSON.stringify(customConfig || {}, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tdytime-config-${Date.now()}.json`;
        a.click();
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (re: ProgressEvent<FileReader>) => {
                try {
                    const result = re.target?.result;
                    if (typeof result !== 'string') return;
                    const parsed = JSON.parse(result) as Partial<ScheduleBuilderConfig>;
                    
                    // Basic validation
                    if (parsed && typeof parsed === 'object') {
                        setCustomConfig(parsed);
                        setShowForm(true);
                    } else {
                        throw new Error('Invalid config format');
                    }
                } catch (err) {
                    alert('Lỗi import config: File không đúng định dạng!');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleSnapshot = () => {
        const scheduleState = useScheduleStore.getState();
        const uiState = useUIStore.getState();
        const snapshot = generateDebugSnapshot(scheduleState, uiState);
        downloadSnapshot(snapshot);
    };

    const handleReset = () => {
        if (window.confirm('Cảnh báo: Hành động này sẽ xóa sạch dữ liệu. Tiếp tục?')) {
            resetAll();
            localStorage.clear();
            window.location.href = '/';
        }
    };

    return (
        <main className="min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-none">
            {/* Header: Minimal Slate-900 */}
            <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-none py-2 px-3 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Quay lại</span>
                </button>
                <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <Wrench size={16} className="text-sky-500" />
                    <span className="font-bold text-sm">Schedule Builder</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">v{APP_VERSION}</span>
                </div>
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center justify-center p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-none"
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </header>

            <div className="pt-20 pb-10 px-4 max-w-2xl mx-auto space-y-8">
                {/* 🎯 Preset Bar — PRIMARY entry */}
                <section>
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                        <Zap size={12} /> Nạp kịch bản (Presets)
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <PresetButton 
                            label="Full Demo (3w)" 
                            desc="3 tuần, cân bằng" 
                            onClick={() => runPreset('full', { weekCount: 3, pattern: 'balanced' })} 
                        />
                        <PresetButton 
                            label="Dense Week" 
                            desc="Mật độ cao, full tuần" 
                            onClick={() => runPreset('dense', { pattern: 'dense' })} 
                        />
                        <PresetButton 
                            label="Sparse Week" 
                            desc="Lịch lác đác" 
                            onClick={() => runPreset('sparse', { pattern: 'sparse' })} 
                        />
                        <PresetButton 
                            label="Conflict Test" 
                            desc="Test chồng lịch" 
                            onClick={() => runPreset('conflict', { overlapMode: 'single', pattern: 'edge-case' })} 
                        />
                        <PresetButton 
                            label="Empty State" 
                            desc="Trống không hoàn toàn" 
                            onClick={() => runPreset('empty', { sessionsGrid: emptyGrid() })} 
                        />
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`flex flex-col items-center justify-center p-3 rounded-none border transition-none ${
                                showForm 
                                ? 'bg-sky-600/20 border-sky-600 text-sky-600 dark:text-sky-400' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        >
                            <LayoutGrid size={20} className="mb-1" />
                            <span className="text-xs font-bold whitespace-nowrap">Tùy biến →</span>
                        </button>
                    </div>
                </section>

                {/* ScheduleBuilderForm — CUSTOM path */}
                {showForm && (
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-6 shadow-none">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <LayoutGrid size={18} className="text-sky-500" />
                                Cấu hình chi tiết
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-xs font-bold underline cursor-pointer">
                                Thu gọn
                            </button>
                        </div>
                        <ScheduleBuilderForm 
                            initialConfig={customConfig} 
                            onGenerated={() => {
                                // Update URL with config for sharing
                                if (customConfig) {
                                    const cfg = encodeConfig(customConfig as ScheduleBuilderConfig);
                                    window.history.replaceState(null, '', `/#/dev?cfg=${cfg}`);
                                }
                            }}
                        />
                    </section>
                )}

                {/* 🐞 Debug Panel on-demand */}
                {showDebug && (
                    <section className="border-t border-slate-200 dark:border-slate-800 pt-6">
                        <StateInspector />
                    </section>
                )}

                {/* Tool Footer */}
                <footer className="pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-wrap items-center justify-center gap-6">
                    <button onClick={() => setShowDebug(!showDebug)} className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-none transition-none ${showDebug ? 'bg-amber-600/20 text-amber-600 dark:text-amber-500' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}>
                        <Bug size={12} /> Debug {showDebug ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-sky-500 transition-colors py-1.5">
                        <Download size={12} /> Export Config
                    </button>
                    <button onClick={handleSnapshot} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 hover:text-amber-400 py-1.5 border border-amber-600/20 px-2 bg-amber-600/5">
                        <Bug size={12} /> Export Debug Snapshot
                    </button>
                    <button onClick={handleImport} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-sky-500 transition-colors py-1.5">
                        <Upload size={12} /> Import Config
                    </button>
                    <button onClick={handleReset} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-500 hover:text-red-400 py-1.5">
                        <RotateCcw size={12} /> Reset Data
                    </button>
                    <button 
                        onClick={toggleMockEnabled}
                        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-none border transition-all ${
                            isMockEnabled 
                            ? 'bg-amber-600 border-amber-600 text-white' 
                            : 'text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 hover:border-amber-600/50 hover:text-amber-600'
                        }`}
                    >
                        <Clock size={12} />
                        Mock Time: {isMockEnabled ? `ON (${formatSpeed(mockState?.multiplier)})` : 'OFF'}
                    </button>
                </footer>
                <div className="text-center pb-6">
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono tracking-tight">
                        Shortcut: <kbd className="bg-slate-100 dark:bg-slate-800 px-1 border border-slate-200 dark:border-slate-700">Ctrl+Shift+I</kbd> to toggle Debug Panel | <kbd className="bg-slate-100 dark:bg-slate-800 px-1 border border-slate-200 dark:border-slate-700">Ctrl+Shift+M</kbd> to toggle Mock Time
                    </p>
                </div>
            </div>
        </main>
    );
};

const formatSpeed = (m?: number) => {
    if (!m) return '1s';
    if (m === 1) return '1s';
    if (m === 60) return '1m';
    if (m === 300) return '5m';
    if (m === 600) return '10m';
    if (m === 1800) return '30m';
    return `${m}x`;
};

interface PresetButtonProps {
    label: string;
    desc: string;
    onClick: () => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ label, desc, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-start p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none hover:border-sky-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-none group text-left"
    >
        <span className="text-xs font-bold text-slate-900 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400">{label}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{desc}</span>
    </button>
);

function emptyGrid(): Record<DayKey, ShiftCount> {
    const g: Record<DayKey, ShiftCount> = {} as Record<DayKey, ShiftCount>;
    (['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as DayKey[]).forEach(d => {
        g[d] = { morning: 0, afternoon: 0, evening: 0 };
    });
    return g;
}

export default DevToolsView;
