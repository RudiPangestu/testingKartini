import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, Empty, Loading } from '../components/ui';
import { colors } from '../lib/theme';
import type { NotificationItem } from '../lib/types';

export default function NotificationsScreen() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<NotificationItem[]>('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (list.isLoading) return <Loading />;
  if (!list.data?.length) return <Empty message="Belum ada notifikasi." />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: 16 }}
      data={list.data}
      keyExtractor={(n) => n.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => !item.isRead && markRead.mutate(item.id)}
          activeOpacity={0.7}
        >
          <Card
            style={{
              marginBottom: 10,
              borderLeftWidth: 4,
              borderLeftColor: item.isRead ? colors.border : colors.brand,
            }}
          >
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              {!item.isRead && <View style={styles.dot} />}
            </View>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>
              {new Date(item.sentAt).toLocaleString('id-ID')}
            </Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontWeight: '700', color: colors.text, flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginLeft: 8,
  },
  body: { color: colors.text, marginTop: 4 },
  time: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
