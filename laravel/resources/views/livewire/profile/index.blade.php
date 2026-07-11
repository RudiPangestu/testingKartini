<div class="max-w-lg">
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Profil</h1>
        <p class="text-sm text-gray-500">Kelola akun Anda</p>
    </div>

    @if (session('ok'))<div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{{ session('ok') }}</div>@endif

    <div class="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div class="flex items-center gap-3 border-b pb-4">
            <div class="grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 text-lg font-bold text-white">
                {{ strtoupper(substr($user->full_name, 0, 1)) }}
            </div>
            <div>
                <div class="text-sm text-gray-500">{{ $user->email }}</div>
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ $user->role->label() }}</span>
            </div>
        </div>

        <div>
            <label class="mb-1 block text-sm font-medium">Nama Lengkap</label>
            <input wire:model="full_name" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
            @error('full_name') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
        </div>
        <div>
            <label class="mb-1 block text-sm font-medium">Telepon</label>
            <input wire:model="phone" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="mb-1 block text-sm font-medium">Password Baru</label>
                <input wire:model="password" type="password" placeholder="kosongkan bila tetap" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                @error('password') <span class="text-xs text-red-600">{{ $message }}</span> @enderror
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium">Ulangi Password</label>
                <input wire:model="password_confirmation" type="password" class="w-full rounded-lg border border-gray-300 px-3 py-2">
            </div>
        </div>

        <div class="flex justify-end">
            <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan Profil</button>
        </div>
    </div>
</div>
