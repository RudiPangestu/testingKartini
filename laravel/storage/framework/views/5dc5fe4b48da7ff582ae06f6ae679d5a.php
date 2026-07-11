<div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">Notifikasi</h1>
            <p class="text-sm text-gray-500">Pemberitahuan untuk akun Anda</p>
        </div>
        <button wire:click="markAllRead" class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">Tandai semua dibaca</button>
    </div>

    <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if(session('ok')): ?><div class="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><?php echo e(session('ok')); ?></div><?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

    <div class="space-y-2">
        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php $__empty_1 = true; $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $n): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
            <div wire:key="n-<?php echo e($n->id); ?>"
                 class="flex items-start justify-between gap-3 rounded-xl border p-4 <?php echo e($n->is_read ? 'border-gray-200 bg-white' : 'border-emerald-200 bg-emerald-50/40'); ?>">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] uppercase text-gray-500"><?php echo e($n->type->value); ?></span>
                        <span class="font-medium"><?php echo e($n->title); ?></span>
                    </div>
                    <p class="mt-1 text-sm text-gray-600"><?php echo e($n->body); ?></p>
                    <p class="mt-1 text-xs text-gray-400"><?php echo e($n->sent_at?->format('d/m/Y H:i')); ?></p>
                </div>
                <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if (! ($n->is_read)): ?>
                    <button wire:click="markRead('<?php echo e($n->id); ?>')" class="shrink-0 text-xs text-emerald-700 hover:underline">Tandai dibaca</button>
                <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
            </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
            <div class="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-400">Belum ada notifikasi.</div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>
    </div>

    <div class="mt-4"><?php echo e($items->links()); ?></div>
</div>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/livewire/notifications/index.blade.php ENDPATH**/ ?>