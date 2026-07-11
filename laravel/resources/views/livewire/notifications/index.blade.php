<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Notifikasi</h1>
            <p class="text-sm text-gray-500">Pemberitahuan untuk akun Anda</p>
        </div>
        <button wire:click="markAllRead" class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">Tandai semua dibaca</button>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    <div class="space-y-2">
        @forelse ($items as $n)
            <div wire:key="n-{{ $n->id }}"
                 class="flex items-start justify-between gap-3 rounded-xl border p-4 {{ $n->is_read ? 'border-gray-200 bg-white' : 'border-emerald-200 bg-emerald-50/40' }}">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500">{{ $n->type->value }}</span>
                        <span class="font-medium">{{ $n->title }}</span>
                    </div>
                    <p class="mt-1 text-sm text-gray-600">{{ $n->body }}</p>
                    <p class="mt-1 text-xs text-gray-400">{{ $n->sent_at?->format('d/m/Y H:i') }}</p>
                </div>
                @unless ($n->is_read)
                    <button wire:click="markRead('{{ $n->id }}')" class="shrink-0 text-xs text-emerald-700 hover:underline">Tandai dibaca</button>
                @endunless
            </div>
        @empty
            <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada notifikasi.</div>
        @endforelse
    </div>

    <div class="mt-4">{{ $items->links() }}</div>
</div>
