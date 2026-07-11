<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Buku Batas</h1>
            <p class="text-sm text-gray-500">Buku batas pembelajaran (jurnal mengajar)</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Baris
        </button>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('ok')): ?><div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><?php echo e(session('ok')); ?></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="mb-4">
        <select wire:model.live="classFilter" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">Semua Kelas</option>
            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $classes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $c): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($c->id); ?>"><?php echo e($c->name); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
        </select>
    </div>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Tanggal</th>
                    <th class="px-4 py-3">Kelas</th>
                    <th class="px-4 py-3">Jam</th>
                    <th class="px-4 py-3">Pokok Bahasan</th>
                    <th class="px-4 py-3">Selesai</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $logs; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $l): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <tr class="hover:bg-gray-50" wire:key="ll-<?php echo e($l->id); ?>">
                        <td class="px-4 py-3 text-gray-500"><?php echo e($l->date?->format('d/m/Y')); ?></td>
                        <td class="px-4 py-3"><?php echo e($l->schoolClass?->name); ?></td>
                        <td class="px-4 py-3 text-gray-500"><?php echo e($l->jam_ke); ?></td>
                        <td class="px-4 py-3"><?php echo e(\Illuminate\Support\Str::limit($l->pokok_bahasan, 50)); ?></td>
                        <td class="px-4 py-3">
                            <span class="rounded-full px-2 py-0.5 text-xs <?php echo e($l->selesai ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'); ?>">
                                <?php echo e($l->selesai ? 'Selesai' : 'Belum'); ?>

                            </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('<?php echo e($l->id); ?>')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('<?php echo e($l->id); ?>')" wire:confirm="Hapus baris ini?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada catatan.</td></tr>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </tbody>
        </table>
    </div>

    <div class="mt-4"><?php echo e($logs->links()); ?></div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showModal): ?>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold"><?php echo e($editingId ? 'Edit Baris' : 'Tambah Baris'); ?></h2>
                <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="mb-1 block text-sm font-medium">Kelas</label>
                            <select wire:model="class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                                <option value="">— Pilih —</option>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $classes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $c): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($c->id); ?>"><?php echo e($c->name); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </select>
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['class_id'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Mapel (opsional)</label>
                            <select wire:model="subject_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                                <option value="">—</option>
                                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $subjects; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $s): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($s->id); ?>"><?php echo e($s->name); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="mb-1 block text-sm font-medium">Tanggal</label>
                            <input wire:model="date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['date'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Jam ke-</label>
                            <input wire:model="jam_ke" type="text" placeholder="1-2" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['jam_ke'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Pokok Bahasan</label>
                        <textarea wire:model="pokok_bahasan" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['pokok_bahasan'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Metode (opsional)</label>
                        <input wire:model="metode" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                    </div>
                    <label class="flex items-center gap-2 text-sm"><input type="checkbox" wire:model="selesai"> Materi selesai</label>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Siswa Tidak Hadir (opsional)</label>
                        <input wire:model="siswa_tidak_hadir" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Refleksi (opsional)</label>
                        <textarea wire:model="refleksi" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Tindak Lanjut (opsional)</label>
                        <textarea wire:model="tindak_lanjut" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
                    </div>
                </div>
                <div class="mt-5 flex justify-end gap-2">
                    <button wire:click="$set('showModal', false)" class="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">Batal</button>
                    <button wire:click="save" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Simpan</button>
                </div>
            </div>
        </div>
    <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/lesson-logs/index.blade.php ENDPATH**/ ?>