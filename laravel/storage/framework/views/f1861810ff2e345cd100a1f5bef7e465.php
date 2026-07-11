<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Kegiatan</h1>
            <p class="text-sm text-gray-500">Agenda & kegiatan sekolah</p>
        </div>
        <button wire:click="create" class="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
            + Tambah Kegiatan
        </button>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('ok')): ?><div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><?php echo e(session('ok')); ?></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('err')): ?><div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"><?php echo e(session('err')); ?></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table class="w-full text-sm">
            <thead class="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                    <th class="px-4 py-3">Judul</th>
                    <th class="px-4 py-3">Tanggal</th>
                    <th class="px-4 py-3">Waktu</th>
                    <th class="px-4 py-3">Lokasi</th>
                    <th class="px-4 py-3">Sasaran Kelas</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $events; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $e): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
                    <tr class="hover:bg-gray-50" wire:key="e-<?php echo e($e->id); ?>">
                        <td class="px-4 py-3 font-medium"><?php echo e($e->title); ?></td>
                        <td class="px-4 py-3 text-gray-500"><?php echo e($e->event_date?->format('d/m/Y')); ?></td>
                        <td class="px-4 py-3 text-gray-500"><?php echo e($e->start_time); ?>–<?php echo e($e->end_time); ?></td>
                        <td class="px-4 py-3 text-gray-500"><?php echo e($e->location ?? '—'); ?></td>
                        <td class="px-4 py-3 text-gray-500"><?php echo e($e->targetClass?->name ?? 'Semua'); ?></td>
                        <td class="px-4 py-3 text-right">
                            <button wire:click="edit('<?php echo e($e->id); ?>')" class="mr-2 text-emerald-700 hover:underline">Edit</button>
                            <button wire:click="delete('<?php echo e($e->id); ?>')" wire:confirm="Hapus <?php echo e($e->title); ?>?" class="text-red-600 hover:underline">Hapus</button>
                        </td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
                    <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400">Belum ada kegiatan.</td></tr>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </tbody>
        </table>
    </div>

    <div class="mt-4"><?php echo e($events->links()); ?></div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($showModal): ?>
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h2 class="mb-4 text-lg font-bold"><?php echo e($editingId ? 'Edit Kegiatan' : 'Tambah Kegiatan'); ?></h2>
                <div class="space-y-3">
                    <div>
                        <label class="mb-1 block text-sm font-medium">Judul</label>
                        <input wire:model="title" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['title'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Deskripsi (opsional)</label>
                        <textarea wire:model="description" rows="2" class="w-full rounded-lg border border-gray-300 px-3 py-2"></textarea>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Tanggal</label>
                        <input wire:model="event_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__errorArgs = ['event_date'];
$__bag = $errors->getBag($__errorArgs[1] ?? 'default');
if ($__bag->has($__errorArgs[0])) :
if (isset($message)) { $__messageOriginal = $message; }
$message = $__bag->first($__errorArgs[0]); ?> <span class="text-xs text-red-600"><?php echo e($message); ?></span> <?php unset($message);
if (isset($__messageOriginal)) { $message = $__messageOriginal; }
endif;
unset($__errorArgs, $__bag); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="mb-1 block text-sm font-medium">Mulai</label>
                            <input wire:model="start_time" type="time" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        </div>
                        <div>
                            <label class="mb-1 block text-sm font-medium">Selesai</label>
                            <input wire:model="end_time" type="time" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        </div>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Lokasi (opsional)</label>
                        <input wire:model="location" type="text" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium">Sasaran Kelas (opsional)</label>
                        <select wire:model="target_class_id" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                            <option value="">Semua kelas</option>
                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__currentLoopData = $classes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $c): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?><option value="<?php echo e($c->id); ?>"><?php echo e($c->name); ?></option><?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </select>
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
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/events/index.blade.php ENDPATH**/ ?>