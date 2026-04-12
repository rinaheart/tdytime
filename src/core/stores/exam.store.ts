import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ExamData, ExamSession } from '../exam/exam.types';

interface ExamState {
    data: ExamData | null;
    isInitialized: boolean;
    
    // Actions
    setExamData: (teacherName: string, sessions: ExamSession[]) => void;
    clearExamData: () => void;
}

export const useExamStore = create<ExamState>()(
    persist(
        (set) => ({
            data: null,
            isInitialized: false,

            setExamData: (teacherName, sessions) => {
                set({
                    data: {
                        teacherName,
                        sessions,
                        updatedAt: Date.now(),
                    },
                    isInitialized: true,
                });
            },

            clearExamData: () => {
                set({ data: null, isInitialized: true });
            },
        }),
        {
            name: 'tdytime_exam_v1',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) state.isInitialized = true;
            },
        }
    )
);
