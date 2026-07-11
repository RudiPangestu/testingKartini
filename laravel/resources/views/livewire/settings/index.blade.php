<div class="max-w-2xl">
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Pengaturan</h1>
        <p class="text-sm text-gray-500">Notifikasi & template pesan ke orang tua</p>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    <div class="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div>
            <h3 class="mb-2 font-medium">Kanal Notifikasi</h3>
            <div class="flex flex-wrap gap-4 text-sm">
                <label class="flex items-center gap-2"><input type="checkbox" wire:model="channel_push"> Push</label>
                <label class="flex items-center gap-2"><input type="checkbox" wire:model="channel_email"> Email</label>
                <label class="flex items-center gap-2"><input type="checkbox" wire:model="channel_wa"> WhatsApp</label>
            </div>
        </div>

        <div>
            <h3 class="mb-2 font-medium">Status yang memicu notifikasi ke ortu</h3>
            <div class="flex flex-wrap gap-4 text-sm">
                @foreach (['HADIR', 'SAKIT', 'IZIN', 'ALPHA'] as $st)
                    <label class="flex items-center gap-2"><input type="checkbox" value="{{ $st }}" wire:model="notify_statuses"> {{ $st }}</label>
                @endforeach
            </div>
            @error('notify_statuses.*') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
        </div>

        <div>
            <label class="mb-1 block text-sm font-medium">Template Notifikasi Kehadiran</label>
            <textarea wire:model="attendance_template" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
            <p class="mt-1 text-xs text-gray-400">Placeholder: {nama}, {status}, {tanggal}</p>
            @error('attendance_template') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
        </div>

        <div>
            <label class="mb-1 block text-sm font-medium">Template Pengingat</label>
            <textarea wire:model="reminder_template" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
            @error('reminder_template') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="mb-1 block text-sm font-medium">Jam Pengingat (0–23)</label>
                <input wire:model="reminder_hour" type="number" min="0" max="23" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                @error('reminder_hour') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
            </div>
            <label class="mt-7 flex items-center gap-2 text-sm">
                <input type="checkbox" wire:model="weekly_recap_enabled"> Rekap mingguan aktif
            </label>
        </div>

        <div class="flex justify-end">
            <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan Pengaturan</button>
        </div>
    </div>
</div>
