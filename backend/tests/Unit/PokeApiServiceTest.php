<?php

namespace Tests\Unit;

use App\Exceptions\PokeApiException;
use App\Services\PokeApiService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PokeApiServiceTest extends TestCase
{
    public function test_list_returns_the_results_of_the_requested_page(): void
    {
        Http::fake([
            'https://pokeapi.co/api/v2/pokemon?*' => Http::response([
                'results' => [['name' => 'bulbasaur', 'url' => 'https://pokeapi.co/api/v2/pokemon/1/']],
            ]),
        ]);

        $this->assertSame(
            [['name' => 'bulbasaur', 'url' => 'https://pokeapi.co/api/v2/pokemon/1/']],
            (new PokeApiService)->list(limit: 1, offset: 0),
        );
    }

    public function test_list_throws_when_pokeapi_cannot_be_reached(): void
    {
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $this->expectException(PokeApiException::class);

        (new PokeApiService)->list(limit: 1, offset: 0);
    }

    public function test_list_throws_when_pokeapi_returns_an_error(): void
    {
        Http::fake(['*' => Http::response('boom', 500)]);

        $this->expectException(PokeApiException::class);

        (new PokeApiService)->list(limit: 1, offset: 0);
    }

    public function test_details_makes_no_request_for_an_empty_url_list(): void
    {
        Http::fake();

        $this->assertSame([], (new PokeApiService)->details([]));

        Http::assertNothingSent();
    }

    public function test_details_returns_payloads_in_the_same_order_as_the_urls(): void
    {
        Http::fake([
            'https://pokeapi.co/api/v2/pokemon/2/' => Http::response(['name' => 'ivysaur']),
            'https://pokeapi.co/api/v2/pokemon/1/' => Http::response(['name' => 'bulbasaur']),
        ]);

        $details = (new PokeApiService)->details([
            'https://pokeapi.co/api/v2/pokemon/2/',
            'https://pokeapi.co/api/v2/pokemon/1/',
        ]);

        $this->assertSame(['ivysaur', 'bulbasaur'], array_column($details, 'name'));
    }

    public function test_details_throws_when_any_request_fails(): void
    {
        Http::fake([
            'https://pokeapi.co/api/v2/pokemon/1/' => Http::response(['name' => 'bulbasaur']),
            'https://pokeapi.co/api/v2/pokemon/2/' => Http::response('boom', 500),
        ]);

        $this->expectException(PokeApiException::class);

        (new PokeApiService)->details([
            'https://pokeapi.co/api/v2/pokemon/1/',
            'https://pokeapi.co/api/v2/pokemon/2/',
        ]);
    }
}
