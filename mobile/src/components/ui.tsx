import { ReactNode } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { colors, statusColor } from '../lib/theme';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  disabled,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const bg =
    variant === 'primary'
      ? colors.brand
      : variant === 'danger'
        ? colors.red
        : '#fff';
  const fg = variant === 'ghost' ? colors.text : '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
        variant === 'ghost' && {
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={{ color: fg, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function StatusPill({ status }: { status: string }) {
  const c = statusColor[status] ?? colors.muted;
  return (
    <View style={[styles.pill, { backgroundColor: c + '22' }]}>
      <Text style={{ color: c, fontWeight: '700', fontSize: 12 }}>{status}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

export function Empty({ message }: { message: string }) {
  return (
    <View style={styles.center}>
      <Text style={{ color: colors.muted }}>{message}</Text>
    </View>
  );
}

export function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', minWidth: 90 }}>
      <Text style={{ fontSize: 11, color: colors.muted, textTransform: 'uppercase' }}>
        {label}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: color ?? colors.text }}>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  center: { padding: 32, alignItems: 'center', justifyContent: 'center' },
});
