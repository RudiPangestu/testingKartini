<div>
    <div class="mb-6 border-b border-gray-200 pb-5">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Agenda</h1>
        <p class="text-sm text-gray-500">Kegiatan & agenda sekolah</p>
    </div>

    <div class="space-y-3">
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $events; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $e): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
            <div class="rounded-xl border border-gray-200 bg-white p-4" wire:key="ev-<?php echo e($e->id); ?>">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="font-medium"><?php echo e($e->title); ?></div>
                        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($e->description): ?><p class="mt-1 text-sm text-gray-600"><?php echo e($e->description); ?></p><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        <p class="mt-1 text-xs text-gray-400">
                            <?php echo e($e->event_date?->format('d/m/Y')); ?> · <?php echo e($e->start_time); ?>–<?php echo e($e->end_time); ?>

                            <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($e->location): ?> · <?php echo e($e->location); ?><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
                        </p>
                    </div>
                    <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"><?php echo e($e->targetClass?->name ?? 'Umum'); ?></span>
                </div>
            </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
            <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada agenda.</div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>

    <div class="mt-4"><?php echo e($events->links()); ?></div>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/family/agenda.blade.php ENDPATH**/ ?>