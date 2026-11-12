<?php

namespace Tests\Feature;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PokemonIndexTest extends TestCase
{
    private function fakePokeApi(int $count = 2, int $offset = 0): void
    {
        $results = [];
        $fakes = [];

        $details = [
            1 => ['name' => 'bulbasaur', 'types' => ['grass', 'poison'], 'height' => 7, 'weight' => 69],
            2 => ['name' => 'ivysaur', 'types' => ['grass', 'poison'], 'height' => 10, 'weight' => 130],
            3 => ['name' => 'venusaur', 'types' => ['grass', 'poison'], 'height' => 20, 'weight' => 1000],
        ];

        foreach (array_slice($details, $offset, $count, true) as $id => $detail) {
            $url = "https://pokeapi.co/api/v2/pokemon/{$id}/";
            $results[] = ['name' => $detail['name'], 'url' => $url];
            $fakes[$url] = Http::response([
                'name' => $detail['name'],
                'height' => $detail['height'],
                'weight' => $detail['weight'],
                'types' => array_map(
                    fn (string $type, int $slot) => ['slot' => $slot + 1, 'type' => ['name' => $type]],
                    $detail['types'],
                    array_keys($detail['types']),
                ),
                'sprites' => ['other' => ['official-artwork' => [
                    'front_default' => "https://img.test/official-artwork/{$id}.png",
                ]]],
            ]);
        }

        Http::fake($fakes + [
            'https://pokeapi.co/api/v2/pokemon?*' => Http::response(['results' => $results]),
        ]);
    }

    public function test_it_returns_merged_pokemon_list_in_the_specified_shape(): void
    {
        $this->fakePokeApi();

        $response = $this->getJson('/api/v1/pokemons?page=1&limit=2');

        $response->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Pokemon list retrieved successfully')
            ->assertJsonStructure(['status', 'message', 'meta' => ['timestamp'], 'data'])
            ->assertJsonPath('data', [
                [
                    'name' => 'bulbasaur',
                    'image' => 'https://img.test/official-artwork/1.png',
                    'types' => ['grass', 'poison'],
                    'height' => 7,
                    'weight' => 69,
                ],
                [
                    'name' => 'ivysaur',
                    'image' => 'https://img.test/official-artwork/2.png',
                    'types' => ['grass', 'poison'],
                    'height' => 10,
                    'weight' => 130,
                ],
            ]);
    }

    public function test_it_calculates_the_offset_from_page_and_limit(): void
    {
        $this->fakePokeApi(count: 1, offset: 2);

        $this->getJson('/api/v1/pokemons?page=2&limit=2')->assertOk();

        Http::assertSent(fn (Request $request) => $request->url() === 'https://pokeapi.co/api/v2/pokemon?limit=2&offset=2');
    }

    public function test_it_defaults_to_page_one_with_twenty_items(): void
    {
        $this->fakePokeApi(count: 0);

        $this->getJson('/api/v1/pokemons')->assertOk()->assertJsonPath('data', []);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://pokeapi.co/api/v2/pokemon?limit=20&offset=0');
    }

    public function test_it_serves_a_repeated_page_from_cache_without_calling_pokeapi_again(): void
    {
        $this->fakePokeApi();

        $first = $this->getJson('/api/v1/pokemons?page=1&limit=2')->assertOk()->json('data');
        Http::assertSentCount(3); // 1 list + 2 details

        $second = $this->getJson('/api/v1/pokemons?page=1&limit=2')->assertOk()->json('data');

        $this->assertSame($first, $second);
        Http::assertSentCount(3);
    }

    #[DataProvider('invalidQueries')]
    public function test_it_rejects_invalid_pagination(string $query, string $field): void
    {
        Http::fake();

        $this->getJson("/api/v1/pokemons?{$query}")
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
        ];
    }

    public function test_it_returns_502_with_a_message_when_pokeapi_is_down(): void
    {
        Http::fake(['https://pokeapi.co/*' => Http::response('boom', 500)]);

        $this->getJson('/api/v1/pokemons?page=1&limit=2')
            ->assertStatus(502)
            ->assertJson(['status' => 'error', 'code' => 502, 'message' => 'Unable to fetch data from PokeAPI.']);
    }

    public function test_it_returns_502_when_a_detail_request_fails(): void
    {
        Http::fake([
            'https://pokeapi.co/api/v2/pokemon?*' => Http::response([
                'results' => [['name' => 'bulbasaur', 'url' => 'https://pokeapi.co/api/v2/pokemon/1/']],
            ]),
            'https://pokeapi.co/api/v2/pokemon/1/' => Http::response('boom', 500),
        ]);

        $this->getJson('/api/v1/pokemons?page=1&limit=1')
            ->assertStatus(502)
            ->assertJson(['status' => 'error', 'code' => 502, 'message' => 'Unable to fetch data from PokeAPI.']);
    }
}
