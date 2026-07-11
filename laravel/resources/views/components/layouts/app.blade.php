@props(['title' => 'SIPRES Kartini'])
@php
    use Illuminate\Support\Facades\Route as RouteFacade;
    $user = auth()->user();
    $role = $user?->role?->value;
    $staff = in_array($role, ['ADMIN', 'GURU']);
    $items = $staff ? [
        ['Dashboard', 'dashboard'],
        ['Presensi', 'attendance'],
        ['Laporan', 'reports'],
        ['Murid', 'students'],
        ['Buku Batas', 'lesson-logs'],
        ['Daftar Hadir', 'daftar-hadir'],
        ['Daftar Nilai', 'grades'],
        ['Mata Pelajaran', 'subjects'],
        ['Jadwal', 'schedules'],
        ['Kegiatan', 'events'],
        ['Periode', 'terms'],
        ['Pengumuman', 'announcements'],
        ['Pengaturan', 'settings'],
    ] : [
        ['Beranda', 'dashboard'],
        ['Rekap', 'family.reports'],
        ['Agenda', 'family.agenda'],
        ['Notifikasi', 'notifications'],
        ['Profil', 'profile'],
    ];
    if ($role === 'ADMIN') {
        $items[] = ['Pengguna', 'users'];
    }
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title }} — SIPRES Kartini</title>
    <script src="https://cdn.tailwindcss.com"></script>
    @livewireStyles
</head>
<body class="bg-gray-50 text-gray-900">
<div class="flex min-h-screen">
    <aside class="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div class="flex items-center gap-3 border-b px-5 py-4">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 font-bold text-white">SK</div>
            <div>
                <div class="font-bold leading-tight">SIPRES Kartini</div>
                <div class="text-xs text-gray-500">{{ $staff ? 'Panel Admin & Guru' : 'Portal Keluarga' }}</div>
            </div>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
            @foreach ($items as [$label, $name])
                @php
                    $exists = RouteFacade::has($name);
                    $href = $exists ? route($name) : '#';
                    $active = $exists && request()->routeIs($name);
                @endphp
                <a href="{{ $href }}"
                   class="block rounded-lg px-3 py-2 {{ $active ? 'bg-emerald-50 font-medium text-emerald-800' : ($exists ? 'text-gray-600 hover:bg-gray-100' : 'cursor-default text-gray-300') }}">
                    {{ $label }}
                </a>
            @endforeach
        </nav>

        <div class="border-t p-3">
            <div class="mb-2 px-2">
                <div class="text-sm font-medium">{{ $user->full_name }}</div>
                <div class="text-xs text-gray-500">{{ $user->role->label() }}</div>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">
                    Keluar
                </button>
            </form>
        </div>
    </aside>

    <main class="flex-1 overflow-x-auto p-8">
        {{ $slot }}
    </main>
</div>
@livewireScripts
</body>
</html>
