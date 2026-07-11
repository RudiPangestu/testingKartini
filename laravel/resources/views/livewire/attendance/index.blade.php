<div>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Presensi</h1>
        <p class="text-sm text-gray-500">Catat kehadiran per jadwal & tanggal</p>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    <div class="mb-5 flex flex-wrap items-end gap-3">
        <div>
            <label class="mb-1 block text-sm font-medium">Jadwal</label>
            <select wire:model.live="scheduleId" class="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">— Pilih jadwal —</option>
                @foreach ($schedules as $s)
                    <option value="{{ $s->id }}">{{ $s->schoolClass?->name }} · {{ $s->subject?->name }} · {{ $s->day_of_week->value }} {{ $s->start_time }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="mb-1 block text-sm font-medium">Tanggal</label>
            <input wire:model.live="date" type="date" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
        </div>
    </div>

    @if ($scheduleId && $students->isNotEmpty())
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                        <th class="px-4 py-3">NISN</th>
                        <th class="px-4 py-3">Nama</th>
                        <th class="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach ($students as $st)
                        <tr wire:key="att-{{ $st->id }}">
                            <td class="px-4 py-2 text-gray-500">{{ $st->nisn }}</td>
                            <td class="px-4 py-2 font-medium">{{ $st->full_name }}</td>
                            <td class="px-4 py-2">
                                <div class="flex gap-1">
                                    @foreach (['HADIR' => 'H', 'SAKIT' => 'S', 'IZIN' => 'I', 'ALPHA' => 'A'] as $val => $lbl)
                                        <button type="button" wire:click="$set('statuses.{{ $st->id }}', '{{ $val }}')"
                                                class="h-8 w-8 rounded-lg border text-xs font-semibold
                                                {{ ($statuses[$st->id] ?? 'HADIR') === $val
                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50' }}">
                                            {{ $lbl }}
                                        </button>
                                    @endforeach
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="mt-4 flex justify-end">
            <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan Presensi</button>
        </div>
    @elseif ($scheduleId)
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Tidak ada murid di kelas jadwal ini.</div>
    @else
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Pilih jadwal untuk mulai presensi.</div>
    @endif
</div>
