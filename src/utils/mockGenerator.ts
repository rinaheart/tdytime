import { ScheduleData, CourseType, CourseSession, WeekSchedule, Metadata } from '../core/schedule/schedule.types';

// --- Types & Constants & Enums ---

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ShiftCount {
    morning: number;
    afternoon: number;
    evening: number;
}

export type PatternMode = 'balanced' | 'dense' | 'sparse' | 'randomized' | 'edge-case';
export type OverlapMode = 'none' | 'single' | 'multiple' | 'chaotic';
export type WeekDistribution = 'uniform' | 'decay' | 'random';

export interface AcademicYear {
    start: number;
    end: number;
}

export interface ScheduleBuilderConfig {
    mockDate: string;            // e.g. "2026-04-02"
    mockTime: string;            // e.g. "14:00"
    weekCount: number;
    speedMultiplier: number;     // 1, 10, 60
    seed: string;                // "" = random seed generated at runtime
    pattern: PatternMode;
    sessionsGrid: Record<DayKey, ShiftCount>;
    
    // Advanced
    teacherName: string;
    semester: string;
    academicYear: AcademicYear;
    overlapMode: OverlapMode;
    weekDistribution: WeekDistribution;
    pastWeekFactor: number;
    futureWeekFactor: number;
}

const PERIOD_BLOCKS = {
    morning:   [1, 2, 3, 4, 5],
    afternoon: [6, 7, 8, 9],
    evening:   [11, 12, 13],
} as const;

export const DEFAULT_GRID: Record<DayKey, ShiftCount> = {
    mon: { morning: 1, afternoon: 1, evening: 0 },
    tue: { morning: 2, afternoon: 1, evening: 1 },
    wed: { morning: 0, afternoon: 2, evening: 0 },
    thu: { morning: 1, afternoon: 1, evening: 1 },
    fri: { morning: 0, afternoon: 2, evening: 0 },
    sat: { morning: 1, afternoon: 0, evening: 0 },
    sun: { morning: 0, afternoon: 0, evening: 0 }
};

export function cloneGrid(grid: Record<DayKey, ShiftCount> = DEFAULT_GRID): Record<DayKey, ShiftCount> {
    const cloned = {} as Record<DayKey, ShiftCount>;
    for (const key in grid) {
        const k = key as DayKey;
        cloned[k] = { ...grid[k] };
    }
    return cloned;
}

const MOCK_COURSES = [
    { code: 'PRJ301-LT.001', name: 'Java Web Application Development', room: 'AL-301', group: 'Nhóm 1', className: 'SE1601', type: CourseType.LT },
    { code: 'SWP391-TH.002', name: 'Application Development Project', room: 'BE-402', group: 'Nhóm 2', className: 'SE1602', type: CourseType.TH },
    { code: 'DBI202-LT.001', name: 'Introduction to Databases', room: 'DE-205', group: 'Nhóm 1', className: 'SE1601', type: CourseType.LT },
    { code: 'MAD101-LT.003', name: 'Discrete mathematics', room: 'AL-209', group: 'Nhóm 3', className: 'AI1701', type: CourseType.LT },
    { code: 'PRN211-TH.001', name: 'C# Programming Lab', room: 'AL-304', group: 'Nhóm 1', className: 'SE1603', type: CourseType.TH },
    { code: 'MAS291-LT.002', name: 'Statistics and Probability', room: 'DE-401', group: 'Nhóm 2', className: 'IA1601', type: CourseType.LT },
    { code: 'MKT201-LT.004', name: 'Marketing Principles', room: 'DE-202', group: 'Nhóm 4', className: 'MC1702', type: CourseType.LT },
];

const FULL_DAY_NAMES: Record<DayKey, string> = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
    fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
};


// --- Utilities & RNG ---

/** Simple string hasher for seed conversion */
function xmur3(str: string) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = h << 13 | h >>> 19;
    }
    return function() {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

/** PRNG generator returning a random number 0-1 */
function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function getMonday(d: Date): Date {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0); // Normalize
    const day = date.getDay() || 7;
    if (day !== 1) date.setHours(-24 * (day - 1));
    return date;
}

// --- Grid Generation ---

interface OverlappingShift {
    key: 'morning' | 'afternoon' | 'evening';
    count: number;
    blocks: readonly number[];
}
export function patternToGrid(pattern: PatternMode, seedStr: string): Record<DayKey, ShiftCount> {
    if (pattern === 'balanced') return cloneGrid(DEFAULT_GRID);
    
    // Deep copy base grid to modify for others
    const grid: Record<DayKey, ShiftCount> = cloneGrid(DEFAULT_GRID);
    const random = mulberry32(xmur3(seedStr || 'default')());
    
    const days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    switch (pattern) {
        case 'dense':
            for (const d of days) {
                if (d === 'sun') continue;
                grid[d] = { morning: 2, afternoon: 2, evening: 1 };
            }
            break;
        case 'sparse': {
            for (const d of days) {
                grid[d] = { morning: 0, afternoon: 0, evening: 0 };
            }
            // Just 1-2 random classes
            const rDay = days[Math.floor(random() * 5)];
            grid[rDay].afternoon = 1;
            const rDay2 = days[Math.floor(random() * 5)];
            grid[rDay2].morning = 1;
            break;
        }
        case 'randomized':
            for (const d of days) {
                if (d === 'sun') {
                    grid[d] = { morning: 0, afternoon: 0, evening: 0 };
                    continue;
                }
                grid[d] = {
                    morning: Math.floor(random() * 3), // 0-2
                    afternoon: Math.floor(random() * 3), // 0-2
                    evening: random() > 0.7 ? 1 : 0 // 30% chance for 1 evening session
                };
            }
            break;
        case 'edge-case':
            // High variation
            grid.mon = { morning: 3, afternoon: 0, evening: 1 };
            grid.wed = { morning: 0, afternoon: 3, evening: 0 };
            grid.fri = { morning: 1, afternoon: 0, evening: 2 };
            grid.sun = { morning: 1, afternoon: 1, evening: 0 };
            break;
    }
    
    return grid;
}

// --- Build Session ---

function createSession(
    random: () => number,
    dayName: string,
    shift: 'morning' | 'afternoon' | 'evening',
    teacherName: string,
    periodStarts: number[], // [start, end]
): CourseSession {
    const course = MOCK_COURSES[Math.floor(random() * MOCK_COURSES.length)];
    const periodCount = periodStarts[1] - periodStarts[0] + 1;
    const timeSlot = `${periodStarts[0]}-${periodStarts[1]}`;
    
    return {
        id: `${course.code}-${dayName}-${timeSlot}-${Math.floor(random() * 100000)}`,
        courseCode: course.code,
        courseName: course.name,
        group: course.group,
        className: course.className,
        timeSlot,
        periodCount,
        room: random() > 0.95 ? '' : course.room, // Edge case: 5% chance missing room
        teacher: teacherName,
        type: course.type,
        dayOfWeek: dayName,
        sessionTime: shift
    };
}

// --- Main Generator ---

export function generateFromBuilder(config: ScheduleBuilderConfig): { data: ScheduleData, mockTime: Date } {
    const effectiveSeed = config.seed.trim() || Math.random().toString(36).substring(2);
    const rng = mulberry32(xmur3(effectiveSeed)());

    // Compute base dates
    // Support parsing 'YYYY-MM-DD' correctly prioritizing local timezone instead of UTC 00:00.
    const [y, m, d] = config.mockDate.split('-').map(Number);
    const mockRefDate = new Date();
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        mockRefDate.setFullYear(y, m - 1, d);
    }
    
    if (config.mockTime) {
        const [hh, mm] = config.mockTime.split(':').map(Number);
        mockRefDate.setHours(hh || 0, mm || 0, 0, 0);
    }

    const currentMonday = getMonday(mockRefDate);
    const weeks: WeekSchedule[] = [];
    
    // How to decide distribution
    const calculateFactor = (weekIdxOffset: number) => {
        if (config.weekCount === 1 || weekIdxOffset === 0) return 1.0;
        if (config.weekDistribution === 'uniform') return 1.0;
        if (config.weekDistribution === 'random') return 0.2 + rng() * 0.8;
        // decay
        return weekIdxOffset < 0 ? config.pastWeekFactor : config.futureWeekFactor;
    };

    const startOffset = config.weekCount <= 1 ? 0 : -Math.floor((config.weekCount - 1) / 2);
    const endOffset = startOffset + Math.max(1, config.weekCount) - 1;

    for (let w = startOffset; w <= endOffset; w++) {
        const weekMon = new Date(currentMonday);
        weekMon.setDate(currentMonday.getDate() + (w * 7));
        const weekSun = new Date(weekMon);
        weekSun.setDate(weekMon.getDate() + 6);
        
        const dateRange = `${formatDate(weekMon)} - ${formatDate(weekSun)}`;
        const factor = calculateFactor(w);
        
        const singleWeek: WeekSchedule = {
            weekNumber: w - startOffset + 1,
            dateRange,
            days: {
                Monday: { morning: [], afternoon: [], evening: [] },
                Tuesday: { morning: [], afternoon: [], evening: [] },
                Wednesday: { morning: [], afternoon: [], evening: [] },
                Thursday: { morning: [], afternoon: [], evening: [] },
                Friday: { morning: [], afternoon: [], evening: [] },
                Saturday: { morning: [], afternoon: [], evening: [] },
                Sunday: { morning: [], afternoon: [], evening: [] },
            }
        };

        const daysKeys: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        for (const dk of daysKeys) {
            const dayFull = FULL_DAY_NAMES[dk];
            const shiftCounts = config.sessionsGrid[dk];
            if (!shiftCounts) continue;
            
            // Apply distribution factor
            const mCount = Math.round(shiftCounts.morning * factor);
            const aCount = Math.round(shiftCounts.afternoon * factor);
            const eCount = Math.round(shiftCounts.evening * factor);

            const shifts: OverlappingShift[] = [
                { key: 'morning', count: mCount, blocks: PERIOD_BLOCKS.morning },
                { key: 'afternoon', count: aCount, blocks: PERIOD_BLOCKS.afternoon },
                { key: 'evening', count: eCount, blocks: PERIOD_BLOCKS.evening }
            ];

            for (const s of shifts) {
                let availableBlocks = [...s.blocks];
                
                for (let i = 0; i < s.count; i++) {
                    if (availableBlocks.length < 2) break;
                    
                    // Assign random 2-3 period chunks
                    const chunkLength = (rng() > 0.5 && availableBlocks.length >= 3) ? 3 : 2;
                    const sp = availableBlocks[0];
                    const ep = sp + chunkLength - 1;
                    
                    // Verify if ep is within the block limits, to avoid going into breaks
                    if (ep <= s.blocks[s.blocks.length - 1]) {
                         singleWeek.days[dayFull][s.key].push(
                             createSession(rng, dayFull, s.key, config.teacherName, [sp, ep])
                         );
                         // Cut used blocks
                         availableBlocks = availableBlocks.filter(b => b > ep);
                    } else {
                        // Failed to fit cleanly, just take whatever left
                        const validEp = s.blocks[s.blocks.length - 1];
                        singleWeek.days[dayFull][s.key].push(
                             createSession(rng, dayFull, s.key, config.teacherName, [sp, validEp])
                        );
                        availableBlocks = [];
                    }
                }
            }
        }
        weeks.push(singleWeek);
    }
    
    // Inject Overlaps based on mode
    if (config.overlapMode !== 'none' && weeks.length > 0) {
        // Find 'current week' to inject overlap
        const currentWeekIdx = Math.min(weeks.length - 1, Math.max(0, -startOffset));
        const targetWeek = weeks[currentWeekIdx];
        
        let overlapCount = 0;
        if (config.overlapMode === 'single') overlapCount = 1;
        if (config.overlapMode === 'multiple') overlapCount = 2;
        if (config.overlapMode === 'chaotic') overlapCount = 4;
        
        for (let i = 0; i < overlapCount; i++) {
            const dayKeysArr: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
            const targetDayKey = dayKeysArr[Math.floor(rng() * dayKeysArr.length)];
            const targetDayFull = FULL_DAY_NAMES[targetDayKey];
            
            // Try afternoon
            const shiftName = rng() > 0.5 ? 'afternoon' : 'morning';
            const baseBlocks = PERIOD_BLOCKS[shiftName];
            
            // Check if there is an existing session to overlap with, else create two overlapping ones.
            const existing = targetWeek.days[targetDayFull][shiftName];
            if (existing.length > 0) {
                // Find one to overlap
                const targetSess = existing[0];
                const psAndPe = targetSess.timeSlot.split('-');
                if (psAndPe.length === 2 && !isNaN(+psAndPe[0]) && !isNaN(+psAndPe[1])) {
                    targetWeek.days[targetDayFull][shiftName].push(
                        createSession(rng, targetDayFull, shiftName, config.teacherName, [+psAndPe[0], +psAndPe[1]])
                    );
                }
            } else {
                // Create two overlapping ones
                targetWeek.days[targetDayFull][shiftName].push(
                     createSession(rng, targetDayFull, shiftName, config.teacherName, [baseBlocks[0], baseBlocks[0] + 1])
                );
                targetWeek.days[targetDayFull][shiftName].push(
                     createSession(rng, targetDayFull, shiftName, 'Another Teacher', [baseBlocks[0], baseBlocks[0] + 1])
                );
            }
        }
    }

    const semesterDigits = (config.semester || '1').match(/\d+/)?.[0] || '1';

    const metadata: Metadata = {
        teacher: config.teacherName || 'Trần Văn Demo',
        semester: semesterDigits,
        academicYear: `${config.academicYear.start}-${config.academicYear.end}`,
        extractedDate: new Date().toISOString(), // Use real system time for metadata
    };

    return {
        data: {
            metadata,
            weeks,
            allCourses: [], // Filled during sanitization
        },
        mockTime: mockRefDate
    };
}

// --- UMS HTML Serializer & Builder for Real File Load Testing ---

const ORDERED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const SHIFT_CSS_CLASS: Record<'morning' | 'afternoon' | 'evening', string> = {
    morning: 'hitec-td-tkbSang',
    afternoon: 'hitec-td-tkbChieu',
    evening: 'hitec-td-tkbToi',
};

function escapeHtml(raw: string): string {
    return raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function formatWeekHeaderText(dateRange: string): string {
    const matches = dateRange.match(/(\d{2}\/\d{2}\/\d{4})/g);
    if (matches && matches.length >= 2) {
        return `Từ ngày: ${matches[0]} đến ngày ${matches[1]}`;
    }
    return dateRange;
}

function renderSessionHtml(session: CourseSession): string {
    const [startStr, endStr] = session.timeSlot.split('-');
    const startPeriod = parseInt(startStr, 10) || 1;
    const endPeriod = parseInt(endStr, 10) || startPeriod + session.periodCount - 1;
    const groupText = session.group?.toLowerCase().includes('nhóm')
        ? session.group
        : `Nhóm ${session.group || '1'}`;
    const classText = session.className || 'CTK45';
    const fullTitle = `${session.courseName} - ${groupText} - ${classText}`;
    const roomFormatted = session.room ? `.${session.room.replace(/^\.+/, '')}` : '';
    const dataContent = `Phòng học: ${roomFormatted}<br />Tiết: ${startPeriod} - ${endPeriod} (Thực dạy <b>${session.periodCount}</b> tiết)<br />Giáo viên: ${session.teacher}`;

    return `<p>
                                        <a href="/giangvien/Course/Details/${escapeHtml(session.courseCode)}/"
                                           title="${escapeHtml(fullTitle)}"
                                           data-toggle="popover"
                                           data-trigger="hover"
                                           data-placement="bottom"
                                           data-html="true"
                                           data-content="${escapeHtml(dataContent)}">
                                            <strong>${escapeHtml(session.courseCode)}</strong>
                                            <br />
                                            ${startPeriod} - ${endPeriod} [${escapeHtml(roomFormatted)}]
                                        </a>
                                    </p>`;
}

/**
 * Serializes structured ScheduleData into a full UMS-compatible HTML document
 * that can be parsed directly by `parseScheduleHTML` or uploaded as a `.html` file.
 */
export function serializeScheduleToUMSHTML(data: ScheduleData): string {
    const teacher = data.metadata.teacher || 'Giảng Viên A';
    const semesterMatch = String(data.metadata.semester || '1').match(/\d+/);
    const semesterNum = semesterMatch ? semesterMatch[0] : '1';
    const academicYear = data.metadata.academicYear || '2026-2027';

    const weeksHtml = data.weeks
        .map((week) => {
            const weekHeader = formatWeekHeaderText(week.dateRange);
            const shifts: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];

            const shiftRowsHtml = shifts
                .map((shift) => {
                    const cssClass = SHIFT_CSS_CLASS[shift];
                    const cellsHtml = ORDERED_DAYS.map((dayName) => {
                        const sessions = week.days[dayName]?.[shift] || [];
                        const links = sessions.map(renderSessionHtml).join('\n');
                        return `                            <td class="${cssClass} ">\n${links}\n                            </td>`;
                    }).join('\n');

                    return `                    <tr>\n${cellsHtml}\n                    </tr>`;
                })
                .join('\n');

            return `                    <tr>
                        <td colspan="7" class="hitec-td-tkbTuan">
                            ${escapeHtml(weekHeader)}
                        </td>
                    </tr>
${shiftRowsHtml}`;
        })
        .join('\n');

    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8" />
    <title>Lịch trình giảng dạy - ${escapeHtml(teacher)}</title>
</head>
<body>
    <div class="hitec-information">
        <h5>${escapeHtml(teacher)}</h5>
    </div>
    <div style="text-align: right; margin-bottom: 10px;">
        <span class="hitec-year">Học kỳ: ${escapeHtml(semesterNum)}, năm học: ${escapeHtml(academicYear)}</span>
    </div>
    <div class="container-fluid">
        <table class="table table-bordered">
            <thead>
                <tr>
                    <th style="width:14%" class="text-center">Thứ 2</th>
                    <th style="width:14%" class="text-center">Thứ 3</th>
                    <th style="width:14%" class="text-center">Thứ 4</th>
                    <th style="width:14%" class="text-center">Thứ 5</th>
                    <th style="width:14%" class="text-center">Thứ 6</th>
                    <th style="width:14%" class="text-center">Thứ 7</th>
                    <th style="width:auto" class="text-center">Chủ nhật</th>
                </tr>
            </thead>
            <tbody>
${weeksHtml}
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

/**
 * Generates both ScheduleData and a ready-to-parse UMS HTML string from ScheduleBuilderConfig.
 */
export function generateMockScheduleHTML(config: ScheduleBuilderConfig): {
    html: string;
    data: ScheduleData;
    mockTime: Date;
} {
    const { data, mockTime } = generateFromBuilder(config);
    const html = serializeScheduleToUMSHTML(data);
    return { html, data, mockTime };
}

