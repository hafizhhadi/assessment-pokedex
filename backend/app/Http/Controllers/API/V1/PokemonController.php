<?php

namespace App\Http\Controllers\API\V1;

use App\Actions\V1\Pokemon\PokemonAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Pokemon\PokemonIndexRequest;
use App\Http\Resources\PokemonResource;
use Illuminate\Http\JsonResponse;

class PokemonController extends Controller
{
    public function index(PokemonIndexRequest $request, PokemonAction $action): JsonResponse
    {
        $pokemons = $action->index($request->page(), $request->limit());

        return $this->success(
            message: 'Pokemon list retrieved successfully',
            data: PokemonResource::collection($pokemons),
        );
    }
}
