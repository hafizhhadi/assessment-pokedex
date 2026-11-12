<?php

namespace Tests\Unit;

use App\DTOs\Actions\Pokemon\PokemonDTO;
use PHPUnit\Framework\TestCase;

class PokemonDTOTest extends TestCase
{
    public function test_it_maps_a_pokeapi_detail_payload(): void
    {
        $dto = PokemonDTO::fromPokeApi([
            'name' => 'ivysaur',
            'height' => 10,
            'weight' => 130,
            'types' => [
                ['slot' => 1, 'type' => ['name' => 'grass']],
                ['slot' => 2, 'type' => ['name' => 'poison']],
            ],
            'sprites' => [
                'front_default' => 'https://img.test/small.png',
                'other' => ['official-artwork' => ['front_default' => 'https://img.test/artwork.png']],
            ],
        ]);

        $this->assertSame('ivysaur', $dto->name);
        $this->assertSame('https://img.test/artwork.png', $dto->image);
        $this->assertSame(['grass', 'poison'], $dto->types);
        $this->assertSame(10, $dto->height);
        $this->assertSame(130, $dto->weight);
    }

    public function test_image_is_null_when_there_is_no_official_artwork(): void
    {
        $dto = PokemonDTO::fromPokeApi([
            'name' => 'missingno',
            'height' => 1,
            'weight' => 1,
            'types' => [],
            'sprites' => ['front_default' => 'https://img.test/small.png'],
        ]);

        $this->assertNull($dto->image);
    }

    public function test_types_default_to_an_empty_list_when_missing(): void
    {
        $dto = PokemonDTO::fromPokeApi(['name' => 'missingno', 'height' => 1, 'weight' => 1]);

        $this->assertSame([], $dto->types);
    }
}
