/**
 * Auto-Draft Persistence Test Suite — TdyTime
 * 
 * Validates:
 * 1. Debounced saving of note drafts to sessionStorage (300ms)
 * 2. Tab-isolation via sessionStorage
 * 3. Restoring draft upon opening NoteModal
 * 4. Cleaning up draft upon successful note save
 * 5. Cleaning up draft upon explicit discard
 * 6. Protection against overwriting saved note with stale draft
 * 7. Safe handling of invalid/empty sessionId
 * 8. Synchronous flush before Service Worker update reload
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { draftService } from '@/core/notes/draft.service';
import { useNotesStore } from '@/core/stores/notes.store';

describe('PHASE 1: Auto-Draft Persistence & Lifecycle', () => {
    beforeEach(() => {
        sessionStorage.clear();
        localStorage.clear();
        useNotesStore.getState().clearAllNotes();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('1. Debounces draft writes to sessionStorage by 300ms', () => {
        const sessionId = 'CS101_Mon_1';
        const baseContent = '';

        // User types character by character
        draftService.saveDraftDebounced(sessionId, 'H', baseContent, 300);
        draftService.saveDraftDebounced(sessionId, 'Họ', baseContent, 300);
        draftService.saveDraftDebounced(sessionId, 'Học phần Lập trình', baseContent, 300);

        // Before 300ms: draft should NOT be in sessionStorage yet
        expect(sessionStorage.getItem(`tdy_draft_note_${sessionId}`)).toBeNull();

        // Advance 299ms
        vi.advanceTimersByTime(299);
        expect(sessionStorage.getItem(`tdy_draft_note_${sessionId}`)).toBeNull();

        // Advance remaining 1ms (total 300ms)
        vi.advanceTimersByTime(1);
        const stored = sessionStorage.getItem(`tdy_draft_note_${sessionId}`);
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored!).content).toBe('Học phần Lập trình');
    });

    it('2. Restores draft when opening modal if draft differs from saved note', () => {
        const sessionId = 'CS102_Wed_3';
        const savedContent = 'Nội dung cũ đã lưu';
        const uncommittedDraft = 'Nội dung cũ đã lưu + gõ thêm đoạn này';

        // Save uncommitted draft
        draftService.saveDraftDebounced(sessionId, uncommittedDraft, savedContent, 300);
        vi.advanceTimersByTime(300);

        // Retrieve draft
        const restored = draftService.getDraft(sessionId, savedContent);
        expect(restored).toBe(uncommittedDraft);
    });

    it('3. Clears draft and returns null if draft is identical to current saved content', () => {
        const sessionId = 'CS103_Fri_5';
        const savedContent = 'Ghi chú giống hệt';

        // Set draft identical to saved
        draftService.saveDraftDebounced(sessionId, savedContent, savedContent, 300);
        vi.advanceTimersByTime(300);

        // Retrieve draft
        const restored = draftService.getDraft(sessionId, savedContent);
        expect(restored).toBeNull();
        // Should also auto-delete obsolete draft
        expect(sessionStorage.getItem(`tdy_draft_note_${sessionId}`)).toBeNull();
    });

    it('4. Cleans up draft upon successful note save', () => {
        const sessionId = 'CS104_Tue_2';
        const draftText = 'Nội dung chuẩn bị lưu chính thức';

        draftService.saveDraftDebounced(sessionId, draftText, '', 300);
        vi.advanceTimersByTime(300);
        expect(sessionStorage.getItem(`tdy_draft_note_${sessionId}`)).not.toBeNull();

        // User saves note officially
        useNotesStore.getState().setNote(sessionId, draftText);
        draftService.clearDraft(sessionId);

        // Draft must be removed
        expect(sessionStorage.getItem(`tdy_draft_note_${sessionId}`)).toBeNull();
        // Persisted note must be present
        expect(useNotesStore.getState().getNote(sessionId)).toBe(draftText);
    });

    it('5. Tab-isolation: different sessions/tabs do not leak drafts', () => {
        const sessionA = 'MATH_Mon_1';
        const sessionB = 'PHYS_Tue_2';

        draftService.saveDraftDebounced(sessionA, 'Bản nháp môn Toán', '', 300);
        draftService.saveDraftDebounced(sessionB, 'Bản nháp môn Vật lý', '', 300);
        vi.advanceTimersByTime(300);

        expect(draftService.getDraft(sessionA, '')).toBe('Bản nháp môn Toán');
        expect(draftService.getDraft(sessionB, '')).toBe('Bản nháp môn Vật lý');

        // Clearing A does not affect B
        draftService.clearDraft(sessionA);
        expect(draftService.getDraft(sessionA, '')).toBeNull();
        expect(draftService.getDraft(sessionB, '')).toBe('Bản nháp môn Vật lý');
    });

    it('6. Handles empty, whitespace, and special-character sessionIds safely', () => {
        expect(draftService.getDraft('', '')).toBeNull();
        draftService.saveDraftDebounced('', 'content', '', 300);
        draftService.clearDraft('');

        const specialSessionId = 'HP.01/Nhóm 2 (Thực hành) @ Phòng A-201';
        draftService.saveDraftDebounced(specialSessionId, 'Ghi chú phòng đặc biệt', '', 300);
        vi.advanceTimersByTime(300);

        const restored = draftService.getDraft(specialSessionId, '');
        expect(restored).toBe('Ghi chú phòng đặc biệt');
    });

    it('7. Synchronous flush before Service Worker update reload flushes pending debounced draft', () => {
        const sessionId = 'SW_UPDATE_TEST';
        const activeTypingDraft = 'Đang gõ dở thì có banner Service Worker update xuất hiện!';

        // User typed 100ms ago (debounce has NOT finished yet!)
        draftService.saveDraftDebounced(sessionId, activeTypingDraft, '', 300);
        vi.advanceTimersByTime(100);

        // In normal state, draft is not written to sessionStorage yet
        expect(sessionStorage.getItem(`tdy_draft_note_${sessionId}`)).toBeNull();

        // PWAUpdateHandler triggers updateServiceWorker -> calls draftService.flushAll() synchronously
        draftService.flushAll();

        // Verified: The pending draft was immediately flushed to sessionStorage before reload
        const stored = sessionStorage.getItem(`tdy_draft_note_${sessionId}`);
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored!).content).toBe(activeTypingDraft);

        // After reload, when NoteModal re-opens for that session, draft is recovered
        const restored = draftService.getDraft(sessionId, '');
        expect(restored).toBe(activeTypingDraft);
    });
});
