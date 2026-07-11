<div>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
        <p class="text-sm text-gray-500">Kegiatan & agenda sekolah</p>
    </div>

    <div class="space-y-3">
        @forelse ($events as $e)
            <div class="rounded-xl border border-gray-200 bg-white p-4" wire:key="ev-{{ $e->id }}">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="font-medium">{{ $e->title }}</div>
                        @if ($e->description)<p class="mt-1 text-sm text-gray-600">{{ $e->description }}</p>@endif
                        <p class="mt-1 text-xs text-gray-400">
                            {{ $e->event_date?->format('d/m/Y') }} · {{ $e->start_time }}–{{ $e->end_time }}
                            @if ($e->location) · {{ $e->location }}@endif
                        </p>
                    </div>
                    <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{{ $e->targetClass?->name ?? 'Umum' }}</span>
                </div>
            </div>
        @empty
            <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada agenda.</div>
        @endforelse
    </div>

    <div class="mt-4">{{ $events->links() }}</div>
</div>
