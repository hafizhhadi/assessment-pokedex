<?php

namespace App\Actions\V1\Pokemon;

use App\Actions\Actionable;
use App\DTOs\Actions\Pokemon\PokemonDTO;
use App\Services\PokeApiService;

class PokemonAction extends Actionable
{
    public function __construct(private readonly PokeApiService $pokeApi) {}

    /**
     * List a page of Pokémon with their details merged in.
     *
     * @return array<int, PokemonDTO>
     */
    public function index(int $page, int $limit): array
    {
        return static::remember("pokemons.page.{$page}.limit.{$limit}", function () use ($page, $limit) {
            $offset = ($page - 1) * $limit;

            $list = $this->pokeApi->list($limit, $offset);

            $details = $this->pokeApi->details(array_column($list, 'url'));

            return array_map(PokemonDTO::fromPokeApi(...), $details);
        });
    }
}
