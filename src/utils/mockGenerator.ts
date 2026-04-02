import { ScheduleData, CourseType, CourseSession, WeekSchedule, Metadata } from '../core/schedule/schedule.types';
// import { getPeriodTimes } from '../core/constants';

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

const MOCK_COURSES = [
    { code: 'PRJ301', name: 'Java Web Application Development', room: 'AL-301' },
    { code: 'SWP391', name: 'Application Development Project', room: 'BE-402' },
    { code: 'DBI202', name: 'Introduction to Databases', room: 'DE-205' },
    { code: 'MAD101', name: 'Discrete mathematics', room: 'AL-209' },
    { code: 'PRN211', name: 'C# Programming', room: 'AL-304' },
    { code: 'MAS291', name: 'Statistics and Probability', room: 'DE-401' },
    { code: 'MKT201', name: 'Marketing Principles', room: 'DE-202' },
];

const FULL_DAY_NAMES: Record<DayKey, string> = {
    mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
    fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
};

// const DAY_INDICES: Record<DayKey, number> = {
//     mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0
// };

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
      var t = a += 0x6D2B79F5;
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
    if (pattern === 'balanced') return JSON.parse(JSON.stringify(DEFAULT_GRID));
    
    // Deep copy base grid to modify for others
    const grid: Record<DayKey, ShiftCount> = JSON.parse(JSON.stringify(DEFAULT_GRID));
    const random = mulberry32(xmur3(seedStr || 'default')());
    
    const days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    switch (pattern) {
        case 'dense':
            for (const d of days) {
                if (d === 'sun') continue;
                grid[d] = { morning: 2, afternoon: 2, evening: 1 };
            }
            break;
        case 'sparse':
            for (const d of days) {
                grid[d] = { morning: 0, afternoon: 0, evening: 0 };
            }
            // Just 1-2 random classes
            const rDay = days[Math.floor(random() * 5)];
            grid[rDay].afternoon = 1;
            const rDay2 = days[Math.floor(random() * 5)];
            grid[rDay2].morning = 1;
            break;
        case 'randomized':
            for (const d of days) {
                if (d === 'sun') {
                    grid[d] = { morning: 0, afternoon: 0, evening: 0 };
                    continue;
                }
                grid[d] = {
                    morning: Math.floor(random() * 3), // 0-2
                    afternoon: Math.floor(random() * 3), // 0-2
                    evening: Math.random() > 0.7 ? 1 : 0 // 30% chance for 1 evening session
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
        group: 'SE1601',
        className: 'SE1601',
        timeSlot,
        periodCount,
        room: random() > 0.95 ? '' : course.room, // Edge case: 5% chance missing room
        teacher: teacherName,
        type: CourseType.LT,
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

    const startOffset = config.weekCount === 3 ? -1 : 0;
    const endOffset = config.weekCount === 3 ? 1 : 0;

    for (let w = startOffset; w <= endOffset; w++) {
        const weekMon = new Date(currentMonday);
        weekMon.setDate(currentMonday.getDate() + (w * 7));
        const weekSun = new Date(weekMon);
        weekSun.setDate(weekMon.getDate() + 6);
        
        const dateRange = `${formatDate(weekMon)} - ${formatDate(weekSun)}`;
        const factor = calculateFactor(w);
        
        const singleWeek: WeekSchedule = {
            weekNumber: w + 20, // arbitrary
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
        const targetWeek = config.weekCount === 3 ? weeks[1] : weeks[0];
        
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

    const metadata: Metadata = {
        teacher: config.teacherName || 'Trần Văn Demo',
        semester: config.semester || 'Spring',
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
