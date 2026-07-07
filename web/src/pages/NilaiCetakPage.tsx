import { Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { GradeBookFull } from '../lib/types';

const SEKOLAH = {
  nama: 'SMA KARTINI BATAM',
  alamat: 'Jl. Budi Kemuliaan No. 1 Kampung Seraya - Batam',
};

export default function NilaiCetakPage() {
  const [params] = useSearchParams();
  const bookId = params.get('bookId') ?? '';

  const q = useQuery({
    queryKey: ['grade-book-cetak', bookId],
    enabled: !!bookId,
    queryFn: async () =>
      (await api.get<GradeBookFull>(`/grades/book/${bookId}`)).data,
  });

  const full = q.data;
  const kds = full?.book.kds ?? [];

  return (
    <div className="cetak-root">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        .cetak-root { font-family: 'Times New Roman', Georgia, serif; color: #000; background: #f3f4f6; }
        .toolbar { padding: 12px; text-align: center; }
        .page { background: #fff; width: 277mm; min-height: 190mm; margin: 12px auto; padding: 10mm;
          box-sizing: border-box; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
        .tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
        .tbl th, .tbl td { border: 1px solid #000; padding: 3px 5px; }
        .tbl th { text-align: center; font-weight: bold; }
        .tbl td.c { text-align: center; }
        .head { display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; }
        .ttd { display:flex; justify-content:space-between; margin-top:24px; font-size:12px; }
        .ttd > div { text-align:center; width:45%; }
        .sign-space { height:60px; }
        @media print {
          .cetak-root { background:#fff; }
          .toolbar { display:none; }
          .page { margin:0; box-shadow:none; width:auto; min-height:auto; padding:0; }
        }
      `}</style>

      <div className="toolbar">
        <button
          onClick={() => window.print()}
          style={{
            background: '#0d6e4e', color: '#fff', border: 0, padding: '10px 20px',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Cetak / Simpan sebagai PDF
        </button>
      </div>

      {!bookId ? (
        <div className="page">Parameter buku nilai tidak ada.</div>
      ) : q.isLoading || !full ? (
        <div className="page">Memuat…</div>
      ) : (
        <div className="page">
          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 16 }}>
            DAFTAR NILAI (DAFLAI)
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>
            {SEKOLAH.nama} — {SEKOLAH.alamat}
          </div>

          <div className="head">
            <span>Mata Pelajaran : {full.book.subject?.name ?? '—'}</span>
            <span>Kelas : {full.book.class?.name ?? '—'}</span>
            <span>Cawu : {full.book.cawu}</span>
            <span>Tahun Pelajaran : {full.book.academicYear}</span>
            <span>KKM : {full.book.kkm}</span>
          </div>

          <table className="tbl">
            <thead>
              <tr>
                <th rowSpan={2}>No</th>
                <th rowSpan={2}>NIS</th>
                <th rowSpan={2}>Nama Siswa</th>
                {kds.map((k) => (
                  <th key={k.id} colSpan={3}>
                    KD {k.nomor}
                  </th>
                ))}
                <th rowSpan={2}>NR</th>
                <th rowSpan={2}>Pred.</th>
              </tr>
              <tr>
                {kds.map((k) => (
                  <Fragment key={k.id}>
                    <th>Peng.</th>
                    <th>Prak.</th>
                    <th>KD</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {full.summary.map((row, i) => (
                <tr key={row.studentId}>
                  <td className="c">{i + 1}</td>
                  <td className="c">{row.nis ?? row.nisn}</td>
                  <td>{row.fullName}</td>
                  {kds.map((k) => {
                    const r = row.kd.find((x) => x.kdId === k.id);
                    return (
                      <Fragment key={k.id}>
                        <td className="c">{r?.naPengetahuan ?? ''}</td>
                        <td className="c">{r?.naPraktek ?? ''}</td>
                        <td className="c">{r?.nilaiKd ?? ''}</td>
                      </Fragment>
                    );
                  })}
                  <td className="c" style={{ fontWeight: 700 }}>
                    {row.nr ?? ''}
                  </td>
                  <td className="c">{row.predikat ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 12 }}>
            <span>A. Daya Serap Siswa : {full.stats.dayaSerap ?? '—'}%</span>
            <span>B. Target Kurikulum : {full.stats.targetKurikulum ?? '—'}%</span>
            <span>C. Rata-rata Kelas : {full.stats.rataKelas ?? '—'}</span>
          </div>

          <div className="ttd">
            <div>
              <div>Mengetahui,</div>
              <div>Kepala Sekolah</div>
              <div className="sign-space" />
              <div>(………………………………)</div>
            </div>
            <div>
              <div>Batam, ……………………………</div>
              <div>Guru Mata Pelajaran</div>
              <div className="sign-space" />
              <div>({full.book.teacher?.fullName ?? '…………………'})</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
