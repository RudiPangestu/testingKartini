<div class="max-w-2xl">
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Pengumuman</h1>
        <p class="text-sm text-gray-500">Kirim pemberitahuan ke orang tua / kelas</p>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    <div class="space-y-3 rounded-xl border border-gray-200 bg-white p-6">
        <div>
            <label class="mb-1 block text-sm font-medium">Judul</label>
            <input wire:model="title" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
            @error('title') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
        </div>
        <div>
            <label class="mb-1 block text-sm font-medium">Isi</label>
            <textarea wire:model="body" rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
            @error('body') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="mb-1 block text-sm font-medium">Penerima</label>
                <select wire:model.live="audience" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                    <option value="ALL_ORTU">Semua Orang Tua</option>
                    <option value="CLASS">Ortu Kelas Tertentu</option>
                    <option value="ALL">Semua Pengguna</option>
                </select>
            </div>
            @if ($audience === 'CLASS')
                <div>
                    <label class="mb-1 block text-sm font-medium">Kelas</label>
                    <select wire:model="target_class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        <option value="">— Pilih —</option>
                        @foreach ($classes as $c)<option value="{{ $c->id }}">{{ $c->name }}</option>@endforeach
                    </select>
                    @error('target_class_id') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
                </div>
            @endif
        </div>
        <div class="flex justify-end">
            <button wire:click="send" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Kirim Pengumuman</button>
        </div>
    </div>

    @if ($recent->isNotEmpty())
        <h3 class="mt-8 mb-2 text-sm font-medium text-gray-600">Pengumuman terakhir</h3>
        <div class="space-y-2">
            @foreach ($recent as $r)
                <div class="rounded-xl border border-gray-200 bg-white p-4">
                    <div class="font-medium">{{ $r->title }}</div>
                    <p class="text-sm text-gray-600">{{ \Illuminate\Support\Str::limit($r->body, 120) }}</p>
                    <p class="mt-1 text-xs text-gray-400">{{ $r->sent_at?->format('d/m/Y H:i') }}</p>
                </div>
            @endforeach
        </div>
    @endif
</div>
