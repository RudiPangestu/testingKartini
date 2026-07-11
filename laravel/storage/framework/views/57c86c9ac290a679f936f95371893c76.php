<div>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
            <a href="<?php echo e(route('grades')); ?>" class="text-sm text-emerald-700 hover:underline">← Buku Nilai</a>
            <h1 class="mt-1 text-xl font-bold tracking-tight text-gray-900">
                <?php echo e($book->subject?->name); ?> — <?php echo e($book->schoolClass?->name); ?>

            </h1>
            <p class="text-sm text-gray-500">Cawu <?php echo e($book->cawu); ?> · Tahun <?php echo e($book->academic_year); ?> · KKM <?php echo e($book->kkm); ?></p>
        </div>
        <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            Simpan Nilai
        </button>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('ok')): ?><div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><?php echo e(session('ok')); ?></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    
    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($stats['jumlahSiswa']); ?></div><div class="text-xs text-gray-500">Siswa</div></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($stats['rataKelas'] ?? '—'); ?></div><div class="text-xs text-gray-500">Rata Kelas (Daya Serap)</div></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($stats['jumlahTuntas']); ?>/<?php echo e($stats['jumlahSiswa']); ?></div><div class="text-xs text-gray-500">Tuntas</div></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4"><div class="text-2xl font-bold"><?php echo e($stats['targetKurikulum'] !== null ? $stats['targetKurikulum'].'%' : '—'); ?></div><div class="text-xs text-gray-500">Target Kurikulum</div></div>
    </div>

    
    <div class="mb-5 rounded-xl border border-gray-200 bg-white p-4">
        <h3 class="mb-2 text-sm font-medium">Kompetensi Dasar (KD)</h3>
        <div class="flex flex-wrap gap-2">
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $book->kds; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $kd): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs" wire:key="kd-<?php echo e($kd->id); ?>">
                    KD.<?php echo e($kd->nomor); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($kd->deskripsi): ?> — <?php echo e(\Illuminate\Support\Str::limit($kd->deskripsi, 30)); ?><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    <button wire:click="removeKd('<?php echo e($kd->id); ?>')" wire:confirm="Hapus KD.<?php echo e($kd->nomor); ?> & nilainya?" class="ml-1 text-gray-500 hover:text-red-600">×</button>
                </span>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </div>
        <div class="mt-3 flex flex-wrap items-end gap-2">
            <div>
                <label class="mb-1 block text-xs text-gray-500">Nomor</label>
                <input wire:model="newKdNomor" type="number" min="1" max="20" class="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm">
            </div>
            <div class="flex-1">
                <label class="mb-1 block text-xs text-gray-500">Deskripsi (opsional)</label>
                <input wire:model="newKdDeskripsi" type="text" class="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm">
            </div>
            <button wire:click="addKd" class="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm text-emerald-700 hover:bg-emerald-50">+ Tambah KD</button>
        </div>
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['newKdNomor'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>

    
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($book->kds->isEmpty()): ?>
        <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">
            Tambahkan KD dulu untuk mulai input nilai.
        </div>
    <?php else: ?>
        <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table class="min-w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500">
                    <tr>
                        <th class="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-left">Nama</th>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $book->kds; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $kd): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <th class="border-l px-2 py-2 text-center" colspan="3">KD.<?php echo e($kd->nomor); ?></th>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <th class="border-l px-3 py-2 text-center">NR</th>
                        <th class="px-2 py-2 text-center">Pred</th>
                        <th class="px-2 py-2 text-center">Tuntas</th>
                    </tr>
                    <tr>
                        <th class="sticky left-0 z-10 bg-gray-50 px-3 py-1"></th>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $book->kds; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $kd): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <th class="border-l px-1 py-1 text-center font-normal">P</th>
                            <th class="px-1 py-1 text-center font-normal">Pr</th>
                            <th class="px-1 py-1 text-center font-normal text-gray-400">KD</th>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <th class="border-l"></th><th></th><th></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $students; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $st): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <?php $row = $summary[$st->id]; ?>
                        <tr wire:key="row-<?php echo e($st->id); ?>">
                            <td class="sticky left-0 z-10 bg-white px-3 py-1 font-medium whitespace-nowrap"><?php echo e($st->full_name); ?></td>
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $book->kds; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $kd): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                                <td class="border-l px-1 py-1">
                                    <input wire:model.blur="scores.<?php echo e($kd->id); ?>.<?php echo e($st->id); ?>.PENGETAHUAN" type="number" min="0" max="100"
                                           class="w-14 rounded border border-gray-200 px-1 py-0.5 text-center">
                                </td>
                                <td class="px-1 py-1">
                                    <input wire:model.blur="scores.<?php echo e($kd->id); ?>.<?php echo e($st->id); ?>.PRAKTEK" type="number" min="0" max="100"
                                           class="w-14 rounded border border-gray-200 px-1 py-0.5 text-center">
                                </td>
                                <td class="px-1 py-1 text-center text-gray-400"><?php echo e($row['cells'][$kd->id] ?? '—'); ?></td>
                            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            <td class="border-l px-3 py-1 text-center font-semibold"><?php echo e($row['nr'] ?? '—'); ?></td>
                            <td class="px-2 py-1 text-center"><?php echo e($row['predikat'] ?? '—'); ?></td>
                            <td class="px-2 py-1 text-center">
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($row['tuntas'] === true): ?><span class="text-emerald-600">✔</span>
                                <?php elseif($row['tuntas'] === false): ?><span class="text-red-500">✗</span>
                                <?php else: ?> —<?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($students->isEmpty()): ?>
                        <tr><td colspan="99" class="px-4 py-8 text-center text-gray-400">Belum ada murid di kelas ini.</td></tr>
                    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                </tbody>
            </table>
        </div>
        <p class="mt-2 text-xs text-gray-400">P = Pengetahuan, Pr = Praktek. Nilai KD = rata-rata komponen terisi; NR = rata-rata Nilai KD. Predikat A≥86 · B≥71 · C≥56 · D&lt;56.</p>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/grades/input.blade.php ENDPATH**/ ?>