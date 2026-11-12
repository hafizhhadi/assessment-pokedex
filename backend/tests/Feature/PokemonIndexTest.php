<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PokemonIndexTest extends TestCase
{
    private const CATALOG = [
        1 => ['name' => 'bulbasaur', 'types' => ['grass', 'poison'], 'height' => 7, 'weight' => 69],
        2 => ['name' => 'ivysaur', 'types' => ['grass', 'poison'], 'height' => 10, 'weight' => 130],
        3 => ['name' => 'venusaur', 'types' => ['grass', 'poison'], 'height' => 20, 'weight' => 1000],
        4 => ['name' => 'charmander', 'types' => ['fire'], 'height' => 6, 'weight' => 85],
        5 => ['name' => 'charmeleon', 'types' => ['fire'], 'height' => 11, 'weight' => 190],
        6 => ['name' => 'charizard', 'types' => ['fire', 'flying'], 'height' => 17, 'weight' => 905],
    ];

    private function detailUrl(int $id): string
    {
        return "https://pokeapi.co/api/v2/pokemon/{$id}/";
    }

    private function expected(int $id): array
    {
        $pokemon = self::CATALOG[$id];

        return [
            'name' => $pokemon['name'],
            'image' => "https://img.test/official-artwork/{$id}.png",
            'types' => $pokemon['types'],
            'height' => $pokemon['height'],
            'weight' => $pokemon['weight'],
        ];
    }

    /**
     * Fake PokeAPI: a paginated list endpoint plus one detail endpoint per Pokémon.
     */
    private function fakePokeApi(): void
    {
        $fakes = [];
        $entries = [];

        foreach (self::CATALOG as $id => $pokemon) {
            $entries[] = ['name' => $pokemon['name'], 'url' => $this->detailUrl($id)];

            $fakes[$this->detailUrl($id)] = Http::response([
                'name' => $pokemon['name'],
                'height' => $pokemon['height'],
                'weight' => $pokemon['weight'],
                'types' => array_map(
                    fn (string $type, int $slot) => ['slot' => $slot + 1, 'type' => ['name' => $type]],
                    $pokemon['types'],
                    array_keys($pokemon['types']),
                ),
                'sprites' => ['other' => ['official-artwork' => [
                    'front_default' => "https://img.test/official-artwork/{$id}.png",
                ]]],
            ]);
        }

        $fakes['https://pokeapi.co/api/v2/pokemon?*'] = function (Request $request) use ($entries) {
            parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

            return Http::response([
                'results' => array_slice($entries, (int) $query['offset'], (int) $query['limit']),
            ]);
        };

        Http::fake($fakes);
    }

    // ------------------------------------------------------------------ list

    public function test_it_returns_a_bare_array_of_pokemon_in_the_specified_shape(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?page=1&limit=2')
            ->assertOk()
            ->assertExactJson([$this->expected(1), $this->expected(2)]);
    }

    public function test_it_calculates_the_offset_from_page_and_limit(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?page=2&limit=2')
            ->assertOk()
            ->assertExactJson([$this->expected(3), $this->expected(4)]);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://pokeapi.co/api/v2/pokemon?limit=2&offset=2');
    }

    public function test_it_defaults_to_page_one_with_twenty_items(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons')->assertOk()->assertJsonCount(6);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://pokeapi.co/api/v2/pokemon?limit=20&offset=0');
    }

    #[DataProvider('invalidQueries')]
    public function test_it_rejects_invalid_query_parameters(string $query, string $field): void
    {
        Http::fake();

        $this->getJson("/api/pokemons?{$query}")
            ->assertStatus(422)
            ->assertJsonStructure(['success', 'errors'])
            ->assertJsonValidationErrors($field);

        Http::assertNothingSent();
    }

    public static function invalidQueries(): array
    {
        return [
            'page zero' => ['page=0', 'page'],
            'page not a number' => ['page=abc', 'page'],
            'limit zero' => ['limit=0', 'limit'],
            'limit above max' => ['limit=51', 'limit'],
            'search too long' => ['search='.str_repeat('a', 51), 'search'],
        ];
    }

    public function test_it_returns_502_with_a_message_when_pokeapi_is_down(): void
    {
        Http::fake(['https://pokeapi.co/*' => Http::response('boom', 500)]);

        $this->getJson('/api/pokemons?page=1&limit=2')
            ->assertStatus(502)
            ->assertJson(['status' => 'error', 'code' => 502, 'message' => 'Unable to fetch data from PokeAPI.']);
    }

    public function test_it_returns_502_when_a_detail_request_fails(): void
    {
        Http::fake([
            'https://pokeapi.co/api/v2/pokemon?*' => Http::response([
                'results' => [['name' => 'bulbasaur', 'url' => $this->detailUrl(1)]],
            ]),
            $this->detailUrl(1) => Http::response('boom', 500),
        ]);

        $this->getJson('/api/pokemons?page=1&limit=1')
            ->assertStatus(502)
            ->assertJson(['status' => 'error', 'code' => 502, 'message' => 'Unable to fetch data from PokeAPI.']);
    }

    // ---------------------------------------------------------------- search

    public function test_it_filters_by_name_using_the_full_pokemon_list(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?search=char&limit=10')
            ->assertOk()
            ->assertExactJson([$this->expected(4), $this->expected(5), $this->expected(6)]);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0');
        Http::assertNotSent(fn (Request $request) => $request->url() === $this->detailUrl(1));
    }

    public function test_search_ignores_case(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?search=CHARI')
            ->assertOk()
            ->assertExactJson([$this->expected(6)]);
    }

    public function test_search_results_are_paginated(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?search=char&page=2&limit=2')
            ->assertOk()
            ->assertExactJson([$this->expected(6)]);
    }

    public function test_a_blank_search_behaves_like_no_search(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?search=%20%20&limit=2')
            ->assertOk()
            ->assertExactJson([$this->expected(1), $this->expected(2)]);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://pokeapi.co/api/v2/pokemon?limit=2&offset=0');
    }

    public function test_search_with_no_match_returns_an_empty_array(): void
    {
        $this->fakePokeApi();

        $this->getJson('/api/pokemons?search=missingno')->assertOk()->assertExactJson([]);
    }
}
