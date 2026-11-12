<?php

namespace App\Http\Resources;

use App\DTOs\Actions\Pokemon\PokemonDTO;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PokemonResource extends JsonResource
{
    /**
     * @mixin PokemonDTO
     *
     * @return array{name: string, image: ?string, types: array<int, string>, height: int, weight: int}
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'image' => $this->image,
            'types' => $this->types,
            'height' => $this->height,
            'weight' => $this->weight,
        ];
    }
}
