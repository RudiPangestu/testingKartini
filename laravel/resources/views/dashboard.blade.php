<x-layouts.app title="Dashboard">
    <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight">Selamat datang, {{ auth()->user()->full_name }}</h1>
        <p class="text-gray-500">Peran: {{ auth()->user()->role->label() }}</p>
    </div>

    @if (in_array(auth()->user()->role->value, ['ADMIN', 'GURU']))
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            @foreach ([
                ['Murid', \App\Models\Student::count()],
                ['Kelas', \App\Models\SchoolClass::count()],
                ['Mapel', \App\Models\Subject::count()],
                ['Pengguna', \App\Models\User::count()],
            ] as [$label, $val])
                <div class="rounded-xl border border-gray-200 bg-white p-5">
                    <div class="text-3xl font-bold">{{ $val }}</div>
                    <div class="text-sm text-gray-500">{{ $label }}</div>
                </div>
            @endforeach
        </div>
    @endif

    <div class="mt-8 rounded-xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        Modul aktif bertambah bertahap — menu yang belum aktif tampil pudar di sidebar.
    </div>
</x-layouts.app>
