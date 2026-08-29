import { describe, it, expect } from 'vitest';
import { normalizeTeacherName } from './schedule.utils';

describe('schedule.utils', () => {
    describe('normalizeTeacherName', () => {
        it('handles empty or falsy inputs', () => {
            expect(normalizeTeacherName('')).toBe('');
            expect(normalizeTeacherName(undefined as unknown as string)).toBe('');
            expect(normalizeTeacherName(null as unknown as string)).toBe('');
        });

        it('converts text to lowercase', () => {
            expect(normalizeTeacherName('ABC')).toBe('abc');
            expect(normalizeTeacherName('MiXeD cAsE')).toBe('mixed case');
        });

        it('removes Vietnamese diacritics (tones)', () => {
            expect(normalizeTeacherName('Nguyễn Văn A')).toBe('nguyen van a');
            expect(normalizeTeacherName('Đặng Thái Sơn')).toBe('đang thai son');
            expect(normalizeTeacherName('Lê Thị Hồng Ngọc')).toBe('le thi hong ngoc');
        });

        it('removes specific academic titles', () => {
            // Note: the titles in code are: ths., ts., pgs., gs., gv.
            expect(normalizeTeacherName('ths. nguyen van a')).toBe('nguyen van a');
            expect(normalizeTeacherName('ts. tran b')).toBe('tran b');
            expect(normalizeTeacherName('pgs. le c')).toBe('le c');
            expect(normalizeTeacherName('gs. pham d')).toBe('pham d');
            expect(normalizeTeacherName('gv. hoang e')).toBe('hoang e');
        });

        it('handles multiple titles in combinations', () => {
            // pgs. ts. -> both should be removed
            expect(normalizeTeacherName('pgs. ts. le c')).toBe('le c');
            expect(normalizeTeacherName('gs. ts. pham d')).toBe('pham d');
        });

        it('leaves strings without titles/diacritics unchanged', () => {
            expect(normalizeTeacherName('john doe')).toBe('john doe');
            expect(normalizeTeacherName('smith')).toBe('smith');
        });

        it('handles a combination of titles, diacritics, and mixed casing', () => {
            expect(normalizeTeacherName('ThS. Nguyễn Văn A')).toBe('nguyen van a');
            expect(normalizeTeacherName('PGS. TS. Trần Xuân Bách')).toBe('tran xuan bach');
            expect(normalizeTeacherName('GV. Lê Đại Hành')).toBe('le đai hanh');
        });

        it('trims whitespace around the name', () => {
            expect(normalizeTeacherName('   Nguyễn Văn A   ')).toBe('nguyen van a');
            expect(normalizeTeacherName('ThS.   Trần B  ')).toBe('tran b');
        });
    });
});
