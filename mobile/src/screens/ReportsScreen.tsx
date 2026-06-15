import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useChild } from '../lib/child';
import ChildPicker, { useMyStudents } from '../components/ChildPicker';
import { Card, Empty, Loading, Metric } from '../components/ui';
import { colors } from '../lib/theme';
import type { ReportResult } from '../lib/types';

const PERIODS: { value: string; label: string }[] = [
  { value: 'triwulan', label: 'Triwulan' },
  { value: 'semester', label: 'Semester' },
  { value: 'year', label: 'Tahunan' },
];

export default function ReportsScreen() {
  const students = useMyStudents();
  const studentId = useChild((s) => s.studentId);
  const [period, setPeriod] = useState('semester');

  const report = useQuery({
    queryKey: ['report', studentId, period],
    enabled: !!studentId,
    queryFn: async () =>
      (
        await api.get<ReportResult>(
          `/reports/student/${studentId}?period=${period}`,
        )
      ).data,
  });

  if (students.isLoading) return <Loading />;
  if (!students.data?.length)
    return <Empty message="Belum ada data murid tertaut." />;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <ChildPicker students={students.data} />

      <View style={styles.tabs}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.value}
            onPress={() => setPeriod(p.value)}
            style={[
              styles.tab,
              period === p.value && { backgroundColor: colors.brand },
            ]}
          >
            <Text
              style={{
                color: period === p.value ? '#fff' : colors.text,
                fontWeight: '600',
              }}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {report.isLoading ? (
        <Loading />
      ) : report.data ? (
        <>
          {report.data.range && (
            <Text style={styles.range}>
              {report.data.range.start} → {report.data.range.end}
            </Text>
          )}
          <ProportionBar
            hadir={report.data.hadir}
            sakit={report.data.sakit}
            izin={report.data.izin}
            alpha={report.data.alpha}
            total={report.data.total}
          />
          <View style={styles.row}>
            <Metric label="Hadir Efektif" value={`${report.data.hadirEfektifPct}%`} color={colors.green} />
            <Metric label="Kehadiran Sah" value={`${report.data.kehadiranSahPct}%`} color={colors.brand} />
            <Metric label="Alpha" value={`${report.data.alphaPct}%`} color={colors.red} />
          </View>
          <View style={styles.row}>
            <Metric label="Hadir" value={report.data.hadir} color={colors.green} />
            <Metric label="Sakit" value={report.data.sakit} color={colors.yellow} />
            <Metric label="Izin" value={report.data.izin} color={colors.blue} />
            <Metric label="Alpha" value={report.data.alpha} color={colors.red} />
          </View>
          <Card style={{ marginTop: 8 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              Sakit &amp; Izin tidak dihitung sebagai Alpha. "Kehadiran Sah"
              mencakup Hadir + Sakit + Izin.
            </Text>
          </Card>
        </>
      ) : (
        <Empty message="Belum ada data." />
      )}
    </ScrollView>
  );
}

// Bar proporsi Hadir/Sakit/Izin/Alpha (tanpa library chart).
function ProportionBar(props: {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}) {
  if (props.total === 0) return null;
  const seg = [
    { v: props.hadir, c: colors.green },
    { v: props.sakit, c: colors.yellow },
    { v: props.izin, c: colors.blue },
    { v: props.alpha, c: colors.red },
  ].filter((s) => s.v > 0);
  return (
    <View
      style={{
        flexDirection: 'row',
        height: 14,
        borderRadius: 999,
        overflow: 'hidden',
        marginBottom: 12,
      }}
    >
      {seg.map((s, i) => (
        <View key={i} style={{ flex: s.v, backgroundColor: s.c }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  range: { color: colors.muted, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 8 },
});
