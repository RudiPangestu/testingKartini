<div>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Presensi</h1>
        <p class="text-sm text-gray-500">Catat kehadiran per jadwal & tanggal</p>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('ok')): ?><div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><?php echo e(session('ok')); ?></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="mb-5 flex flex-wrap items-end gap-3">
        <div>
            <label class="mb-1 block text-sm font-medium">Jadwal</label>
            <select wire:model.live="scheduleId" class="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">— Pilih jadwal —</option>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $schedules; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $s): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <option value="<?php echo e($s->id); ?>"><?php echo e($s->schoolClass?->name); ?> · <?php echo e($s->subject?->name); ?> · <?php echo e($s->day_of_week->value); ?> <?php echo e($s->start_time); ?></option>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </select>
        </div>
        <div>
            <label class="mb-1 block text-sm font-medium">Tanggal</label>
            <input wire:model.live="date" type="date" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
        </div>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($scheduleId && $students->isNotEmpty()): ?>
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                        <th class="px-4 py-3">NISN</th>
                        <th class="px-4 py-3">Nama</th>
                        <th class="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $students; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $st): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <tr wire:key="att-<?php echo e($st->id); ?>">
                            <td class="px-4 py-2 text-gray-500"><?php echo e($st->nisn); ?></td>
                            <td class="px-4 py-2 font-medium"><?php echo e($st->full_name); ?></td>
                            <td class="px-4 py-2">
                                <div class="flex gap-1">
                                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = ['HADIR' => 'H', 'SAKIT' => 'S', 'IZIN' => 'I', 'ALPHA' => 'A']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $val => $lbl): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                        <button type="button" wire:click="$set('statuses.<?php echo e($st->id); ?>', '<?php echo e($val); ?>')"
                                                class="h-8 w-8 rounded-lg border text-xs font-semibold
                                                <?php echo e(($statuses[$st->id] ?? 'HADIR') === $val
                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50'); ?>">
                                            <?php echo e($lbl); ?>

                                        </button>
                                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </tbody>
            </table>
        </div>
        <div class="mt-4 flex justify-end">
            <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan Presensi</button>
        </div>
    <?php elseif($scheduleId): ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Tidak ada murid di kelas jadwal ini.</div>
    <?php else: ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Pilih jadwal untuk mulai presensi.</div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/attendance/index.blade.php ENDPATH**/ ?>