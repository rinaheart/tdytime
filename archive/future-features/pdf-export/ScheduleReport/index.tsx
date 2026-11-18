import React from 'react';
import { Document, Page, Text, View, Font, Svg, Path, Rect } from '@react-pdf/renderer';
import { styles } from './styles';
import type { FlatSession } from '@/core/schedule/schedule.index';

import RobotoRegular from '@/assets/fonts/Roboto-Regular.ttf';
import RobotoBold from '@/assets/fonts/Roboto-Bold.ttf';

// Register font for Vietnamese support
Font.register({
  family: 'Roboto',
  fonts: [
    { src: RobotoRegular, fontWeight: 400 },
    { src: RobotoBold, fontWeight: 700 }
  ]
});

export interface ScheduleReportProps {
  mode: 'week' | 'semester';
  sessions: FlatSession[];
  weekRange?: string;
  teacherName?: string;
  notes?: Record<string, string>;
  title?: string;
  translations: {
    university: string;
    titleWeek: string;
    titleSemester: string;
    teacher: string;
    defaultReport: string;
    noSchedule: string;
    class: string;
    room: string;
    personalNote: string;
    semesterTotal: string;
    periods: string;
    createdBy: string;
    page: string;
    week: string;
    weekFrom: string;
    weekTo: string;
    shifts: Record<string, string>;
    days: Record<string, string>;
  };
}

// Inline SVG for the logo, representing favicon.svg to avoid CDN/CORS issues
const LogoSvg = () => (
  <Svg width="40" height="40" viewBox="84 84 344 344">
    <Rect x="96" y="108" width="320" height="308" rx="48" fill="#fff" stroke="#0358d5" strokeWidth="24" />
    <Path d="M96 168h320M190 96v25m132-25v25" stroke="#0358d5" strokeWidth="24" strokeLinecap="round" />
    <Path d="M203 246h106m-53 0v100" stroke="#0358d5" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
    <Rect x="306" y="338" width="28" height="28" rx="6" fill="#ba1a1a" />
  </Svg>
);

export const ScheduleReport: React.FC<ScheduleReportProps> = ({
  mode,
  sessions,
  weekRange,
  teacherName,
  notes = {},
  title,
  translations,
}) => {
  const defaultTitle = mode === 'week' ? translations.titleWeek : translations.titleSemester;
  const finalTitle = title || defaultTitle;
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  
  const formattedWeekRange = React.useMemo(() => {
    if (!weekRange) return '';
    const dates = weekRange.match(/(\d{2}\/\d{2}\/\d{4})/g);
    if (dates && dates.length >= 2) {
      return `${translations.weekFrom} ${dates[0]} ${translations.weekTo} ${dates[1]}`;
    }
    return weekRange;
  }, [weekRange, translations.weekFrom, translations.weekTo]);

  // Group sessions by day
  const groupedByDay = sessions.reduce((acc, session) => {
    const key = `${session.dayIdx}-${session.dateStr}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, FlatSession[]>);

  // Sort keys by dayIdx
  const sortedDays = Object.keys(groupedByDay).sort((a, b) => {
    const aIdx = parseInt(a.split('-')[0]);
    const bIdx = parseInt(b.split('-')[0]);
    return aIdx - bIdx;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LogoSvg />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.universityName}>{translations.university}</Text>
            <Text style={styles.reportTitle}>{finalTitle}</Text>
            <Text style={styles.reportSubtitle}>
              {teacherName ? `${translations.teacher}: ${teacherName}` : translations.defaultReport}
              {weekRange ? ` | ${formattedWeekRange}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          {sortedDays.length === 0 ? (
            <Text style={styles.infoText}>{translations.noSchedule}</Text>
          ) : (
            sortedDays.map((dayKey) => {
              const daySessions = groupedByDay[dayKey];
              const firstSession = daySessions[0];

              return (
                <View key={dayKey} wrap={false}>
                  <Text style={styles.dayHeader}>
                    {translations.days[firstSession.dayIdx.toString()] || firstSession.dayIdx} - {firstSession.dateStr}
                  </Text>
                  {daySessions.map((session) => {
                    const note = notes[session.id];
                    return (
                      <View key={session.id} style={styles.sessionRow}>
                        <View style={styles.timeCol}>
                          <Text style={styles.timeText}>{session.timeRangeStr}</Text>
                          <Text style={styles.shiftText}>{translations.shifts[session.shift] || session.shift}</Text>
                        </View>
                        <View style={styles.detailsCol}>
                          <Text style={styles.courseName}>{session.courseName}</Text>
                          <Text style={styles.infoText}>{translations.class}: {session.className} | {translations.room}: {session.room}</Text>
                          {note && (
                            <View style={styles.noteContainer}>
                              <Text style={styles.noteText}>{translations.personalNote}: {note}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          {mode === 'semester' && sessions.length > 0 && (
            <View wrap={false} style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{translations.semesterTotal}</Text>
              <Text style={styles.grandTotalValue}>
                {sessions.reduce((sum, s) => sum + (s.periodCount || 0), 0)} {translations.periods}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{translations.createdBy} - {dateStr}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${translations.page} ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
};
