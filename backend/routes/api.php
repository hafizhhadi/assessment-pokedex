<?php

use App\Http\Controllers\API\V1\PokemonController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('pokemons', [PokemonController::class, 'index']);
});
