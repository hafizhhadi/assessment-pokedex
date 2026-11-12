<?php

namespace App\DTOs\Actions\Pokemon;

readonly class PokemonDTO
{
    /**
     * @param  array<int, string>  $types
     */
    public function __construct(
        public string $name,
        public ?string $image,
        public array $types,
        public int $height,
        public int $weight,
    ) {}

    /**
     * Build from a PokeAPI pokemon detail payload.
     *
     * @param  array<string, mixed>  $detail
     */
    public static function fromPokeApi(array $detail): self
    {
        return new self(
            name: $detail['name'],
            image: data_get($detail, 'sprites.other.official-artwork.front_default'),
            types: array_column(array_column($detail['types'] ?? [], 'type'), 'name'),
            height: $detail['height'],
            weight: $detail['weight'],
        );
    }
}
