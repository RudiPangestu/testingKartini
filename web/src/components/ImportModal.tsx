import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, apiError, downloadFile } from '../lib/api';
import { useToast } from './Toast';
import { Modal } from './ui';
import type { ImportResult } from '../lib/types';

export type ImportEntity = 'classes' | 'subjects' | 'students' | 'parents';

interface Props {
  open: boolean;
  onClose: () => void;
  entity: ImportEntity;
  title: string;
  columns: string[];
  note?: string;
  onDone: () => void;
}

export default function ImportModal({
  open,
  onClose,
  entity,
  title,
  columns,
  note,
  onDone,
}: Props) {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const imp = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('file', file as File);
      return (await api.post<ImportResult>(`/import/${entity}`, fd)).data;
    },
    onSuccess: (data) => {
      setResult(data);
      onDone();
      toast.push('success', `Impor selesai — ${data.created} data baru`);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const close = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal open={open} title={title} onClose={close}>
      <div className="space-y-4 text-sm">
        <div className="rounded-lg bg-blue-50 p-3 text-blue-800">
          <p className="font-medium">Cara pakai:</p>
          <ol className="ml-4 list-decimal space-y-0.5">
            <li>Unduh template, isi datanya di Excel / Google Sheets.</li>
            <li>
              Simpan sebagai <b>.xlsx</b> lalu unggah di bawah ini.
            </li>
          </ol>
          <p className="mt-2">
            Kolom: <b>{columns.join(' · ')}</b>
          </p>
          {note && <p className="mt-1 text-blue-700">{note}</p>}
        </div>

        <button
          type="button"
          className="btn-ghost w-full"
          onClick={() =>
            downloadFile(`/import/template/${entity}`, `template-${entity}.xlsx`)
          }
        >
          ⬇ Unduh Template Excel
        </button>

        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />

        {result && (
          <div className="rounded-lg border p-3">
            <p className="font-medium text-gray-800">Hasil impor</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-green-700">✔ {result.created} dibuat</span>
              <span className="text-gray-500">
                ↷ {result.skipped} dilewati (duplikat)
              </span>
              {result.linked !== undefined && (
                <span className="text-blue-700">🔗 {result.linked} tautan</span>
              )}
              <span className={result.errors.length ? 'text-red-600' : 'text-gray-400'}>
                ✖ {result.errors.length} gagal
              </span>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-2 max-h-40 space-y-0.5 overflow-y-auto rounded bg-red-50 p-2 text-xs text-red-700">
                {result.errors.map((er, i) => (
                  <div key={i}>
                    Baris {er.row}: {er.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={close}>
            Tutup
          </button>
          <button
            className="btn-primary"
            disabled={!file || imp.isPending}
            onClick={() => imp.mutate()}
          >
            {imp.isPending ? 'Mengimpor…' : 'Impor'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
