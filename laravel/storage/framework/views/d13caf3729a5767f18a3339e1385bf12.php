<div>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Laporan</h1>
        <p class="text-sm text-gray-500">Rekap persentase kehadiran per kelas</p>
    </div>

    <div class="mb-5 flex flex-wrap items-end gap-3">
        <div>
            <label class="mb-1 block text-sm font-medium">Kelas</label>
            <select wire:model.live="classId" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">— Pilih kelas —</option>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $classes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $c): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($c->id); ?>"><?php echo e($c->name); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </select>
        </div>
        <div>
            <label class="mb-1 block text-sm font-medium">Dari</label>
            <input wire:model.live="start" type="date" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
        </div>
        <div>
            <label class="mb-1 block text-sm font-medium">Sampai</label>
            <input wire:model.live="end" type="date" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
        </div>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($classId): ?>
        <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($totals['HADIR']); ?></div><div class="text-xs text-gray-500">Hadir</div></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($totals['SAKIT']); ?></div><div class="text-xs text-gray-500">Sakit</div></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($totals['IZIN']); ?></div><div class="text-xs text-gray-500">Izin</div></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($totals['ALPHA']); ?></div><div class="text-xs text-gray-500">Alpha</div></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($classPct !== null ? $classPct.'%' : '—'); ?></div><div class="text-xs text-gray-500">% Hadir</div></div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                        <th class="px-4 py-3">Nama</th>
                        <th class="px-4 py-3 text-center">H</th>
                        <th class="px-4 py-3 text-center">S</th>
                        <th class="px-4 py-3 text-center">I</th>
                        <th class="px-4 py-3 text-center">A</th>
                        <th class="px-4 py-3 text-center">Total</th>
                        <th class="px-4 py-3 text-center">% Hadir</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $r): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-2 font-medium"><?php echo e($r['name']); ?></td>
                            <td class="px-4 py-2 text-center"><?php echo e($r['h']); ?></td>
                            <td class="px-4 py-2 text-center"><?php echo e($r['s']); ?></td>
                            <td class="px-4 py-2 text-center"><?php echo e($r['i']); ?></td>
                            <td class="px-4 py-2 text-center <?php echo e($r['a'] > 0 ? 'text-red-600 font-semibold' : ''); ?>"><?php echo e($r['a']); ?></td>
                            <td class="px-4 py-2 text-center text-gray-500"><?php echo e($r['tot']); ?></td>
                            <td class="px-4 py-2 text-center font-semibold"><?php echo e($r['pct'] !== null ? $r['pct'].'%' : '—'); ?></td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                        <tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">Belum ada data.</td></tr>
                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </tbody>
            </table>
        </div>
    <?php else: ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Pilih kelas untuk melihat rekap.</div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/reports/index.blade.php ENDPATH**/ ?>