<?php $attributes ??= new \Illuminate\View\ComponentAttributeBag;

$__newAttributes = [];
$__propNames = \Illuminate\View\ComponentAttributeBag::extractPropNames((['title' => 'SIPRES Kartini']));

foreach ($attributes->all() as $__key => $__value) {
    if (in_array($__key, $__propNames)) {
        $$__key = $$__key ?? $__value;
    } else {
        $__newAttributes[$__key] = $__value;
    }
}

$attributes = new \Illuminate\View\ComponentAttributeBag($__newAttributes);

unset($__propNames);
unset($__newAttributes);

foreach (array_filter((['title' => 'SIPRES Kartini']), 'is_string', ARRAY_FILTER_USE_KEY) as $__key => $__value) {
    $$__key = $$__key ?? $__value;
}

$__defined_vars = get_defined_vars();

foreach ($attributes->all() as $__key => $__value) {
    if (array_key_exists($__key, $__defined_vars)) unset($$__key);
}

unset($__defined_vars, $__key, $__value); ?>
<?php
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
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo e($title); ?> — SIPRES Kartini</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <?php echo \Livewire\Mechanisms\FrontendAssets\FrontendAssets::styles(); ?>

</head>
<body class="bg-gray-50 text-gray-900">
<div class="flex min-h-screen">
    <aside class="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div class="flex items-center gap-3 border-b px-5 py-4">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-700 font-bold text-white">SK</div>
            <div>
                <div class="font-bold leading-tight">SIPRES Kartini</div>
                <div class="text-xs text-gray-500"><?php echo e($staff ? 'Panel Admin & Guru' : 'Portal Keluarga'); ?></div>
            </div>
        </div>

        <nav class="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as [$label, $name]): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <?php
                    $exists = RouteFacade::has($name);
                    $href = $exists ? route($name) : '#';
                    $active = $exists && request()->routeIs($name);
                ?>
                <a href="<?php echo e($href); ?>"
                   class="block rounded-lg px-3 py-2 <?php echo e($active ? 'bg-emerald-50 font-medium text-emerald-800' : ($exists ? 'text-gray-600 hover:bg-gray-100' : 'cursor-default text-gray-300')); ?>">
                    <?php echo e($label); ?>

                </a>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </nav>

        <div class="border-t p-3">
            <div class="mb-2 px-2">
                <div class="text-sm font-medium"><?php echo e($user->full_name); ?></div>
                <div class="text-xs text-gray-500"><?php echo e($user->role->label()); ?></div>
            </div>
            <form method="POST" action="<?php echo e(route('logout')); ?>">
                <?php echo csrf_field(); ?>
                <button type="submit"
                        class="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100">
                    Keluar
                </button>
            </form>
        </div>
    </aside>

    <main class="flex-1 overflow-x-auto p-8">
        <?php echo e($slot); ?>

    </main>
</div>
<?php echo \Livewire\Mechanisms\FrontendAssets\FrontendAssets::scripts(); ?>

</body>
</html>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/components/layouts/app.blade.php ENDPATH**/ ?>