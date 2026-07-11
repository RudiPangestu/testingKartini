<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Pengguna</h1>
            <p class="text-sm text-gray-500">Kelola akun Admin, Guru, Orang Tua, dan Murid</p>
        </div>
        <button wire:click="create"
                class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Pengguna
        </button>
    </div>

    @if (session('ok'))
        <div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>
    @endif
    @if (session('err'))
        <div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ session('err') }}</div>
    @endif

    <div class="mb-4 flex flex-wrap gap-3">
        <select wire:model.live="roleFilter" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Semua Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="GURU">GURU</option>
            <option value="ORTU">ORTU</option>
            <option value="MURID">MURID</option>
        </select>
        <input wire:model.live.debounce.300ms="search" type="text" placeholder="Cari nama / email…"
               class="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm">
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Role</th>
                    <th class="px-4 py-3">Email</th>
                    <th class="px-4 py-3">Telepon</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($users as $u)
                    <tr class="hover:bg-gray-50" wire:key="u-{{ $u->id }}">
                        <td class="px-4 py-3 font-medium">{{ $u->full_name }}</td>
                        <td class="px-4 py-3">{{ $u->role->value }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $u->email }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $u->phone ?? '—' }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full px-2 py-0.5 text-xs {{ $u->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500' }}">
                                {{ $u->is_active ? 'Aktif' : 'Nonaktif' }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('{{ $u->id }}')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('{{ $u->id }}')" wire:confirm="Hapus {{ $u->full_name }}?"
                                    class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada pengguna.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $users->links() }}</div>

    {{-- Modal tambah/edit --}}
    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">{{ $editingId ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>

                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Peran (Role)</label>
                        <select wire:model="role" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="ADMIN">ADMIN</option>
                            <option value="GURU">GURU</option>
                            <option value="ORTU">ORTU</option>
                            <option value="MURID">MURID</option>
                        </select>
                        @error('role') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Nama Lengkap</label>
                        <input wire:model="full_name" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('full_name') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Email</label>
                        <input wire:model="email" type="email" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('email') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Telepon</label>
                        <input wire:model="phone" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('phone') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">
                            {{ $editingId ? 'Password (kosongkan bila tidak diubah)' : 'Password' }}
                        </label>
                        <input wire:model="password" type="password" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('password') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <label class="flex items-center gap-2 text-sm">
                        <input wire:model="is_active" type="checkbox"> Akun aktif
                    </label>
                </div>

                <div class="mt-5 flex justify-end gap-2">
                    <button wire:click="$set('showModal', false)"
                            class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Batal</button>
                    <button wire:click="save"
                            class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan</button>
                </div>
            </div>
        </div>
    @endif
</div>
