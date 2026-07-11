<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Daftar Nilai</h1>
            <p class="text-sm text-gray-500">Buku nilai per mapel, kelas &amp; caturwulan</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Buku Nilai Baru
        </button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Kelas</th>
                    <th class="px-4 py-3">Mata Pelajaran</th>
                    <th class="px-4 py-3">Tahun</th>
                    <th class="px-4 py-3">Cawu</th>
                    <th class="px-4 py-3">KKM</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                @forelse ($books as $b)
                    <tr class="hover:bg-gray-50" wire:key="gb-{{ $b->id }}">
                        <td class="px-4 py-3 font-medium">{{ $b->schoolClass?->name }}</td>
                        <td class="px-4 py-3">{{ $b->subject?->name }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $b->academic_year }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $b->cawu }}</td>
                        <td class="px-4 py-3 text-gray-500">{{ $b->kkm }}</td>
                        <td class="px-4 py-3 text-right whitespace-nowrap">
                            <a href="{{ route('grades.input', $b->id) }}" class="mr-2 text-emerald-700 hover:underline">Input Nilai</a>
                            <button wire:click="delete('{{ $b->id }}')" wire:confirm="Hapus buku nilai ini beserta semua nilainya?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                @empty
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada buku nilai.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">{{ $books->links() }}</div>

    @if ($showModal)
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold">Buku Nilai Baru</h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Kelas</label>
                        <select wire:model="class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Pilih —</option>
                            @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
                        </select>
                        @error('class_id') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Mata Pelajaran</label>
                        <select wire:model="subject_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">— Pilih —</option>
                            @foreach ($subjects as $s)<option value="{{ $s->id }}">{{ $s->name }}</option>@endforeach
                        </select>
                        @error('subject_id') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <label class="mb-1 block text-sm font-medium">Tahun</label>
                            <input wire:model="academic_year" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Cawu</label>
                            <input wire:model="cawu" type="number" min="1" max="3" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">KKM</label>
                            <input wire:model="kkm" type="number" min="0" max="100" class="w-full rounded-lg border border-gray-300 px-3 py-2">
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
