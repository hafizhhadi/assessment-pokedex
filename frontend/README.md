# Frontend (Next.js)

The Pokédex UI. It only talks to the Laravel API (`NEXT_PUBLIC_API_URL`), never to PokeAPI directly.

Setup, run instructions and API docs are in the [root README](../README.md).

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                  # http://localhost:3000
npm test                     # unit + component tests (Vitest)
npm run lint
npm run build
```

Code layout: `src/app` (page), `src/components` (UI), `src/hooks` (`usePokemons`, `useInView`), `src/lib` (API client, helpers), `src/types`.
