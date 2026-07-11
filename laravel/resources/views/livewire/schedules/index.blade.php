<div>
    @php $days = ['SEN' => 'Senin', 'SEL' => 'Selasa', 'RAB' => 'Rabu', 'KAM' => 'Kamis', 'JUM' => 'Jumat', 'SAB' => 'Sabtu']; @endphp
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Jadwal</h1>
            <p class="text-sm text-gray-500">Jadwal pelajaran per kelas</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Jadwal
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif
    @if (session('err'))<div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ session('err') }}</div>@endif

    <div class="mb-4">
        <select wire:model.live="classFilter" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Semua Kelas</option>
            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
        </select>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Hari</th>
                    <th class="px-4 py-3">Waktu</th>
                    <th class="px-4 py-3">Mapel</th>
                    <th class="px-4 py-3">Kelas</th>
                    <th class="px-4 py-3">Guru</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($schedules as $s)
                    <tr class="hover:bg-gray-50" wire:key="sc-{{ $s->id }}">
                        <td class="px-4 py-3 font-medium">{{ $days[$s->day_of_week->value] ?? $s->day_of_week->value }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $s->start_time }}–{{ $s->end_time }}</td>
                        <td class="px-4 py-3">{{ $s->subject?->name }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $s->schoolClass?->name }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $s->teacher?->full_name }}</td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('{{ $s->id }}')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('{{ $s->id }}')" wire:confirm="Hapus jadwal ini?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada jadwal.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $schedules->links() }}</div>

    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">{{ $editingId ? 'Edit Jadwal' : 'Tambah Jadwal' }}</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Mata Pelajaran</label>
                        <select wire:model="subject_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Pilih —</option>
                            @foreach ($subjects as $sub)<option value="{{ $sub->id }}">{{ $sub->name }}</option>@endforeach
                        </select>
                        @error('subject_id') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Kelas</label>
                        <select wire:model="class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Pilih —</option>
                            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
                        </select>
                        @error('class_id') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Guru</label>
                        <select wire:model="teacher_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Pilih —</option>
                            @foreach ($teachers as $t)<option value="{{ $t->id }}">{{ $t->full_name }}</option>@endforeach
                        </select>
                        @error('teacher_id') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Hari</label>
                        <select wire:model="day_of_week" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            @foreach ($days as $val => $lbl)<option value="{{ $val }}">{{ $lbl }}</option>@endforeach
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="mb-1 block text-sm font-medium">Mulai</label>
                            <input wire:model="start_time" type="time" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Selesai</label>
                            <input wire:model="end_time" type="time" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Tahun Ajaran</label>
                        <input wire:model="academic_year" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('academic_year') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                </div>
                <div class="mt-5 flex justify-end gap-2">
                    <button wire:click="$set('showModal', false)" class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Batal</button>
                    <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan</button>
                </div>
            </div>
        </div>
    @endif
</div>
