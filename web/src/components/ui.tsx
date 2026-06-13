import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-3">
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-600" />
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center text-sm text-gray-400">{message}</div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  HADIR: 'bg-green-100 text-green-700',
  SAKIT: 'bg-yellow-100 text-yellow-700',
  IZIN: 'bg-blue-100 text-blue-700',
  ALPHA: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={'badge ' + (STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-600')}>
      {status}
    </span>
  );
}
