import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, Empty, Loading } from '../components/ui';
import { colors } from '../lib/theme';
import type { SchoolEvent } from '../lib/types';

export default function EventsScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const events = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: async () =>
      (await api.get<SchoolEvent[]>(`/events?from=${today}`)).data,
  });

  if (events.isLoading) return <Loading />;
  if (!events.data?.length)
    return <Empty message="Belum ada kegiatan mendatang." />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: 16 }}
      data={events.data}
      keyExtractor={(e) => e.id}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: 10 }}>
          <View style={styles.dateRow}>
            <Text style={styles.date}>{item.eventDate.slice(0, 10)}</Text>
            <Text style={styles.time}>
              {item.startTime}–{item.endTime}
            </Text>
          </View>
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? (
            <Text style={styles.muted}>{item.description}</Text>
          ) : null}
          <Text style={styles.meta}>
            {item.location ? `📍 ${item.location}  ` : ''}
            {item.targetClass?.name
              ? `· Kelas ${item.targetClass.name}`
              : '· Semua kelas'}
          </Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: colors.brand, fontWeight: '700' },
  time: { color: colors.muted },
  title: { fontSize: 16, fontWeight: '700', marginTop: 4, color: colors.text },
  muted: { color: colors.muted, marginTop: 2 },
  meta: { color: colors.muted, marginTop: 6, fontSize: 12 },
});
