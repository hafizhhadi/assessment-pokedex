<?php

namespace App\Actions\V1\Pokemon;

use App\DTOs\Actions\Pokemon\PokemonDTO;
use App\Services\PokeApiService;

class PokemonAction
{
    /** PokeAPI has ~1,300 Pokémon; this asks for the whole list in one call. */
    private const ALL = 100000;

    public function __construct(private readonly PokeApiService $pokeApi) {}

    /**
     * List a page of Pokémon with their details merged in, optionally filtered by name.
     *
     * @return array<int, PokemonDTO>
     */
    public function index(int $page, int $limit, ?string $search = null): array
    {
        $offset = ($page - 1) * $limit;

        $list = $search === null
            ? $this->pokeApi->list($limit, $offset)
            : array_slice($this->searchNames($search), $offset, $limit);

        $details = $this->pokeApi->details(array_column($list, 'url'));

        return array_map(PokemonDTO::fromPokeApi(...), $details);
    }

    /**
     * PokeAPI cannot search, so filter its full name list ourselves.
     *
     * @return array<int, array{name: string, url: string}>
     */
    private function searchNames(string $search): array
    {
        return array_values(array_filter(
            $this->pokeApi->list(self::ALL, 0),
            fn (array $pokemon) => str_contains($pokemon['name'], strtolower($search)),
        ));
    }
}
