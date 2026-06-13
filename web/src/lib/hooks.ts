import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { Paginated, SchoolClass, Subject, User } from './types';

export function useTeachers() {
  return useQuery({
    queryKey: ['lookup-teachers'],
    queryFn: async () =>
      (await api.get<Paginated<User>>('/users?role=GURU&limit=200')).data.data,
  });
}

export function useParents() {
  return useQuery({
    queryKey: ['lookup-parents'],
    queryFn: async () =>
      (await api.get<Paginated<User>>('/users?role=ORTU&limit=200')).data.data,
  });
}

export function useClasses() {
  return useQuery({
    queryKey: ['lookup-classes'],
    queryFn: async () =>
      (await api.get<Paginated<SchoolClass>>('/classes?limit=200')).data.data,
  });
}

export function useSubjects() {
  return useQuery({
    queryKey: ['lookup-subjects'],
    queryFn: async () => (await api.get<Subject[]>('/subjects')).data,
  });
}
