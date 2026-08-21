import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotesState {
  /** Map of sessionId -> note content */
  notes: Record<string, string>;
  
  // Actions
  setNote: (id: string, content: string) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => string;
  clearAllNotes: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: {},
      
      setNote: (id, content) => {
        set((state) => ({
          notes: {
            ...state.notes,
            [id]: content
          }
        }));
      },
      
      deleteNote: (id) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...rest } = state.notes;
          return { notes: rest };
        });
      },
      
      getNote: (id) => {
        return get().notes[id] || '';
      },
      
      clearAllNotes: () => {
        set({ notes: {} });
      }
    }),
    {
      name: 'tdy_session_notes',
    }
  )
);
