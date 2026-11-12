<?php

namespace App\Actions;

use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Base class for domain Actions: the place for business logic and orchestration.
 */
class Actionable
{
    /**
     * Cache the callback result for the configured PokeAPI TTL (seconds).
     */
    protected static function remember(string $key, Closure $callback): mixed
    {
        return Cache::remember($key, config('services.pokeapi.cache_ttl'), $callback);
    }
}
