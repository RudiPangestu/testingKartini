<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Masuk — SIPRES Kartini</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="grid min-h-screen place-items-center bg-gray-100 p-4">
    <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div class="mb-6 text-center">
            <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-emerald-700 text-lg font-bold text-white">SK</div>
            <h1 class="text-xl font-bold">SIPRES Kartini</h1>
            <p class="text-sm text-gray-500">Sistem Presensi &amp; Kegiatan Sekolah</p>
        </div>

        <?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if BLOCK]><![endif]--><?php endif; ?><?php if($errors->any()): ?>
            <div class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <?php echo e($errors->first()); ?>

            </div>
        <?php endif; ?><?php if(\Livewire\Mechanisms\ExtendBlade\ExtendBlade::isRenderingLivewireComponent()): ?><!--[if ENDBLOCK]><![endif]--><?php endif; ?>

        <form method="POST" action="/login" class="space-y-4">
            <?php echo csrf_field(); ?>
            <div>
                <label class="mb-1 block text-sm font-medium">Email</label>
                <input type="email" name="email" value="<?php echo e(old('email')); ?>" required autofocus
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none">
            </div>
            <div>
                <label class="mb-1 block text-sm font-medium">Password</label>
                <input type="password" name="password" required
                       class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-emerald-500 focus:outline-none">
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" name="remember" value="1"> Ingat saya
            </label>
            <button type="submit"
                    class="w-full rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
                Masuk
            </button>
        </form>
    </div>
</body>
</html>
<?php /**PATH /Users/rudipangestu/Downloads/claudecode/kartini/testingKartini/laravel/resources/views/auth/login.blade.php ENDPATH**/ ?>