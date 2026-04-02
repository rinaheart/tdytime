/**
 * ScheduleBuilderForm — DevTools Schedule Builder
 * Interactive form with pattern abstraction, sessions grid override,
 * seed-based reproducibility, and validation.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Eye, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useScheduleStore } from '@/core/stores';
import {
    type ScheduleBuilderConfig,
    type DayKey,
    type ShiftCount,
    type PatternMode,
    type OverlapMode,
    type WeekDistribution,
    type AcademicYear,
    DEFAULT_GRID,
    patternToGrid,
    generateFromBuilder,
} from '@/utils/mockGenerator';

// --- Constants ---

const DAY_LABELS: { key: DayKey; label: string; short: string }[] = [
    { key: 'mon', label: 'Thứ 2', short: 'T2' },
    { key: 'tue', label: 'Thứ 3', short: 'T3' },
    { key: 'wed', label: 'Thứ 4', short: 'T4' },
    { key: 'thu', label: 'Thứ 5', short: 'T5' },
    { key: 'fri', label: 'Thứ 6', short: 'T6' },
    { key: 'sat', label: 'Thứ 7', short: 'T7' },
    { key: 'sun', label: 'CN', short: 'CN' },
];

const SHIFT_LABELS: { key: keyof ShiftCount; label: string; maxSessions: number }[] = [
    { key: 'morning', label: 'Sáng', maxSessions: 2 },
    { key: 'afternoon', label: 'Chiều', maxSessions: 2 },
    { key: 'evening', label: 'Tối', maxSessions: 1 },
];

const PATTERNS: { value: PatternMode; label: string; desc: string }[] = [
    { value: 'balanced', label: 'Balanced', desc: '~2-3 sess/ngày, T7 nhẹ' },
    { value: 'dense', label: 'Dense', desc: '4-5 sess/ngày, full tuần' },
    { value: 'sparse', label: 'Sparse', desc: '0-1 sess/ngày, nhiều trống' },
    { value: 'randomized', label: 'Random', desc: 'Ngẫu nhiên theo seed' },
    { value: 'edge-case', label: 'Edge-case', desc: 'Overlap + gap + biên' },
];

function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// --- Validation ---

interface ValidationResult {
    warnings: string[];
    errors: string[];
}

function validateConfig(grid: Record<DayKey, ShiftCount>, date: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!date || isNaN(Date.parse(date))) {
        errors.push('Ngày mock không hợp lệ.');
    }

    for (const day of DAY_LABELS) {
        const shift = grid[day.key];
        if (!shift) continue;
        if (shift.evening > 1) {
            warnings.push(`${day.short}: Tối chỉ có 3 periods (11-13), tối đa 1 session dài.`);
        }
        if (shift.morning > 2) {
            warnings.push(`${day.short}: Sáng chỉ có 5 periods, tối đa 2 sessions.`);
        }
        if (shift.afternoon > 2) {
            warnings.push(`${day.short}: Chiều chỉ có 4 periods, tối đa 2 sessions.`);
        }
    }

    return { warnings, errors };
}

// --- Component ---

interface ScheduleBuilderFormProps {
    initialConfig?: Partial<ScheduleBuilderConfig>;
    onGenerated?: () => void; // Callback after generate-only
}

const ScheduleBuilderForm: React.FC<ScheduleBuilderFormProps> = ({ initialConfig, onGenerated }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const handleFileUpload = useScheduleStore(s => s.handleFileUpload);
    const setMockState = useScheduleStore(s => s.setMockState);

    // --- Form State ---
    const [mockDate, setMockDate] = useState(initialConfig?.mockDate || todayStr());
    const [mockTime, setMockTime] = useState(initialConfig?.mockTime || '14:00');
    const [weekCount, setWeekCount] = useState<number>(initialConfig?.weekCount || 3);
    const [speed, setSpeed] = useState(initialConfig?.speedMultiplier || 1);
    const [seed, setSeed] = useState(initialConfig?.seed || '');
    const [pattern, setPattern] = useState<PatternMode>(initialConfig?.pattern || 'balanced');
    const [grid, setGrid] = useState<Record<DayKey, ShiftCount>>(
        initialConfig?.sessionsGrid || JSON.parse(JSON.stringify(DEFAULT_GRID))
    );
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [teacherName, setTeacherName] = useState(initialConfig?.teacherName || 'Nguyễn Văn A');
    const [semester, setSemester] = useState(initialConfig?.semester || 'Spring 2026');
    const [academicYear, setAcademicYear] = useState<AcademicYear>(initialConfig?.academicYear || { start: 2025, end: 2026 });
    const [overlapMode, setOverlapMode] = useState<OverlapMode>(initialConfig?.overlapMode || 'none');
    const [weekDist, setWeekDist] = useState<WeekDistribution>(initialConfig?.weekDistribution || 'decay');
    const [pastFactor, setPastFactor] = useState(initialConfig?.pastWeekFactor ?? 0.6);
    const [futureFactor, setFutureFactor] = useState(initialConfig?.futureWeekFactor ?? 0.8);

    // Sync grid when pattern changes
    useEffect(() => {
        const newGrid = patternToGrid(pattern, seed || 'default');
        setGrid(newGrid);
    }, [pattern, seed]);

    // Sync from initialConfig when preset is clicked
    useEffect(() => {
        if (initialConfig) {
            if (initialConfig.mockDate) setMockDate(initialConfig.mockDate);
            if (initialConfig.mockTime) setMockTime(initialConfig.mockTime);
            if (initialConfig.weekCount !== undefined) setWeekCount(initialConfig.weekCount);
            if (initialConfig.speedMultiplier) setSpeed(initialConfig.speedMultiplier);
            if (initialConfig.seed !== undefined) setSeed(initialConfig.seed);
            if (initialConfig.pattern) setPattern(initialConfig.pattern);
            if (initialConfig.sessionsGrid) setGrid(initialConfig.sessionsGrid);
            if (initialConfig.overlapMode) setOverlapMode(initialConfig.overlapMode);
            if (initialConfig.academicYear) setAcademicYear(initialConfig.academicYear);
        }
    }, [initialConfig]);

    const [genFeedback, setGenFeedback] = useState<string | null>(null);

    const handleDateShortcut = (type: 'yesterday' | 'today' | 'tomorrow' | 'next-monday') => {
        const d = new Date();
        if (type === 'yesterday') d.setDate(d.getDate() - 1);
        if (type === 'tomorrow') d.setDate(d.getDate() + 1);
        if (type === 'next-monday') {
            const day = d.getDay();
            const diff = (day === 0 ? 1 : 8 - day);
            d.setDate(d.getDate() + diff);
        }
        const str = d.toISOString().split('T')[0];
        setMockDate(str);
    };

    // --- Validation ---
    const validation = useMemo(() => validateConfig(grid, mockDate), [grid, mockDate]);
    const canGenerate = validation.errors.length === 0;

    // --- Grid Cell Update ---
    const updateCell = useCallback((day: DayKey, shift: keyof ShiftCount, val: number) => {
        setGrid(prev => ({
            ...prev,
            [day]: { ...prev[day], [shift]: Math.max(0, Math.min(3, val)) }
        }));
        setPattern('balanced'); // Auto-reset pattern label to indicate custom override
    }, []);

    // --- Build Config ---
    const buildConfig = useCallback((): ScheduleBuilderConfig => ({
        mockDate,
        mockTime,
        weekCount,
        speedMultiplier: speed,
        seed,
        pattern,
        sessionsGrid: grid,
        teacherName,
        semester,
        academicYear,
        overlapMode,
        weekDistribution: weekDist,
        pastWeekFactor: pastFactor,
        futureWeekFactor: futureFactor,
    }), [mockDate, mockTime, weekCount, speed, seed, pattern, grid, teacherName, semester, academicYear, overlapMode, weekDist, pastFactor, futureFactor]);

    // --- Execute ---
    const doGenerate = useCallback((andPreview: boolean) => {
        const config = buildConfig();
        const { data, mockTime: mt } = generateFromBuilder(config);
        const content = JSON.stringify(data);
        handleFileUpload(content, t, i18n.language);

        setMockState({
            startTimeLocal: Date.now(),
            startTimeMock: mt.getTime(),
            multiplier: config.speedMultiplier,
        });

        if (andPreview) {
            navigate('/today');
        } else {
            const stats = `✓ Đã sinh: ${data.weeks.length} tuần, ${data.weeks.reduce((acc, w) => acc + Object.values(w.days).reduce((dAcc, d) => dAcc + d.morning.length + d.afternoon.length + d.evening.length, 0), 0)} tiết.`;
            setGenFeedback(stats);
            setTimeout(() => setGenFeedback(null), 5000);
            onGenerated?.();
        }
    }, [buildConfig, handleFileUpload, t, i18n.language, setMockState, navigate, onGenerated]);

    // Shared input class
    const inputCls = 'w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none px-2.5 py-1.5 text-sm text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none font-mono';
    const labelCls = 'text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1 flex flex-col';
    const subCls = 'text-[9px] font-normal text-slate-400 normal-case mt-[1px] tracking-normal leading-tight';

    return (
        <div className="space-y-4">
            {/* Section A — Temporal Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                    <label className={labelCls}>Date <span className={subCls}>Ngày mô phỏng</span></label>
                    <input type="date" value={mockDate} onChange={e => setMockDate(e.target.value)} className={inputCls} />
                    <div className="flex flex-wrap gap-1 mt-1.5 font-sans">
                        <button onClick={() => handleDateShortcut('yesterday')} className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700">Hôm qua</button>
                        <button onClick={() => handleDateShortcut('today')} className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700">Hôm nay</button>
                        <button onClick={() => handleDateShortcut('tomorrow')} className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700">Ngày mai</button>
                        <button onClick={() => handleDateShortcut('next-monday')} className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700">T2 tới</button>
                    </div>
                </div>
                <div>
                    <label className={labelCls}>Time <span className={subCls}>Giờ bắt đầu</span></label>
                    <input type="time" value={mockTime} onChange={e => setMockTime(e.target.value)} className={inputCls} />
                </div>
                <div>
                    <label className={labelCls}>Weeks <span className={subCls}>Số tuần sinh</span></label>
                    <select value={weekCount} onChange={e => setWeekCount(+e.target.value as 1 | 3)} className={inputCls}>
                        <option value={1}>1 tuần</option>
                        <option value={3}>3 tuần</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Speed <span className={subCls}>Tốc độ thời gian</span></label>
                    <select value={speed} onChange={e => setSpeed(+e.target.value)} className={inputCls}>
                        <option value={1}>1×</option>
                        <option value={10}>10×</option>
                        <option value={60}>60×</option>
                    </select>
                </div>
                <div>
                    <label className={labelCls}>Seed <span className={subCls}>Hạt giống (chuỗi ký tự)</span></label>
                    <input
                        type="text"
                        value={seed}
                        onChange={e => setSeed(e.target.value)}
                        placeholder="(random)"
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Section B — Pattern Mode */}
            <div>
                <label className={labelCls}>Pattern <span className={subCls}>Mẫu phân bổ lịch</span></label>
                <div className="flex flex-wrap gap-1.5">
                    {PATTERNS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPattern(p.value)}
                            className={`px-3 py-1.5 rounded-none text-xs font-bold transition-none cursor-pointer ${
                                pattern === p.value
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title={p.desc}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Section C — Sessions Grid (override layer) */}
            <div>
                <label className={labelCls}>
                    <span>Sessions Grid <span className="text-slate-600 dark:text-slate-500 normal-case tracking-normal font-normal">(override)</span></span>
                    <span className={subCls}>Lưới phân bổ tùy chỉnh (ghi đè mẫu)</span>
                </label>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left text-slate-600 font-medium p-1.5 w-12"></th>
                                {DAY_LABELS.map(d => (
                                    <th key={d.key} className="text-center text-slate-500 dark:text-slate-400 font-bold p-1.5 w-12">{d.short}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SHIFT_LABELS.map(s => (
                                <tr key={s.key}>
                                    <td className="text-slate-500 font-medium p-1.5 text-right pr-3">{s.label}</td>
                                    {DAY_LABELS.map(d => (
                                        <td key={d.key} className="p-0.5 text-center">
                                            <input
                                                type="number"
                                                min={0}
                                                max={3}
                                                value={grid[d.key]?.[s.key] ?? 0}
                                                onChange={e => updateCell(d.key, s.key, parseInt(e.target.value) || 0)}
                                                className="w-10 h-8 text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none text-sm text-slate-900 dark:text-slate-200 font-mono focus:border-sky-500 focus:outline-none appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Validation Feedback */}
            {(validation.warnings.length > 0 || validation.errors.length > 0) && (
                <div className="space-y-1">
                    {validation.errors.map((e, i) => (
                        <div key={`e-${i}`} className="flex items-center gap-1.5 text-xs text-red-400 bg-red-950/30 px-3 py-1.5 rounded-none">
                            <AlertTriangle size={12} /> {e}
                        </div>
                    ))}
                    {validation.warnings.map((w, i) => (
                        <div key={`w-${i}`} className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/30 px-3 py-1.5 rounded-none">
                            <AlertTriangle size={12} /> {w}
                        </div>
                    ))}
                </div>
            )}

            {genFeedback && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-pulse"></span>
                    {genFeedback}
                </div>
            )}

            {/* Section D — Advanced (collapsed) */}
            <div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-none cursor-pointer font-bold"
                >
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Advanced
                </button>
                {showAdvanced && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                        <div>
                            <label className={labelCls}>Teacher <span className={subCls}>Tên giảng viên</span></label>
                            <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Semester <span className={subCls}>Học kỳ</span></label>
                            <input type="text" value={semester} onChange={e => setSemester(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Academic Year <span className={subCls}>Năm học</span></label>
                            <input 
                                type="text" 
                                value={`${academicYear.start}-${academicYear.end}`} 
                                onChange={e => {
                                    const [s, f] = e.target.value.split('-').map(Number);
                                    if (!isNaN(s) && !isNaN(f)) setAcademicYear({ start: s, end: f });
                                }} 
                                placeholder="2025-2026" 
                                className={inputCls} 
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Overlap <span className={subCls}>Chế độ trùng lịch</span></label>
                            <select value={overlapMode} onChange={e => setOverlapMode(e.target.value as OverlapMode)} className={inputCls}>
                                <option value="none">None</option>
                                <option value="single">Single (1 cặp)</option>
                                <option value="multiple">Multiple (2-3)</option>
                                <option value="chaotic">Chaotic</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Week Distribution <span className={subCls}>Phân bổ theo tuần</span></label>
                            <select value={weekDist} onChange={e => setWeekDist(e.target.value as WeekDistribution)} className={inputCls}>
                                <option value="uniform">Uniform</option>
                                <option value="decay">Decay (factor)</option>
                                <option value="random">Random</option>
                            </select>
                        </div>
                        {weekDist === 'decay' && (
                            <>
                                <div>
                                    <label className={labelCls}>Past Factor <span className={subCls}>Hệ số suy giảm trước</span></label>
                                    <input type="number" step={0.1} min={0} max={1} value={pastFactor} onChange={e => setPastFactor(+e.target.value)} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Future Factor <span className={subCls}>Hệ số suy giảm sau</span></label>
                                    <input type="number" step={0.1} min={0} max={1} value={futureFactor} onChange={e => setFutureFactor(+e.target.value)} className={inputCls} />
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={() => doGenerate(false)}
                    disabled={!canGenerate}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-none text-sm font-bold transition-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Play size={14} /> Generate
                </button>
                <button
                    onClick={() => doGenerate(true)}
                    disabled={!canGenerate}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-none text-sm font-bold transition-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Eye size={14} /> Generate & Preview →
                </button>
            </div>
        </div>
    );
};

export default ScheduleBuilderForm;
