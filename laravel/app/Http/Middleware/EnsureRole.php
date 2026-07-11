<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RBAC: batasi akses rute berdasarkan peran pengguna.
 * Contoh: ->middleware('role:ADMIN,GURU')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role->value, $roles, true)) {
            abort(403, 'Akses ditolak untuk peran Anda.');
        }

        return $next($request);
    }
}
