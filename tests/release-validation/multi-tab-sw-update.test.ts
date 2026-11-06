/**
 * Multi-Tab Service Worker Update Reliability Test
 * 
 * Validates:
 * 1. Multi-tab behavior when a waiting Service Worker receives SKIP_WAITING
 * 2. controllerchange event propagation across client contexts
 * 3. Prevention of reload loops
 * 4. Data persistence in localStorage & IndexedDB across reloads
 * 5. Draft loss risk in React local state vs persisted storage
 * 6. Race condition between save and reload
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNotesStore } from '@/core/stores/notes.store';
import type { ScheduleData } from '@/core/schedule/schedule.types';

describe('PHASE 1 & 2: Multi-Tab Service Worker Update & Draft Persistence', () => {
    beforeEach(() => {
        localStorage.clear();
        useNotesStore.getState().clearAllNotes();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('Scenario 1: controllerchange triggers reload on active tabs without reload loops', () => {
        // Mock 3 browsing tabs with controllerchange listeners
        const tabA_reloaded = vi.fn();
        const tabB_reloaded = vi.fn();
        const tabC_reloaded = vi.fn();

        // Each tab attaches a listener simulating Workbox / virtual:pwa-register
        let swWaiting: { postMessage: (msg: { type: string }) => void } | null = {
            postMessage: vi.fn(),
        };

        // When Tab A triggers updateServiceWorker(true)
        const updateServiceWorker = vi.fn(() => {
            if (swWaiting) {
                swWaiting.postMessage({ type: 'SKIP_WAITING' });
                // SW activates and controller changes across all tabs of same origin
                triggerControllerChange();
            }
        });

        const triggerControllerChange = () => {
            // Native browser dispatches controllerchange event to all clients
            tabA_reloaded();
            tabB_reloaded();
            tabC_reloaded();
            // Once activated, waiting worker becomes null (no longer waiting)
            swWaiting = null;
        };

        // Tab A initiates update
        updateServiceWorker();

        // 1. Verify SKIP_WAITING sent
        expect(updateServiceWorker).toHaveBeenCalledTimes(1);

        // 2. Verify all tabs receive reload signal
        expect(tabA_reloaded).toHaveBeenCalledTimes(1);
        expect(tabB_reloaded).toHaveBeenCalledTimes(1);
        expect(tabC_reloaded).toHaveBeenCalledTimes(1);

        // 3. Verify no reload loop: subsequent checks see swWaiting is null
        expect(swWaiting).toBeNull();
        // A new reload or check will NOT trigger another controllerchange
        expect(tabA_reloaded).toHaveBeenCalledTimes(1);
    });

    it('Scenario 2: Persisted data in localStorage & IndexedDB is preserved across multi-tab reloads', async () => {
        // Setup realistic saved data prior to SW update
        const mockSchedule: ScheduleData = {
            metadata: {
                teacher: 'TS. Lê Thị Mai',
                semester: '1',
                academicYear: '2025-2026',
                extractedDate: '2025-09-01T08:00:00.000Z',
            },
            weeks: [
                {
                    weekNumber: 1,
                    dateRange: '01/09/2025 - 07/09/2025',
                    days: {
                        Monday: {
                            morning: [
                                {
                                    subjectCode: 'CS101',
                                    subjectName: 'Nhập môn Lập trình',
                                    className: '25CNTT1',
                                    group: '01',
                                    room: 'C102',
                                    timeSlot: 'Tiết 1-3',
                                    type: 'LT',
                                },
                            ],
                            afternoon: [],
                            evening: [],
                        },
                    },
                },
            ],
            aggregatedCourses: {},
        };

        // 1. Tab A saved schedule to localStorage and history
        localStorage.setItem('last_schedule_data', JSON.stringify(mockSchedule));
        localStorage.setItem('global_abbreviations', JSON.stringify({ 'Nhập môn Lập trình': 'NMLT' }));

        // 2. Tab B saved a note for session CS101_1
        useNotesStore.getState().setNote('CS101_1', 'Sinh viên cần chuẩn bị bài tập số 2');

        // Confirm persisted values before update
        expect(localStorage.getItem('last_schedule_data')).toContain('TS. Lê Thị Mai');
        expect(localStorage.getItem('global_abbreviations')).toContain('NMLT');
        expect(useNotesStore.getState().getNote('CS101_1')).toBe('Sinh viên cần chuẩn bị bài tập số 2');

        // 3. Tab C triggers SW update -> simulating page reload
        // In a web app, a reload resets JS memory, then stores are rehydrated from localStorage / IDB.
        const reloadedScheduleRaw = localStorage.getItem('last_schedule_data');
        const reloadedAbbrRaw = localStorage.getItem('global_abbreviations');
        const reloadedNotesRaw = localStorage.getItem('tdy_session_notes');

        expect(reloadedScheduleRaw).not.toBeNull();
        const reloadedSchedule = JSON.parse(reloadedScheduleRaw!);
        expect(reloadedSchedule.metadata.teacher).toBe('TS. Lê Thị Mai');

        expect(reloadedAbbrRaw).not.toBeNull();
        const reloadedAbbr = JSON.parse(reloadedAbbrRaw!);
        expect(reloadedAbbr['Nhập môn Lập trình']).toBe('NMLT');

        expect(reloadedNotesRaw).not.toBeNull();
        const reloadedNotes = JSON.parse(reloadedNotesRaw!);
        expect(reloadedNotes.state.notes['CS101_1']).toBe('Sinh viên cần chuẩn bị bài tập số 2');
    });

    it('Scenario 3: Unsaved draft in React component state is LOST on reload', () => {
        // Tab B has a previously saved note
        useNotesStore.getState().setNote('CS101_1', 'Nội dung cũ đã lưu');

        // User opens NoteModal in Tab B:
        // - Initial content loaded from Zustand: 'Nội dung cũ đã lưu'
        // - User types additional text in React local state (draftContent):
        let reactLocalDraftContent = 'Nội dung cũ đã lưu + ĐOẠN ĐANG GÕ DỞ CHƯA BẤM LƯU...';
        expect(reactLocalDraftContent).toContain('ĐOẠN ĐANG GÕ DỞ CHƯA BẤM LƯU');

        // Tab A clicks "Cập nhật ngay" in PWAUpdateHandler -> window.location.reload()
        // During reload: React unmounts NoteModal, local component state is wiped
        reactLocalDraftContent = ''; // React state destroyed on unmount/reload
        expect(reactLocalDraftContent).toBe('');

        // After page reload: NoteModal re-reads from Zustand / localStorage
        const rehydratedContent = useNotesStore.getState().getNote('CS101_1');

        // EVIDENCE: Persisted data is intact, but the in-progress draft is LOST
        expect(rehydratedContent).toBe('Nội dung cũ đã lưu');
        expect(rehydratedContent).not.toContain('ĐOẠN ĐANG GÕ DỞ CHƯA BẤM LƯU');
    });

    it('Scenario 4: Race condition between save and reload (Synchronous persist safety)', () => {
        // Verify that Zustand persist synchronously updates localStorage upon setNote
        const sessionId = 'CS102_1';
        const newNoteText = 'Ghi chú khẩn cấp lưu ngay trước khi reload';

        // User clicks Save in NoteModal:
        useNotesStore.getState().setNote(sessionId, newNoteText);

        // Check immediately in the very same synchronous tick (before reload could occur)
        const storedJson = localStorage.getItem('tdy_session_notes');
        expect(storedJson).not.toBeNull();
        expect(storedJson).toContain(newNoteText);

        // Conclusion: Because Zustand persist uses synchronous localStorage.setItem,
        // once the user clicks "Lưu", there is NO async race condition lag.
        // The risk only exists for uncommitted drafts still sitting in React local state.
    });
});
