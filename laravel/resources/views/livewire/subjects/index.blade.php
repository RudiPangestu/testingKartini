<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Mata Pelajaran</h1>
            <p class="text-sm text-gray-500">Daftar mata pelajaran</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Mapel
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif
    @if (session('err'))<div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ session('err') }}</div>@endif

    <div class="mb-4">
        <input wire:model.live.debounce.300ms="search" type="text" placeholder="Cari nama / kode…"
               class="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm">
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Kode</th>
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($subjects as $s)
                    <tr class="hover:bg-gray-50" wire:key="s-{{ $s->id }}">
                        <td class="px-4 py-3 text-gray-500">{{ $s->code ?? '—' }}</td>
                        <td class="px-4 py-3 font-medium">{{ $s->name }}</td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('{{ $s->id }}')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('{{ $s->id }}')" wire:confirm="Hapus {{ $s->name }}?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="3" class="px-4 py-8 text-center text-gray-400">Belum ada mata pelajaran.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $subjects->links() }}</div>

    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">{{ $editingId ? 'Edit Mapel' : 'Tambah Mapel' }}</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Nama</label>
                        <input wire:model="name" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('name') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Kode (opsional)</label>
                        <input wire:model="code" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('code') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
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
