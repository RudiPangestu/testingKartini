<div>
    @php $ch = ['HADIR' => '•', 'SAKIT' => 'S', 'IZIN' => 'I', 'ALPHA' => 'A']; @endphp
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Daftar Hadir</h1>
        <p class="text-sm text-gray-500">Rekap matriks kehadiran tatap muka per kelas</p>
    </div>

    <div class="mb-4">
        <select wire:model.live="classId" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Pilih kelas —</option>
            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
        </select>
    </div>

    @if ($classId && $students->isNotEmpty())
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500">
                    <tr>
                        <th class="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left">Nama</th>
                        @foreach ($sessions as $i => $sess)
                            <th class="border-l px-2 py-2 text-center" title="{{ $sess->session_date?->format('d/m/Y') }}">{{ $i + 1 }}</th>
                        @endforeach
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach ($students as $st)
                        <tr wire:key="dh-{{ $st->id }}">
                            <td class="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium whitespace-nowrap">{{ $st->full_name }}</td>
                            @foreach ($sessions as $sess)
                                @php $stat = $matrix[$st->id][$sess->id] ?? null; @endphp
                                <td class="border-l px-2 py-1.5 text-center {{ $stat === 'ALPHA' ? 'text-red-600 font-semibold' : 'text-gray-700' }}">
                                    {{ $stat ? ($ch[$stat] ?? '?') : '' }}
                                </td>
                            @endforeach
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <p class="mt-2 text-xs text-gray-400">• = Hadir · S = Sakit · I = Izin · A = Alpha. Kolom = pertemuan (urut tanggal).</p>
    @elseif ($classId)
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada murid / sesi presensi untuk kelas ini.</div>
    @else
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Pilih kelas untuk melihat matriks.</div>
    @endif
</div>
