/**
 * Entry Point — TdyTime v2
 * Cooperative main-thread bootstrap with time-slicing and React 18/19 startTransition.
 */

// Global styles
import './styles/global.css';
import { yieldToMain } from './core/utils/scheduler';
import { PWA_CONFIG, STORAGE_KEYS } from './core/config/constants';
import { createLogger } from './core/utils/logger';

const log = createLogger('Bootstrap');

async function recoverFromStaleChunkError(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
        const lastReload = Number(sessionStorage.getItem(STORAGE_KEYS.preloadReloadTs) || '0');
        // Prevent reload loops: only auto-recover once every cooldown interval
        if (Date.now() - lastReload < PWA_CONFIG.timeouts.preloadRecoveryCooldownMs) {
            return false;
        }
        sessionStorage.setItem(STORAGE_KEYS.preloadReloadTs, String(Date.now()));

        // Tell any waiting Service Worker to activate immediately
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg?.waiting) {
                reg.waiting.postMessage({ type: PWA_CONFIG.messages.skipWaiting });
            }
        }

        // Purge stale Cache Storage entries so index.html and chunks are fetched fresh
        if ('caches' in window) {
            const keys = await window.caches.keys();
            await Promise.all(keys.map((k) => window.caches.delete(k)));
        }

        window.location.reload();
        return true;
    } catch {
        return false;
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('vite:preloadError', (event) => {
        event.preventDefault();
        void recoverFromStaleChunkError();
    });
}

function renderFatalBootstrapFallback() {
    const container = document.getElementById('root');
    if (!container) return;
    container.innerHTML = `
      <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a;">
        <div style="max-width:360px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 4px 20px rgba(15,23,42,0.06);">
          <h2 style="margin:0 0 8px;font-size:16px;font-weight:800;">Đang đồng bộ phiên bản mới</h2>
          <p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.5;">Ứng dụng vừa được cập nhật. Nhấn nút bên dưới để làm mới bộ nhớ đệm (lịch giảng dạy của bạn được giữ nguyên 100%).</p>
          <button id="tdy-recover-btn" type="button" style="width:100%;height:42px;border:none;border-radius:12px;background:#0358d5;color:#ffffff;font-size:13px;font-weight:700;cursor:pointer;">Tải lại ứng dụng</button>
        </div>
      </div>
    `;
    document.getElementById('tdy-recover-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem(STORAGE_KEYS.preloadReloadTs);
        void recoverFromStaleChunkError();
    });
}

async function bootstrap() {
    try {
        // Slice 1: Initialize React DOM client CJS factory
        const ReactDOMModule = await import('react-dom/client');
        await yieldToMain();

        // Slice 2: Initialize core shell i18n
        await import('./i18n/config');
        await yieldToMain();

        // Slice 3: Load App shell and Monitoring wrapper
        const [{ default: React, Suspense, startTransition }, { default: Monitoring }, { default: App }] =
            await Promise.all([
                import('react'),
                import('./app/Monitoring'),
                import('./app/App'),
            ]);
        await yieldToMain();

        // Slice 4: Mount root inside startTransition for 5ms concurrent fiber slicing
        const container = document.getElementById('root')!;
        const root = ReactDOMModule.default.createRoot(container);
        startTransition(() => {
            root.render(
                <React.StrictMode>
                    <Suspense
                        fallback={
                            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                                <div className="w-9 h-9 rounded-full border-3 border-accent-500/20 border-t-accent-600 animate-spin" />
                            </div>
                        }
                    >
                        <Monitoring>
                            <App />
                        </Monitoring>
                    </Suspense>
                </React.StrictMode>,
            );
        });
    } catch (err) {
        log.error('Bootstrap error', err);
        const recovered = await recoverFromStaleChunkError();
        if (!recovered) {
            renderFatalBootstrapFallback();
        }
    }
}

void bootstrap();
