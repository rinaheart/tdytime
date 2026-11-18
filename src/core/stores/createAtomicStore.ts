/**
 * Atomic Store Wrapper Utility — TdyTime Architecture Guardrail #1
 *
 * Wraps Zustand stores so that:
 * 1. Bare `useStore()` calls without a selector are rejected at both TypeScript
 *    compile time and runtime, guiding developers toward `useStore((s) => s.field)`.
 * 2. Convenient pre-bound atomic field hooks are lazily exposed via `useStore.use.field()`.
 * 3. All static Zustand APIs (`getState`, `setState`, `subscribe`, `getInitialState`, `persist`)
 *    remain intact with zero top-level synchronous overhead.
 */

import type { ExtractState, StoreApi, UseBoundStore } from 'zustand';

export type AtomicSelector<TState, TSlice> = (state: TState) => TSlice;

export type AtomicStoreHook<S extends StoreApi<object>> = {
    /**
     * Subscribe to an atomic slice of the store state.
     * @example const data = useScheduleStore((s) => s.data);
     */
    <TSlice>(selector: AtomicSelector<ExtractState<S>, TSlice>): TSlice;

    /**
     * Lazy pre-bound atomic field selectors.
     * @example const data = useScheduleStore.use.data();
     */
    use: {
        [K in keyof ExtractState<S>]-?: () => ExtractState<S>[K];
    };
} & Omit<S, never>;

const BARE_CALL_ERROR_MESSAGE =
    '[Architecture Guardrail] Bare useStore() calls are forbidden to prevent full-tree re-renders. ' +
    'Pass an atomic selector: useStore((s) => s.field) or useStore.use.field().';

/**
 * Wraps a Zustand `UseBoundStore` to enforce atomic selector usage (`useStore((s) => s.field)`)
 * and attach lazy `.use.<field>()` selector helpers.
 */
export function createAtomicStore<S extends StoreApi<object>>(
    store: UseBoundStore<S>
): AtomicStoreHook<S> {
    type TState = ExtractState<S>;

    const useAtomicStore = <TSlice>(selector: AtomicSelector<TState, TSlice>): TSlice => {
        if (typeof selector !== 'function') {
            throw new Error(BARE_CALL_ERROR_MESSAGE);
        }
        return store(selector);
    };

    // Copy static store methods (getState, setState, subscribe, getInitialState, persist, etc.)
    Object.assign(useAtomicStore, store);

    // Lazily cache per-field selector functions on first access (zero module-load iteration)
    const selectorCache = new Map<PropertyKey, AtomicSelector<TState, unknown>>();

    const useProxy = new Proxy({} as AtomicStoreHook<S>['use'], {
        get(_target, prop: PropertyKey) {
            return () => {
                let fieldSelector = selectorCache.get(prop);
                if (!fieldSelector) {
                    fieldSelector = (state: TState) => (state as Record<PropertyKey, unknown>)[prop];
                    selectorCache.set(prop, fieldSelector);
                }
                return store(fieldSelector as AtomicSelector<TState, never>);
            };
        },
    });

    Object.defineProperty(useAtomicStore, 'use', {
        value: useProxy,
        enumerable: false,
        configurable: false,
        writable: false,
    });

    return useAtomicStore as unknown as AtomicStoreHook<S>;
}

/**
 * Explicit helper hook that enforces atomic selector access on any Zustand store.
 * @example const darkMode = useAtomicSelector(useUIStore, (s) => s.darkMode);
 */
export function useAtomicSelector<S extends StoreApi<object>, TSlice>(
    store: AtomicStoreHook<S> | UseBoundStore<S>,
    selector: AtomicSelector<ExtractState<S>, TSlice>
): TSlice {
    if (typeof selector !== 'function') {
        throw new Error(BARE_CALL_ERROR_MESSAGE);
    }
    return (store as AtomicStoreHook<S>)(selector);
}
