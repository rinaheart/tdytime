/**
 * Draft Service — TdyTime
 * Tab-isolated auto-draft persistence in sessionStorage.
 * Protects unsaved note drafts across Service Worker updates and unexpected reloads.
 */

export interface NoteDraft {
    sessionId: string;
    content: string;
    updatedAt: number;
    baseContent: string;
}

const DRAFT_PREFIX = 'tdy_draft_note_';

class DraftService {
    private pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
    private pendingDrafts = new Map<string, NoteDraft>();

    private getKey(sessionId: string): string {
        return `${DRAFT_PREFIX}${encodeURIComponent(sessionId.trim())}`;
    }

    /** Retrieve draft if it is valid, not empty, and differs from current saved note */
    public getDraft(sessionId: string, currentSavedContent: string): string | null {
        if (!sessionId || typeof window === 'undefined' || !window.sessionStorage) return null;

        try {
            const raw = window.sessionStorage.getItem(this.getKey(sessionId));
            if (!raw) return null;

            const draft = JSON.parse(raw) as NoteDraft;
            if (!draft || typeof draft.content !== 'string') return null;

            // If draft equals current saved note, draft is obsolete -> clean it up
            if (draft.content.trim() === currentSavedContent.trim()) {
                this.clearDraft(sessionId);
                return null;
            }

            return draft.content;
        } catch {
            return null;
        }
    }

    /** Queue a debounced draft write (default 300ms) */
    public saveDraftDebounced(
        sessionId: string,
        content: string,
        baseContent: string,
        delayMs = 300,
    ): void {
        if (!sessionId || typeof window === 'undefined' || !window.sessionStorage) return;

        // Clear existing timer for this session
        const existingTimer = this.pendingTimeouts.get(sessionId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        const draft: NoteDraft = {
            sessionId,
            content,
            baseContent,
            updatedAt: Date.now(),
        };

        this.pendingDrafts.set(sessionId, draft);

        const timer = setTimeout(() => {
            this.flush(sessionId);
        }, delayMs);

        this.pendingTimeouts.set(sessionId, timer);
    }

    /** Flush pending draft synchronously to sessionStorage */
    public flush(sessionId?: string): void {
        if (typeof window === 'undefined' || !window.sessionStorage) return;

        if (sessionId) {
            const timer = this.pendingTimeouts.get(sessionId);
            if (timer) {
                clearTimeout(timer);
                this.pendingTimeouts.delete(sessionId);
            }

            const draft = this.pendingDrafts.get(sessionId);
            if (draft) {
                try {
                    // Only persist if different from base content
                    if (draft.content.trim() !== draft.baseContent.trim()) {
                        window.sessionStorage.setItem(this.getKey(sessionId), JSON.stringify(draft));
                    } else {
                        window.sessionStorage.removeItem(this.getKey(sessionId));
                    }
                } catch (e) {
                    console.warn('Failed to write draft to sessionStorage:', e);
                }
                this.pendingDrafts.delete(sessionId);
            }
        } else {
            this.flushAll();
        }
    }

    /** Flush all pending drafts synchronously */
    public flushAll(): void {
        if (typeof window === 'undefined' || !window.sessionStorage) return;

        this.pendingTimeouts.forEach((timer) => clearTimeout(timer));
        this.pendingTimeouts.clear();

        this.pendingDrafts.forEach((draft, sessionId) => {
            try {
                if (draft.content.trim() !== draft.baseContent.trim()) {
                    window.sessionStorage.setItem(this.getKey(sessionId), JSON.stringify(draft));
                } else {
                    window.sessionStorage.removeItem(this.getKey(sessionId));
                }
            } catch (e) {
                console.warn('Failed to flush draft to sessionStorage:', e);
            }
        });
        this.pendingDrafts.clear();
    }

    /** Clear draft from sessionStorage and cancel any pending debounced write */
    public clearDraft(sessionId: string): void {
        if (!sessionId || typeof window === 'undefined' || !window.sessionStorage) return;

        const timer = this.pendingTimeouts.get(sessionId);
        if (timer) {
            clearTimeout(timer);
            this.pendingTimeouts.delete(sessionId);
        }
        this.pendingDrafts.delete(sessionId);

        try {
            window.sessionStorage.removeItem(this.getKey(sessionId));
        } catch {
            // Ignore sessionStorage removal error
        }
    }
}

export const draftService = new DraftService();

// Synchronously flush on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        draftService.flushAll();
    });
}
