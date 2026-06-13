import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useChild } from '../lib/child';
import ChildPicker, { useMyStudents } from '../components/ChildPicker';
import { Card, Empty, Loading, StatusPill } from '../components/ui';
import { colors } from '../lib/theme';
import type { AttendanceHistoryItem, ReportResult, Student } from '../lib/types';

export default function HomeScreen() {
  const students = useMyStudents();
  const studentId = useChild((s) => s.studentId);
  const current = students.data?.find((s: Student) => s.id === studentId);

  const report = useQuery({
    queryKey: ['home-report', studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (
        await api.get<ReportResult>(
          `/reports/student/${studentId}?period=semester`,
        )
      ).data,
  });

  const history = useQuery({
    queryKey: ['home-history', studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (
        await api.get<AttendanceHistoryItem[]>(`/attendance/student/${studentId}`)
      ).data,
  });

  if (students.isLoading) return <Loading />;
  if (!students.data?.length)
    return <Empty message="Belum ada data murid tertaut ke akun Anda." />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <ChildPicker students={students.data} />

      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.name}>{current?.fullName}</Text>
        <Text style={styles.muted}>
          {current?.class?.name ?? 'Tanpa kelas'} · NISN {current?.nisn}
        </Text>
      </Card>

      <Text style={styles.section}>Ringkasan Semester Ini</Text>
      {report.data ? (
        <View style={styles.metricsRow}>
          <Mini label="Hadir Efektif" value={`${report.data.hadirEfektifPct}%`} color={colors.green} />
          <Mini label="Kehadiran Sah" value={`${report.data.kehadiranSahPct}%`} color={colors.brand} />
          <Mini label="Alpha" value={`${report.data.alphaPct}%`} color={colors.red} />
        </View>
      ) : (
        <Card><Text style={styles.muted}>Belum ada data.</Text></Card>
      )}

      <Text style={styles.section}>Riwayat Kehadiran Terbaru</Text>
      {history.isLoading ? (
        <Loading />
      ) : !history.data?.length ? (
        <Card><Text style={styles.muted}>Belum ada riwayat.</Text></Card>
      ) : (
        history.data.slice(0, 20).map((h: AttendanceHistoryItem) => (
          <Card key={h.id} style={styles.histItem}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>
                {h.session.schedule?.subject.name ??
                  h.session.event?.title ??
                  'Kegiatan'}
              </Text>
              <Text style={styles.muted}>
                {h.session.sessionDate.slice(0, 10)}
                {h.note ? ` · ${h.note}` : ''}
              </Text>
            </View>
            <StatusPill status={h.status} />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 10, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color }}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700', marginVertical: 10, color: colors.text },
  metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  histItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});
