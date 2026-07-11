<div>
    <?php $ch = ['HADIR' => '•', 'SAKIT' => 'S', 'IZIN' => 'I', 'ALPHA' => 'A']; ?>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Daftar Hadir</h1>
        <p class="text-sm text-gray-500">Rekap matriks kehadiran tatap muka per kelas</p>
    </div>

    <div class="mb-4">
        <select wire:model.live="classId" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Pilih kelas —</option>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $classes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $c): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($c->id); ?>"><?php echo e($c->name); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </select>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($classId && $students->isNotEmpty()): ?>
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500">
                    <tr>
                        <th class="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left">Nama</th>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $sessions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $i => $sess): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <th class="border-l px-2 py-2 text-center" title="<?php echo e($sess->session_date?->format('d/m/Y')); ?>"><?php echo e($i + 1); ?></th>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $students; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $st): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <tr wire:key="dh-<?php echo e($st->id); ?>">
                            <td class="sticky left-0 z-10 bg-white px-3 py-1.5 font-medium whitespace-nowrap"><?php echo e($st->full_name); ?></td>
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $sessions; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $sess): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <?php $stat = $matrix[$st->id][$sess->id] ?? null; ?>
                                <td class="border-l px-2 py-1.5 text-center <?php echo e($stat === 'ALPHA' ? 'text-red-600 font-semibold' : 'text-gray-700'); ?>">
                                    <?php echo e($stat ? ($ch[$stat] ?? '?') : ''); ?>

                                </td>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </tbody>
            </table>
        </div>
        <p class="mt-2 text-xs text-gray-400">• = Hadir · S = Sakit · I = Izin · A = Alpha. Kolom = pertemuan (urut tanggal).</p>
    <?php elseif($classId): ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada murid / sesi presensi untuk kelas ini.</div>
    <?php else: ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Pilih kelas untuk melihat matriks.</div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/daftar-hadir/index.blade.php ENDPATH**/ ?>