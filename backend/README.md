# Backend (Laravel)

JSON API that aggregates [PokeAPI](https://pokeapi.co/) for the Pokédex frontend.

Setup, run instructions and API documentation are in the [root README](../README.md).

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan serve        # http://localhost:8000
php artisan test
```
