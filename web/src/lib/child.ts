import { create } from 'zustand';

// Murid yang sedang dilihat (untuk ortu dengan >1 anak, atau murid itu sendiri).
interface ChildState {
  studentId: string | null;
  setStudentId: (id: string) => void;
}

export const useChild = create<ChildState>((set) => ({
  studentId: null,
  setStudentId: (id) => set({ studentId: id }),
}));
