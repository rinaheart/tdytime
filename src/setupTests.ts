import '@testing-library/jest-dom';

const createStorageMock = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = String(value);
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
    };
};

// Polyfill Node 22/24/26 experimental localStorage if undefined
try {
    if (!globalThis.localStorage || typeof globalThis.localStorage.clear !== 'function') {
        const mock = createStorageMock();
        Object.defineProperty(globalThis, 'localStorage', {
            value: mock,
            writable: true,
            configurable: true,
        });
        if (typeof window !== 'undefined') {
            Object.defineProperty(window, 'localStorage', {
                value: mock,
                writable: true,
                configurable: true,
            });
        }
    }
} catch {
    // Fallback assignment
    (globalThis as unknown as { localStorage: unknown }).localStorage = createStorageMock();
}
