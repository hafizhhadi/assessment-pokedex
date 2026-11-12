# Fullstack Pokédex

A Pokédex built on [PokeAPI](https://pokeapi.co/): a **Laravel** API aggregates Pokémon data and a **Next.js** frontend displays it with infinite scroll and search.

```
.
├── backend/    # Laravel API (aggregates PokeAPI)
├── frontend/   # Next.js app (talks only to the Laravel API)
└── README.md
```

## Requirements
- PHP >= 8.3 and Composer
- Node.js >= 20 and npm
- Internet access (the backend calls pokeapi.co)

## Setup

### 1. Backend (http://localhost:8000)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan serve
```

### 2. Frontend (http://localhost:3000)
```bash
cd frontend
npm install
cp .env.example .env.local   # sets NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Start the backend first, then open http://localhost:3000.

### Tests
```bash
cd backend && php artisan test
cd frontend && npm run lint
```

## API documentation

### `GET /api/pokemons`

Returns a page of Pokémon as a JSON array, merged from PokeAPI's list and detail endpoints. Pass `search` to filter by name.

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page`   | integer >= 1 | `1`  | Page number. Offset sent to PokeAPI is `(page - 1) * limit`. |
| `limit`  | integer 1-50 | `20` | Items per page. |
| `search` | string, max 50 | none | Case-insensitive substring match on the Pokémon name (e.g. `char` finds charmander, charizard, ...). Pagination applies to the matches. |

**Example**
```bash
curl "http://localhost:8000/api/pokemons?page=1&limit=2"
curl "http://localhost:8000/api/pokemons?search=char&limit=5"
```

**Response `200`**
```json
[
  {
    "name": "bulbasaur",
    "image": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    "types": ["grass", "poison"],
    "height": 7,
    "weight": 69
  }
]
```
An empty array `[]` means no Pokémon on that page / no name match.

| Field | Type | Source (PokeAPI detail) |
|-------|------|-------------------------|
| `name`   | string        | `name` |
| `image`  | string / null | `sprites.other.official-artwork.front_default` |
| `types`  | string[]      | `types[].type.name` |
| `height` | integer       | `height` (decimetres) |
| `weight` | integer       | `weight` (hectograms) |

**Errors**

| Status | When | Body |
|--------|------|------|
| `422` | invalid `page`, `limit` or `search` | `{ "success": false, "errors": { "limit": ["The limit field must not be greater than 50."] } }` |
| `502` | PokeAPI unreachable or returned an error | `{ "status": "error", "code": 502, "message": "Unable to fetch data from PokeAPI.", "file": "", "line": null, "meta": { "timestamp": "..." }, "data": null }` |

### How it works
1. Without `search`: one call to PokeAPI `pokemon?limit=<limit>&offset=<offset>`.
2. With `search`: the full name list (one call, ~1,300 entries) is fetched and filtered by name, then the requested page is sliced from the matches.
3. The detail URL of every Pokémon on the page is fetched concurrently (`Http::pool`) and merged into the shape above.

### Configuration (`backend/.env`)
| Variable | Default | Purpose |
|----------|---------|---------|
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | PokeAPI base URL |
| `POKEAPI_TIMEOUT` | `10` | HTTP timeout in seconds |
