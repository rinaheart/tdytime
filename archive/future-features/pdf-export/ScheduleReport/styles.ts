import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 15,
  },
  headerTextContainer: {
    flex: 1,
  },
  universityName: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  reportSubtitle: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  section: {
    marginBottom: 15,
  },
  dayHeader: {
    backgroundColor: '#f1f5f9',
    padding: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginTop: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timeCol: {
    width: '20%',
    paddingRight: 10,
  },
  detailsCol: {
    width: '80%',
  },
  timeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
  },
  shiftText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  courseName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 1,
  },
  noteContainer: {
    marginTop: 4,
    padding: 4,
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 2,
    borderLeftColor: '#22c55e',
  },
  noteText: {
    fontSize: 8,
    color: '#166534',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    marginTop: 15,
    borderRadius: 4,
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
