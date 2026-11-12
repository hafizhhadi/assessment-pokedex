# Fullstack Pokédex

A Pokédex built on [PokeAPI](https://pokeapi.co/): a **Laravel** API aggregates Pokémon data and a **Next.js** frontend displays it with infinite scroll and search.

```
.
├── backend/    # Laravel API (aggregates PokeAPI)
├── frontend/   # Next.js app (talks only to the Laravel API)
└── README.md
```

## Features
- Carousel banner (3 slides, auto-rotating) with two static banners.
- Pokémon cards (artwork, name, type badges) in a 3-column grid with infinite scroll.
- Search by name (type to search, or press Enter / the Search button).
- While scrolling, the banners scroll away; the side images and the search bar stay fixed.
- The frontend only calls the Laravel API, never PokeAPI directly.

## Requirements
- PHP >= 8.4.1 and Composer (Laravel 13; its locked Symfony 8 dependencies need 8.4.1, so PHP 8.3 will not work)
- Node.js >= 20.19 and npm (the app itself needs 20.9; the test tooling needs 20.19)
- Internet access (the backend calls pokeapi.co)

## Setup

You need **two terminals**, one for the backend and one for the frontend. **Both must be running**, because the frontend gets all its data from the backend.

### Terminal 1: backend (API on http://localhost:8000)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan serve
```
No database is needed (the `DB_*`, session and cache lines in `.env.example` are unused). Leave this running.
Check it works: open http://localhost:8000/api/pokemons?limit=2 and you should see JSON.

### Terminal 2: frontend (app on http://localhost:3000)
```bash
cd frontend
npm install
npm run dev
```
`npm run dev` needs no build step. To run the production build instead: `npm run build`, then `npm start`.
Optional: `cp .env.example .env.local` to set `NEXT_PUBLIC_API_URL` (the default is already `http://localhost:8000`).

### Open the app
Go to **http://localhost:3000** on the same computer that runs both servers. You should see the carousel, banners, search bar and Pokémon cards.

### If something looks wrong
| Symptom | Fix |
|---------|-----|
| The page loads but there are no cards, or it says "Unable to reach the server" | The backend is not running. Start Terminal 1 and click "Try again" (or refresh). |
| It works on `localhost` but not from a phone or another computer (e.g. `http://192.168.x.x:3000`) | The frontend calls the API at `localhost:8000`, which on another device means that device. Use `http://localhost:3000` on the same computer. |
| `npm start` says there is no production build | Run `npm run build` first, or use `npm run dev`. |
| Port 8000 or 3000 is already in use | Use another port, e.g. `php artisan serve --port=8001`, and set `NEXT_PUBLIC_API_URL=http://localhost:8001` in `frontend/.env.local`, then restart (rebuild if you use `npm start`). |

### Tests
```bash
cd backend && php artisan test
cd frontend && npm test && npm run lint
```

## API documentation

**Base URL (local):** `http://localhost:8000`. All responses are JSON. There is no authentication, and CORS is open to any origin, so the Next.js app on `http://localhost:3000` can call the API directly.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/pokemons` | List Pokémon (paginated, optional name search) |
| `GET` | `/up` | Health check, returns `200` while the app is running |

### `GET /api/pokemons`

Returns a page of Pokémon as a JSON array, merged from PokeAPI's list and detail endpoints.

**Query parameters** (all optional)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page`   | integer >= 1   | `1`  | Page number. The offset sent to PokeAPI is `(page - 1) * limit`. |
| `limit`  | integer 1-50   | `20` | Items per page. |
| `search` | string, max 50 | none | Case-insensitive substring match on the Pokémon name. Pagination applies to the matches. |

**Examples**
```bash
curl "http://localhost:8000/api/pokemons"                          # page 1, 20 items
curl "http://localhost:8000/api/pokemons?page=2&limit=10"          # items 11-20
curl "http://localhost:8000/api/pokemons?search=char&limit=5"      # charmander, charmeleon, ...
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
| `name`   | string        | `name` |
| `image`  | string / null | `sprites.other.official-artwork.front_default`; `null` when there is no artwork |
| `types`  | string[]      | `types[].type.name` |
| `height` | integer       | `height` (decimetres) |
| `weight` | integer       | `weight` (hectograms) |

**Notes**
- **Pagination:** no total count is returned. A page with fewer than `limit` items is the last page, and a page past the end returns `[]`.
- **Order:** PokeAPI order (Pokédex number); alternate forms such as `charizard-mega-x` come after the base species.
- **Search** matches the API name, so alternate forms are included: `search=pikachu` returns `pikachu`, `pikachu-rock-star`, `pikachu-libre`, ... `[]` means nothing matched.
- **Image:** the assessment's sample JSON shows the small sprite (`sprites/pokemon/2.png`), but its text says to use `sprites.other.official-artwork.front_default`, so the official artwork is returned.

### Errors

| Status | When | Body |
|--------|------|------|
| `422` | invalid `page`, `limit` or `search` | `{ "success": false, "errors": { "limit": ["The limit field must not be greater than 50."] } }` |
| `502` | PokeAPI unreachable or returned an error | `{ "status": "error", "code": 502, "message": "Unable to fetch data from PokeAPI.", "file": "", "line": null, "meta": { "timestamp": "..." }, "data": null }` |
| `404` | unknown route | `{ "message": "The route api/nope could not be found." }` |
| `405` | method other than `GET` | `{ "message": "The POST method is not supported for route api/pokemons. Supported methods: GET, HEAD." }` |

`422` example (every invalid field is listed):
```bash
curl "http://localhost:8000/api/pokemons?page=0&limit=99"
# {"success":false,"errors":{"page":["The page field must be at least 1."],"limit":["The limit field must not be greater than 50."]}}
```
With `APP_DEBUG=true` (the `.env.example` default, for local development) Laravel adds `exception`, `file` and `trace` fields to `404` / `405` bodies; set `APP_DEBUG=false` in production.

### How it works
1. Without `search`: one call to PokeAPI `pokemon?limit=<limit>&offset=<offset>`.
2. With `search`: the full name list (one call, ~1,300 entries) is fetched and filtered by name, then the requested page is sliced from the matches.
3. The detail URL of every Pokémon on the page is fetched concurrently (`Http::pool`) and merged into the shape above.

### Configuration (`backend/.env`)
| Variable | Default | Purpose |
|----------|---------|---------|
| `POKEAPI_BASE_URL` | `https://pokeapi.co/api/v2` | PokeAPI base URL |
| `POKEAPI_TIMEOUT` | `10` | HTTP timeout in seconds |
