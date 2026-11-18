import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { create } from 'zustand';
import { createAtomicStore, useAtomicSelector } from './createAtomicStore';

interface CounterState {
    count: number;
    label: string;
    increment: () => void;
    setLabel: (next: string) => void;
}

function makeTestStore() {
    return createAtomicStore(
        create<CounterState>((set) => ({
            count: 0,
            label: 'initial',
            increment: () => set((s) => ({ count: s.count + 1 })),
            setLabel: (next) => set({ label: next }),
        }))
    );
}

describe('createAtomicStore & useAtomicSelector (Architecture Guardrail #1)', () => {
    it('supports standard useStore((s) => s.field) atomic selector pattern', () => {
        const useCounterStore = makeTestStore();
        let renderCount = 0;

        const { result } = renderHook(() => {
            renderCount += 1;
            return useCounterStore((s) => s.count);
        });

        expect(result.current).toBe(0);
        expect(renderCount).toBe(1);

        // Updating an unrelated field ('label') must NOT trigger a re-render of the 'count' subscriber
        act(() => {
            useCounterStore.getState().setLabel('updated');
        });
        expect(renderCount).toBe(1);

        // Updating 'count' triggers a selective re-render
        act(() => {
            useCounterStore.getState().increment();
        });
        expect(result.current).toBe(1);
        expect(renderCount).toBe(2);
    });

    it('supports pre-bound lazy atomic selectors via useStore.use.field()', () => {
        const useCounterStore = makeTestStore();

        const { result: countResult } = renderHook(() => useCounterStore.use.count());
        const { result: labelResult } = renderHook(() => useCounterStore.use.label());

        expect(countResult.current).toBe(0);
        expect(labelResult.current).toBe('initial');

        act(() => {
            useCounterStore.getState().increment();
            useCounterStore.getState().setLabel('atomic');
        });

        expect(countResult.current).toBe(1);
        expect(labelResult.current).toBe('atomic');
    });

    it('supports explicit useAtomicSelector(store, (s) => s.field) helper', () => {
        const useCounterStore = makeTestStore();
        const { result } = renderHook(() => useAtomicSelector(useCounterStore, (s) => s.label));

        expect(result.current).toBe('initial');

        act(() => {
            useCounterStore.setState({ label: 'via-helper' });
        });
        expect(result.current).toBe('via-helper');
    });

    it('rejects bare useStore() calls without a selector and guides developers toward useStore((s) => s.field)', () => {
        const useCounterStore = makeTestStore();
        const bareCall = useCounterStore as unknown as () => unknown;

        expect(() => bareCall()).toThrow(/useStore\(\(s\) => s\.field\)/);
        expect(() =>
            (useAtomicSelector as unknown as (s: unknown) => unknown)(useCounterStore)
        ).toThrow(/useStore\(\(s\) => s\.field\)/);
    });
});
