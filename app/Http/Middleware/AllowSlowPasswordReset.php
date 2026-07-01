<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowSlowPasswordReset
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('reset-password') && $request->isMethod('post') && function_exists('set_time_limit')) {
            @set_time_limit(120);
        }

        return $next($request);
    }
}
