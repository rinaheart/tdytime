/**
 * Unit tests for centralized config constants & structured logger.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger, sanitizeLogValue } from './logger';
import {
    API_ENDPOINTS,
    PWA_BUILD_CONFIG,
    PWA_CONFIG,
    STORAGE_KEYS,
    THEMES,
    THEME_IDS,
    getPeriodTimes,
} from '../config/constants';

describe('Centralized Configuration Constants (src/core/config/constants.ts)', () => {
    it('exposes valid endpoints, PWA messages, storage keys, and theme registry', () => {
        expect(API_ENDPOINTS.version).toBe('/version.json');
        expect(API_ENDPOINTS.serviceWorker).toBe('/sw.js');
        expect(PWA_CONFIG.cachePrefix).toBe('tdytime-pwa-v');
        expect(PWA_CONFIG.messages.clearCache).toBe('CLEAR_CACHE');
        expect(PWA_CONFIG.messages.skipWaiting).toBe('SKIP_WAITING');
        expect(PWA_BUILD_CONFIG.tierACoreEntryPrefixes).toContain('index-');
        expect(PWA_BUILD_CONFIG.tierACoreEntryPrefixes).toContain('constants-');
        expect(STORAGE_KEYS.activeSchedule).toBe('last_schedule_data');
        expect(THEMES).toHaveLength(THEME_IDS.length);
        expect(getPeriodTimes('LT')[1].end).toEqual([7, 45]);
        expect(getPeriodTimes('TH')[1].end).toEqual([8, 0]);
    });
});

describe('Structured Scoped Logger (src/core/utils/logger.ts)', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('redacts sensitive credentials and strips inline binary/data URLs', () => {
        const sanitized = sanitizeLogValue({
            model: 'gemini-2.5-flash',
            apiKey: 'secret-key-123',
            authorization: 'Bearer abc',
            inlineData: { mimeType: 'image/png', data: 'AAAA' },
            avatar: 'data:image/png;base64,iVBORw0KGgo=',
            nested: { password: 'pw', safe: 'ok' },
        }) as Record<string, unknown>;

        expect(sanitized.model).toBe('gemini-2.5-flash');
        expect(sanitized.apiKey).toBe('[REDACTED]');
        expect(sanitized.authorization).toBe('[REDACTED]');
        expect(sanitized.inlineData).toBe('[INLINE_DATA_STRIPPED]');
        expect(sanitized.avatar).toBe('[INLINE_DATA_STRIPPED]');
        expect((sanitized.nested as Record<string, unknown>).password).toBe('[REDACTED]');
        expect((sanitized.nested as Record<string, unknown>).safe).toBe('ok');
    });

    it('truncates oversized string payloads and formats Error instances cleanly', () => {
        const longPrompt = 'a'.repeat(650);
        const sanitized = sanitizeLogValue(longPrompt) as string;
        expect(sanitized.length).toBeLessThan(560);
        expect(sanitized).toContain('[truncated 150 chars]');

        const errObj = sanitizeLogValue(new Error('Disk full')) as { name: string; message: string };
        expect(errObj).toEqual({ name: 'Error', message: 'Disk full' });
    });

    it('emits scoped log prefixes through the matching console method', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const pwaLog = createLogger('PWA');
        pwaLog.warn('Cache fallback', { token: 'top-secret', reason: 'timeout' });
        pwaLog.error('Activation failed');

        expect(warnSpy).toHaveBeenCalledWith('[TdyTime:PWA]', 'Cache fallback', {
            token: '[REDACTED]',
            reason: 'timeout',
        });
        expect(errorSpy).toHaveBeenCalledWith('[TdyTime:PWA]', 'Activation failed');
    });
});
