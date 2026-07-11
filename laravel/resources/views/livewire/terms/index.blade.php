<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Periode</h1>
            <p class="text-sm text-gray-500">Semester / triwulan / mid untuk rekap</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Periode
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif
    @if (session('err'))<div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ session('err') }}</div>@endif

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Jenis</th>
                    <th class="px-4 py-3">Tahun Ajaran</th>
                    <th class="px-4 py-3">Mulai</th>
                    <th class="px-4 py-3">Selesai</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($terms as $t)
                    <tr class="hover:bg-gray-50" wire:key="t-{{ $t->id }}">
                        <td class="px-4 py-3 font-medium">{{ $t->name }}</td>
                        <td class="px-4 py-3">{{ $t->type->value }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $t->academic_year }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $t->start_date?->format('d/m/Y') }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $t->end_date?->format('d/m/Y') }}</td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('{{ $t->id }}')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('{{ $t->id }}')" wire:confirm="Hapus {{ $t->name }}?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada periode.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $terms->links() }}</div>

    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">{{ $editingId ? 'Edit Periode' : 'Tambah Periode' }}</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Nama</label>
                        <input wire:model="name" type="text" placeholder="mis. Semester Ganjil" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('name') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Jenis</label>
                        <select wire:model="type" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="SEMESTER">Semester</option>
                            <option value="TRIWULAN">Triwulan (Caturwulan)</option>
                            <option value="MID">Mid</option>
                        </select>
                        @error('type') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Tahun Ajaran</label>
                        <input wire:model="academic_year" type="text" placeholder="2025/2026" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('academic_year') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="mb-1 block text-sm font-medium">Mulai</label>
                            <input wire:model="start_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            @error('start_date') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Selesai</label>
                            <input wire:model="end_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            @error('end_date') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                        </div>
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
