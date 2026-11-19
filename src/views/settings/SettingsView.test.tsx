/**
 * SettingsView — UI/UX & Accessibility Verification Suite
 * Validates:
 * 1. Option A — 3-Tab Segmented Bento Hub ('courses', 'data', 'info') with keyboard navigation (ArrowRight/ArrowLeft/Home/End)
 * 2. Unified Course Customization Table (AbbreviationsCard: Short Name + LT/TH toggle + Auto-Suggest + Save)
 * 3. 2-step Clear Cache button triggering window.clearPWACache() while preserving schedule store data
 * 4. On-demand Accessible Modals for PeriodStandardsCard and AboutCard (Changelog)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@/i18n/config';
import SettingsView from './SettingsView';
import { useScheduleStore } from '@/core/stores/schedule.store';
import { CourseType } from '@/core/schedule/schedule.types';

describe('SettingsView — Segmented Bento Hub & Clear Cache Verification', () => {
    beforeEach(() => {
        useScheduleStore.setState({
            data: {
                metadata: {
                    teacher: 'TS. Nguyễn Văn A',
                    semester: '1',
                    academicYear: '2026-2027',
                    extractedDate: '2026-11-18',
                },
                weeks: [],
                allCourses: [
                    {
                        code: 'KTYH101',
                        name: 'Hóa sinh lâm sàng nâng cao',
                        classes: ['Y4A'],
                        groups: ['N1'],
                        types: [CourseType.LT],
                        totalPeriods: 30,
                        totalSessions: 10,
                    },
                ],
            },
            abbreviations: {},
            overrides: {},
        });
    });

    it('1. Renders 3-Tab Segmented Bento Hub and supports keyboard tab navigation', () => {
        render(
            <MemoryRouter>
                <SettingsView />
            </MemoryRouter>
        );

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
        expect(tabs[0].getAttribute('aria-selected')).toBe('true');

        // Navigate with ArrowRight to Tab 2 (Data & PWA)
        fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
        expect(tabs[1].getAttribute('aria-selected')).toBe('true');

        // Navigate with End to Tab 3 (Info)
        fireEvent.keyDown(tabs[1], { key: 'End' });
        expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    });

    it('2. Unified AbbreviationsCard allows auto-suggesting short names and toggling LT/TH in one table', () => {
        render(
            <MemoryRouter>
                <SettingsView />
            </MemoryRouter>
        );

        // Verify course row is visible on Tab 1
        expect(screen.getByText('Hóa sinh lâm sàng nâng cao')).toBeDefined();

        // Click Auto-Suggest
        const autoSuggestBtn = screen.getByRole('button', { name: /Gợi ý viết tắt|Auto-Suggest/i });
        fireEvent.click(autoSuggestBtn);

        const input = screen.getByRole('textbox', {
            name: /Hóa sinh lâm sàng nâng cao/i,
        }) as HTMLInputElement;
        expect(input.value).toBe('HSLSNC');

        // Toggle course type from LT to TH
        const thBtn = screen.getByRole('button', {
            name: /Chọn Thực hành \(TH\) cho Hóa sinh lâm sàng nâng cao/i,
        });
        fireEvent.click(thBtn);
        expect(thBtn.getAttribute('aria-pressed')).toBe('true');

        // Save both abbreviation and course type override
        const saveBtn = screen.getByRole('button', { name: /Lưu|Save/i });
        fireEvent.click(saveBtn);

        expect(useScheduleStore.getState().abbreviations['Hóa sinh lâm sàng nâng cao']).toBe(
            'HSLSNC'
        );
        expect(useScheduleStore.getState().overrides['KTYH101']).toBe(CourseType.TH);
    });

    it('3. 2-step Clear Cache button requires confirmation and calls window.clearPWACache without wiping schedule store', async () => {
        const clearPWACacheMock = vi.fn().mockResolvedValue(undefined);
        (window as unknown as { clearPWACache?: () => Promise<void> }).clearPWACache =
            clearPWACacheMock;

        render(
            <MemoryRouter>
                <SettingsView />
            </MemoryRouter>
        );

        // Switch to Tab 2 (Data & PWA)
        const dataTab = screen.getByRole('tab', { name: /Dữ liệu & PWA|Data & PWA/i });
        fireEvent.click(dataTab);

        const clearBtn = screen.getByRole('button', {
            name: /Xóa bộ nhớ đệm|Clear Cache/i,
        });

        // Step 1 click: arms confirmation, does not call clearPWACache yet
        fireEvent.click(clearBtn);
        expect(clearPWACacheMock).not.toHaveBeenCalled();
        expect(
            screen.getByRole('button', { name: /Bấm lần nữa để xóa Cache|Tap again to Clear Cache/i })
        ).toBeDefined();

        // Step 2 click: executes clearPWACache while keeping schedule data intact
        fireEvent.click(
            screen.getByRole('button', { name: /Bấm lần nữa để xóa Cache|Tap again to Clear Cache/i })
        );
        expect(clearPWACacheMock).toHaveBeenCalledTimes(1);
        expect(useScheduleStore.getState().data?.allCourses).toHaveLength(1);

        delete (window as unknown as { clearPWACache?: () => Promise<void> }).clearPWACache;
    });

    it('4. Info tab opens Period Standards and Changelog modals on demand and closes with Escape', () => {
        render(
            <MemoryRouter>
                <SettingsView />
            </MemoryRouter>
        );

        // Switch to Tab 3 (Info)
        const infoTab = screen.getByRole('tab', { name: /Thông tin|About & Info/i });
        fireEvent.click(infoTab);

        // Open Period Standards modal
        const periodsTrigger = screen.getByRole('button', {
            name: /Quy chuẩn thời gian tiết giảng|Standard Period Times/i,
        });
        fireEvent.click(periodsTrigger);
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(screen.getByText(/07:00 - 07:45/)).toBeDefined();

        // Close with Escape
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(screen.queryByRole('dialog')).toBeNull();

        // Open Changelog modal
        const changelogTrigger = screen.getByRole('button', {
            name: /Changelog/i,
        });
        fireEvent.click(changelogTrigger);
        expect(screen.getByRole('dialog')).toBeDefined();
    });
});
