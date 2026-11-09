import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

/**
 * B2 regression smoke test — react-router-dom bumped 7.14.0 -> 7.18.2.
 *
 * Goal: catch a library-level regression (createHashRouter / RouterProvider /
 * Navigate / useRouteError no longer working as expected), NOT app-level
 * business logic. App guards like RequireData/DevGuard redirecting an
 * unauthenticated session away from a route are expected behavior and are
 * asserted as "did not crash", not "rendered the target view".
 *
 * Full manual verification on a real browser (installed PWA, iOS Safari,
 * actual file upload flow) is still recommended before shipping — see audit
 * notes; this test only guards the library-level navigation contract.
 */
describe('Hash Router — react-router-dom@7.18.2 regression smoke test', () => {
    beforeEach(() => {
        window.location.hash = '';
    });

    const ROUTES = ['/', '/today', '/week', '/semester', '/stats', '/settings', '/exam', '/dev', '/nonexistent-route'];

    it('mounts RouterProvider without throwing', async () => {
        expect(() => render(<RouterProvider router={router} />)).not.toThrow();
    });

    for (const path of ROUTES) {
        it(`navigates to "${path}" without throwing and without hitting the error boundary`, async () => {
            render(<RouterProvider router={router} />);

            await act(async () => {
                await router.navigate(path);
            });

            await waitFor(() => {
                // The router must have settled (not stuck mid-navigation).
                expect(router.state.navigation.state).toBe('idle');
            });

            // The RouteError fallback renders this exact heading on crash.
            expect(document.body.textContent).not.toContain('Unexpected Application Error!');
        });
    }

    it('unknown routes fall back to "/" (catch-all still works)', async () => {
        render(<RouterProvider router={router} />);

        await act(async () => {
            await router.navigate('/this-route-does-not-exist');
        });

        await waitFor(() => {
            expect(router.state.location.pathname).toBe('/');
        });
    });
});
