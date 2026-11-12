# Fullstack Pokédex

A Pokédex built on [PokeAPI](https://pokeapi.co/): a **Laravel** API aggregates Pokémon data and a **Next.js** frontend displays it with infinite scroll and search.

```
.
├── backend/    # Laravel API (aggregates PokeAPI)
├── frontend/   # Next.js app (talks only to the Laravel API)
├── AI_USAGE.md # AI prompts and thought process
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

Returns a page of Pokémon, merged from PokeAPI's list and detail endpoints.

| Query param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page`  | integer >= 1 | `1`  | Page number. Offset sent to PokeAPI is `(page - 1) * limit`. |
| `limit` | integer 1–50 | `20` | Items per page. |

**Example**
```bash
curl "http://localhost:8000/api/pokemons?page=1&limit=2"
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

| Field | Type | Source (PokeAPI detail) |
|-------|------|-------------------------|
| `name`   | string   | `name` |
| `image`  | string   | `sprites.other.official-artwork.front_default` |
| `types`  | string[] | `types[].type.name` |
| `height` | integer  | `height` (decimetres) |
| `weight` | integer  | `weight` (hectograms) |

**Errors**: `422` invalid `page`/`limit`; `502` PokeAPI unavailable. Error body: `{ "message": "..." }`.

> Status: backend endpoint implemented and tested (`php artisan test`). Responses are cached per `page`/`limit` for `POKEAPI_CACHE_TTL` seconds (default 3600).
