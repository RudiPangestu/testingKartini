import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { Button, Card, Empty, Loading } from '../components/ui';
import { colors, statusColor } from '../lib/theme';
import type { AttendanceStatus, Student } from '../lib/types';

interface Schedule {
  id: string;
  startTime: string;
  endTime: string;
  subject?: { name: string };
  class?: { id: string; name: string };
}
interface Session {
  id: string;
  schedule?: { class: { id: string; name: string }; subject: { name: string } } | null;
  records?: { studentId: string; status: AttendanceStatus; note: string | null }[];
}

const STATUSES: AttendanceStatus[] = ['HADIR', 'SAKIT', 'IZIN', 'ALPHA'];

export default function GuruAttendanceScreen() {
  const [scheduleId, setScheduleId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState<Session | null>(null);
  const [roster, setRoster] = useState<Student[]>([]);
  const [rows, setRows] = useState<Record<string, AttendanceStatus>>({});
  const [msg, setMsg] = useState('');

  const schedules = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => (await api.get<Schedule[]>('/schedules')).data,
  });

  const open = useMutation({
    mutationFn: async () => {
      const ses = (
        await api.post<Session>('/attendance/sessions', {
          sourceType: 'SCHEDULE',
          scheduleId,
          sessionDate: date,
        })
      ).data;
      const classId = ses.schedule?.class.id;
      const students = classId
        ? (await api.get<Student[]>(`/classes/${classId}/students`)).data
        : [];
      return { ses, students };
    },
    onSuccess: ({ ses, students }) => {
      const init: Record<string, AttendanceStatus> = {};
      for (const s of students) {
        init[s.id] =
          ses.records?.find((r) => r.studentId === s.id)?.status ?? 'HADIR';
      }
      setSession(ses);
      setRoster(students);
      setRows(init);
      setMsg('');
    },
    onError: (e) => setMsg(apiError(e)),
  });

  const save = useMutation({
    mutationFn: () =>
      api.put(`/attendance/sessions/${session!.id}`, {
        records: roster.map((s) => ({ studentId: s.id, status: rows[s.id] })),
      }),
    onSuccess: () =>
      setMsg('✅ Presensi tersimpan. Notifikasi terkirim ke orang tua.'),
    onError: (e) => setMsg(apiError(e)),
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.label}>Tanggal (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} />

        <Text style={[styles.label, { marginTop: 12 }]}>Pilih Jadwal</Text>
        {schedules.isLoading ? (
          <Loading />
        ) : (
          schedules.data?.map((s: Schedule) => {
            const active = s.id === scheduleId;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => {
                  setScheduleId(s.id);
                  setSession(null);
                }}
                style={[styles.schedRow, active && styles.schedActive]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '600' }}>
                  {s.subject?.name} · {s.class?.name}
                </Text>
                <Text style={{ color: active ? '#ffffffcc' : colors.muted, fontSize: 12 }}>
                  {s.startTime}–{s.endTime}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 12 }} />
        <Button
          title={open.isPending ? 'Membuka…' : 'Buka Sesi Presensi'}
          onPress={() => open.mutate()}
          disabled={!scheduleId || open.isPending}
        />
      </Card>

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      {session && (
        <Card>
          <Text style={styles.heading}>
            {session.schedule?.subject.name} — {session.schedule?.class.name}
          </Text>
          {roster.length === 0 ? (
            <Empty message="Kelas ini belum punya murid." />
          ) : (
            <>
              {roster.map((s) => (
                <View key={s.id} style={styles.studentRow}>
                  <Text style={{ fontWeight: '600', marginBottom: 6 }}>
                    {s.fullName}
                  </Text>
                  <View style={styles.statusRow}>
                    {STATUSES.map((st) => {
                      const active = rows[s.id] === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          onPress={() => setRows((p) => ({ ...p, [s.id]: st }))}
                          style={[
                            styles.statusBtn,
                            {
                              backgroundColor: active ? statusColor[st] : '#eee',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: active ? '#fff' : colors.muted,
                              fontSize: 12,
                              fontWeight: '700',
                            }}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              <View style={{ height: 12 }} />
              <Button
                title={save.isPending ? 'Menyimpan…' : 'Simpan Presensi'}
                onPress={() => save.mutate()}
                disabled={save.isPending}
              />
            </>
          )}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  schedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
    backgroundColor: '#fff',
  },
  schedActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  heading: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: colors.text },
  studentRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusRow: { flexDirection: 'row', gap: 6 },
  statusBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  msg: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: colors.text,
  },
});
