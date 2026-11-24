/**
 * Structured Scoped Logger — TdyTime
 * Lightweight, zero-dependency logger for system boundaries (bootstrap, PWA,
 * storage/backup, routing, i18n, and external API calls).
 *
 * Automatically redacts sensitive keys, strips inline base64/binary payloads,
 * truncates oversized strings, and gates verbose `debug` logs behind dev/flag mode.
 */

import { STORAGE_KEYS } from '../config/constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ScopedLogger {
    debug: (message: string, meta?: unknown) => void;
    info: (message: string, meta?: unknown) => void;
    warn: (message: string, meta?: unknown) => void;
    error: (message: string, meta?: unknown) => void;
}

const SENSITIVE_KEY_PATTERN = /(api[-_]?key|token|auth(orization)?|password|secret|credential)/i;
const INLINE_DATA_KEY_PATTERN = /^(inlineData|inline_data|base64|binary|bytes)$/i;
const DATA_URL_PATTERN = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,/i;
const MAX_STRING_LENGTH = 500;
const MAX_DEPTH = 4;

/**
 * Checks whether verbose debug logging is enabled via Vite DEV mode or localStorage opt-in.
 */
export function isDebugLoggingEnabled(): boolean {
    const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;
    if (env?.DEV) return true;
    try {
        return typeof window !== 'undefined' && window.localStorage?.getItem(STORAGE_KEYS.debugLogs) === '1';
    } catch {
        return false;
    }
}

/**
 * Sanitizes arbitrary log metadata by redacting secrets, stripping inline binary/data URLs,
 * and truncating excessively long strings.
 *
 * @param value - Raw value to sanitize before writing to console output
 * @param depth - Internal recursion depth counter
 */
export function sanitizeLogValue(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) return value;
    if (value instanceof Error) {
        return {
            name: value.name,
            message: sanitizeLogValue(value.message, depth + 1),
        };
    }
    if (typeof value === 'string') {
        if (DATA_URL_PATTERN.test(value)) {
            return '[INLINE_DATA_STRIPPED]';
        }
        if (value.length > MAX_STRING_LENGTH) {
            return `${value.slice(0, MAX_STRING_LENGTH)}…[truncated ${value.length - MAX_STRING_LENGTH} chars]`;
        }
        return value;
    }
    if (typeof value !== 'object') return value;
    if (depth >= MAX_DEPTH) return '[MAX_DEPTH]';

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeLogValue(item, depth + 1));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
            sanitized[key] = '[REDACTED]';
        } else if (INLINE_DATA_KEY_PATTERN.test(key)) {
            sanitized[key] = '[INLINE_DATA_STRIPPED]';
        } else {
            sanitized[key] = sanitizeLogValue(val, depth + 1);
        }
    }
    return sanitized;
}

function emit(level: LogLevel, scope: string, message: string, meta?: unknown): void {
    if (level === 'debug' && !isDebugLoggingEnabled()) return;

    const prefix = `[TdyTime:${scope}]`;
    const consoleMethod =
        level === 'error'
            ? console.error
            : level === 'warn'
              ? console.warn
              : level === 'info'
                ? console.info
                : console.debug;

    if (meta === undefined) {
        consoleMethod(prefix, message);
    } else {
        consoleMethod(prefix, message, sanitizeLogValue(meta));
    }
}

/**
 * Creates a module-scoped structured logger (e.g., `createLogger('PWA')`).
 *
 * @param scope - Short subsystem identifier displayed in log prefixes
 */
export function createLogger(scope: string): ScopedLogger {
    return {
        debug: (message, meta) => emit('debug', scope, message, meta),
        info: (message, meta) => emit('info', scope, message, meta),
        warn: (message, meta) => emit('warn', scope, message, meta),
        error: (message, meta) => emit('error', scope, message, meta),
    };
}

export const logger = createLogger('App');
