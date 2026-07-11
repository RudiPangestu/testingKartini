<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Kegiatan</h1>
            <p class="text-sm text-gray-500">Agenda & kegiatan sekolah</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Kegiatan
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif
    @if (session('err'))<div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ session('err') }}</div>@endif

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Judul</th>
                    <th class="px-4 py-3">Tanggal</th>
                    <th class="px-4 py-3">Waktu</th>
                    <th class="px-4 py-3">Lokasi</th>
                    <th class="px-4 py-3">Sasaran Kelas</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($events as $e)
                    <tr class="hover:bg-gray-50" wire:key="e-{{ $e->id }}">
                        <td class="px-4 py-3 font-medium">{{ $e->title }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $e->event_date?->format('d/m/Y') }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $e->start_time }}–{{ $e->end_time }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $e->location ?? '—' }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $e->targetClass?->name ?? 'Semua' }}</td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('{{ $e->id }}')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('{{ $e->id }}')" wire:confirm="Hapus {{ $e->title }}?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada kegiatan.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $events->links() }}</div>

    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">{{ $editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan' }}</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Judul</label>
                        <input wire:model="title" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('title') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Deskripsi (opsional)</label>
                        <textarea wire:model="description" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Tanggal</label>
                        <input wire:model="event_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('event_date') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
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
                        <label class="mb-1 block text-sm font-medium">Lokasi (opsional)</label>
                        <input wire:model="location" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Sasaran Kelas (opsional)</label>
                        <select wire:model="target_class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">Semua kelas</option>
                            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
                        </select>
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
