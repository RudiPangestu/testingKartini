<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Murid</h1>
            <p class="text-sm text-gray-500">Data murid &amp; penautan orang tua/wali</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Murid
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif
    @if (session('err'))<div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ session('err') }}</div>@endif

    <div class="mb-4 flex flex-wrap gap-3">
        <select wire:model.live="classFilter" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Semua Kelas</option>
            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
        </select>
        <input wire:model.live.debounce.300ms="search" type="text" placeholder="Cari NISN / nama…"
               class="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm">
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">NISN</th>
                    <th class="px-4 py-3">Nama</th>
                    <th class="px-4 py-3">Kelas</th>
                    <th class="px-4 py-3">JK</th>
                    <th class="px-4 py-3">Orang Tua/Wali</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($students as $s)
                    <tr class="hover:bg-gray-50" wire:key="st-{{ $s->id }}">
                        <td class="px-4 py-3 text-gray-500">{{ $s->nisn }}</td>
                        <td class="px-4 py-3 font-medium">{{ $s->full_name }}</td>
                        <td class="px-4 py-3">{{ $s->schoolClass?->name ?? '—' }}</td>
                        <td class="px-4 py-3">{{ $s->gender?->value ?? '—' }}</td>
                        <td class="px-4 py-3">
                            @if ($s->parents->isNotEmpty())
                                <div class="flex flex-wrap gap-1">
                                    @foreach ($s->parents as $p)
                                        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800" title="{{ $p->parent->email }}">
                                            {{ $p->parent->full_name }}@if ($p->relation) ({{ $p->relation }})@endif
                                            <button wire:click="unlinkParent('{{ $s->id }}','{{ $p->parent_user_id }}')"
                                                    wire:confirm="Lepas tautan {{ $p->parent->full_name }}?"
                                                    class="ml-0.5 text-emerald-700 hover:text-red-600">×</button>
                                        </span>
                                    @endforeach
                                </div>
                            @else
                                <span class="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Belum ditautkan</span>
                            @endif
                        </td>
                        <td class="px-4 py-3 text-right whitespace-nowrap">
                            <button wire:click="openLink('{{ $s->id }}')" class="mr-2 text-gray-500 hover:underline">Tautkan Ortu</button>
                            <button wire:click="edit('{{ $s->id }}')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('{{ $s->id }}')" wire:confirm="Hapus {{ $s->full_name }}?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada murid.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $students->links() }}</div>

    {{-- Modal murid --}}
    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">{{ $editingId ? 'Edit Murid' : 'Tambah Murid' }}</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">NISN</label>
                        <input wire:model="nisn" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('nisn') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">NIS (opsional)</label>
                        <input wire:model="nis" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Nama Lengkap</label>
                        <input wire:model="full_name" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        @error('full_name') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Kelas</label>
                        <select wire:model="class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Belum ditempatkan —</option>
                            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Jenis Kelamin</label>
                        <select wire:model="gender" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">—</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
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

    {{-- Modal tautan ortu --}}
    @if ($linkFor)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">Tautkan Orang Tua — {{ $linkForName }}</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Akun Orang Tua (ORTU)</label>
                        <select wire:model="linkParentId" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Pilih —</option>
                            @foreach ($parents as $p)
                                <option value="{{ $p->id }}">{{ $p->full_name }} @if ($p->email)({{ $p->email }})@endif</option>
                            @endforeach
                        </select>
                        @error('linkParentId') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Hubungan</label>
                        <select wire:model="linkRelation" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="ayah">Ayah</option>
                            <option value="ibu">Ibu</option>
                            <option value="wali">Wali</option>
                        </select>
                    </div>
                </div>
                <div class="mt-5 flex justify-end gap-2">
                    <button wire:click="$set('linkFor', null)" class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Batal</button>
                    <button wire:click="linkParent" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Tautkan</button>
                </div>
            </div>
        </div>
    @endif
</div>
