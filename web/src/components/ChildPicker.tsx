import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useChild } from '../lib/child';
import type { Student } from '../lib/types';

/** Murid milik user login (ORTU: anak-anaknya, MURID: dirinya). */
export function useMyStudents() {
  return useQuery({
    queryKey: ['my-students'],
    queryFn: async () => (await api.get<Student[]>('/students/mine')).data,
  });
}

/**
 * Pemilih anak untuk orang tua dengan lebih dari satu anak. Saat hanya ada
 * satu murid (atau akun MURID), komponen otomatis memilihnya tanpa menampilkan
 * tombol apa pun.
 */
export default function ChildPicker({ students }: { students: Student[] }) {
  const { studentId, setStudentId } = useChild();

  useEffect(() => {
    if (!studentId && students.length > 0) {
      setStudentId(students[0].id);
    }
  }, [students, studentId, setStudentId]);

  if (students.length <= 1) return null;

  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {students.map((s) => {
        const active = s.id === studentId;
        return (
          <button
            key={s.id}
            onClick={() => setStudentId(s.id)}
            className={
              'rounded-full border px-4 py-2 text-sm font-semibold transition-colors ' +
              (active
                ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50')
            }
          >
            {s.fullName}
          </button>
        );
      })}
    </div>
  );
}
