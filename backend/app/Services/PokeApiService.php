<?php

namespace App\Services;

use App\Exceptions\PokeApiException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class PokeApiService
{
    /**
     * Fetch one page of the Pokémon list (name + detail url).
     *
     * @return array<int, array{name: string, url: string}>
     *
     * @throws PokeApiException
     */
    public function list(int $limit, int $offset): array
    {
        try {
            $response = $this->client()->get('pokemon', ['limit' => $limit, 'offset' => $offset]);
        } catch (ConnectionException $e) {
            throw PokeApiException::unavailable($e);
        }

        if ($response->failed()) {
            throw PokeApiException::unavailable();
        }

        return $response->json('results', []);
    }

    /**
     * Fetch the detail payload of every url concurrently, in the same order as $urls.
     *
     * @param  array<int, string>  $urls
     * @return array<int, array<string, mixed>>
     *
     * @throws PokeApiException
     */
    public function details(array $urls): array
    {
        if ($urls === []) {
            return [];
        }

        $responses = Http::pool(fn (Pool $pool) => array_map(
            fn (string $url) => $pool->timeout(config('services.pokeapi.timeout'))->get($url),
            $urls,
        ));

        // Http::pool returns responses in completion order; read them back by request index.
        return array_map(function (int $index) use ($responses) {
            $response = $responses[$index] ?? null;

            if (! $response instanceof Response || $response->failed()) {
                throw PokeApiException::unavailable();
            }

            return $response->json();
        }, array_keys($urls));
    }

    private function client(): PendingRequest
    {
        return Http::baseUrl(config('services.pokeapi.base_url'))
            ->timeout(config('services.pokeapi.timeout'))
            ->acceptJson();
    }
}
