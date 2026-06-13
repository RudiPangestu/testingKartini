import { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useChild } from '../lib/child';
import { colors } from '../lib/theme';
import type { Student } from '../lib/types';

export function useMyStudents() {
  return useQuery({
    queryKey: ['my-students'],
    queryFn: async () => (await api.get<Student[]>('/students/mine')).data,
  });
}

export default function ChildPicker({ students }: { students: Student[] }) {
  const { studentId, setStudentId } = useChild();

  useEffect(() => {
    if (!studentId && students.length > 0) {
      setStudentId(students[0].id);
    }
  }, [students, studentId, setStudentId]);

  if (students.length <= 1) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 12 }}
    >
      {students.map((s) => {
        const active = s.id === studentId;
        return (
          <TouchableOpacity
            key={s.id}
            onPress={() => setStudentId(s.id)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              marginRight: 8,
              backgroundColor: active ? colors.brand : '#fff',
              borderWidth: 1,
              borderColor: active ? colors.brand : colors.border,
            }}
          >
            <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '600' }}>
              {s.fullName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
