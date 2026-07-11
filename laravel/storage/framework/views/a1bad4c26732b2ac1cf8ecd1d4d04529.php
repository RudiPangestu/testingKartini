<div>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Rekap Kehadiran</h1>
        <p class="text-sm text-gray-500">Ringkasan kehadiran ananda</p>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $r): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
        <div class="mb-4 rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-bold"><?php echo e($r['name']); ?></div>
                    <div class="text-xs text-gray-500"><?php echo e($r['class']); ?></div>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-emerald-700"><?php echo e($r['pct'] !== null ? $r['pct'].'%' : '—'); ?></div>
                    <div class="text-xs text-gray-500">kehadiran</div>
                </div>
            </div>
            <div class="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
                <div class="rounded-lg bg-emerald-50 py-2"><div class="font-bold"><?php echo e($r['h']); ?></div><div class="text-xs text-gray-500">Hadir</div></div>
                <div class="rounded-lg bg-amber-50 py-2"><div class="font-bold"><?php echo e($r['s']); ?></div><div class="text-xs text-gray-500">Sakit</div></div>
                <div class="rounded-lg bg-sky-50 py-2"><div class="font-bold"><?php echo e($r['i']); ?></div><div class="text-xs text-gray-500">Izin</div></div>
                <div class="rounded-lg bg-red-50 py-2"><div class="font-bold text-red-600"><?php echo e($r['a']); ?></div><div class="text-xs text-gray-500">Alpha</div></div>
            </div>
        </div>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada data anak yang tertaut.</div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/family/reports.blade.php ENDPATH**/ ?>