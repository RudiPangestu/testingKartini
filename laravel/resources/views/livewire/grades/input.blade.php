<div>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
            <a href="{{ route('grades') }}" class="text-sm text-emerald-700 hover:underline">← Buku Nilai</a>
            <h1 class="mt-1 text-xl font-bold tracking-tight text-gray-900">
                {{ $book->subject?->name }} — {{ $book->schoolClass?->name }}
            </h1>
            <p class="text-sm text-gray-500">Cawu {{ $book->cawu }} · Tahun {{ $book->academic_year }} · KKM {{ $book->kkm }}</p>
        </div>
        <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Simpan Nilai
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    {{-- Statistik --}}
    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold">{{ $stats['jumlahSiswa'] }}</div><div class="text-xs text-gray-500">Siswa</div></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold">{{ $stats['rataKelas'] ?? '—' }}</div><div class="text-xs text-gray-500">Rata Kelas (Daya Serap)</div></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold">{{ $stats['jumlahTuntas'] }}/{{ $stats['jumlahSiswa'] }}</div><div class="text-xs text-gray-500">Tuntas</div></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold">{{ $stats['targetKurikulum'] !== null ? $stats['targetKurikulum'].'%' : '—' }}</div><div class="text-xs text-gray-500">Target Kurikulum</div></div>
    </div>

    {{-- Manajemen KD --}}
    <div class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="mb-2 text-sm font-medium">Kompetensi Dasar (KD)</h3>
        <div class="flex flex-wrap gap-2">
            @foreach ($book->kds as $kd)
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs" wire:key="kd-{{ $kd->id }}">
                    KD.{{ $kd->nomor }}@if ($kd->deskripsi) — {{ \Illuminate\Support\Str::limit($kd->deskripsi, 30) }}@endif
                    <button wire:click="removeKd('{{ $kd->id }}')" wire:confirm="Hapus KD.{{ $kd->nomor }} & nilainya?" class="ml-1 text-gray-500 hover:text-red-600">×</button>
                </span>
            @endforeach
        </div>
        <div class="mt-3 flex flex-wrap items-end gap-2">
            <div>
                <label class="mb-1 block text-xs text-gray-500">Nomor</label>
                <input wire:model="newKdNomor" type="number" min="1" max="20" class="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm">
            </div>
            <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">Deskripsi (opsional)</label>
                <input wire:model="newKdDeskripsi" type="text" class="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm">
            </div>
            <button wire:click="addKd" class="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50">+ Tambah KD</button>
        </div>
        @error('newKdNomor') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
    </div>

    {{-- Grid nilai --}}
    @if ($book->kds->isEmpty())
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            Tambahkan KD dulu untuk mulai input nilai.
        </div>
    @else
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500">
                    <tr>
                        <th class="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left">Nama</th>
                        @foreach ($book->kds as $kd)
                            <th class="border-l px-2 py-2 text-center" colspan="3">KD.{{ $kd->nomor }}</th>
                        @endforeach
                        <th class="border-l px-3 py-2 text-center">NR</th>
                        <th class="px-2 py-2 text-center">Pred</th>
                        <th class="px-2 py-2 text-center">Tuntas</th>
                    </tr>
                    <tr>
                        <th class="sticky left-0 z-10 bg-gray-50 px-3 py-1"></th>
                        @foreach ($book->kds as $kd)
                            <th class="border-l px-1 py-1 text-center font-normal">P</th>
                            <th class="px-1 py-1 text-center font-normal">Pr</th>
                            <th class="px-1 py-1 text-center font-normal text-gray-400">KD</th>
                        @endforeach
                        <th class="border-l"></th><th></th><th></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach ($students as $st)
                        @php $row = $summary[$st->id]; @endphp
                        <tr wire:key="row-{{ $st->id }}">
                            <td class="sticky left-0 z-10 bg-white px-3 py-1 font-medium whitespace-nowrap">{{ $st->full_name }}</td>
                            @foreach ($book->kds as $kd)
                                <td class="border-l px-1 py-1">
                                    <input wire:model.blur="scores.{{ $kd->id }}.{{ $st->id }}.PENGETAHUAN" type="number" min="0" max="100"
                                           class="w-14 rounded border border-gray-200 px-1 py-0.5 text-center">
                                </td>
                                <td class="px-1 py-1">
                                    <input wire:model.blur="scores.{{ $kd->id }}.{{ $st->id }}.PRAKTEK" type="number" min="0" max="100"
                                           class="w-14 rounded border border-gray-200 px-1 py-0.5 text-center">
                                </td>
                                <td class="px-1 py-1 text-center text-gray-400">{{ $row['cells'][$kd->id] ?? '—' }}</td>
                            @endforeach
                            <td class="border-l px-3 py-1 text-center font-semibold">{{ $row['nr'] ?? '—' }}</td>
                            <td class="px-2 py-1 text-center">{{ $row['predikat'] ?? '—' }}</td>
                            <td class="px-2 py-1 text-center">
                                @if ($row['tuntas'] === true)<span class="text-emerald-600">✔</span>
                                @elseif ($row['tuntas'] === false)<span class="text-red-500">✗</span>
                                @else —@endif
                            </td>
                        </tr>
                    @endforeach
                    @if ($students->isEmpty())
                        <tr><td colspan="99" class="px-4 py-8 text-center text-gray-400">Belum ada murid di kelas ini.</td></tr>
                    @endif
                </tbody>
            </table>
        </div>
        <p class="mt-2 text-xs text-gray-400">P = Pengetahuan, Pr = Praktek. Nilai KD = rata-rata komponen terisi; NR = rata-rata Nilai KD. Predikat A≥86 · B≥71 · C≥56 · D&lt;56.</p>
    @endif
</div>
