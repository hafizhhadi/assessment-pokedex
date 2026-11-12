"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPokemons } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";
import type { Pokemon } from "@/types/pokemon";

export type PokemonsStatus = "loading" | "loaded" | "error";

/** Appends `incoming` to `current`, skipping Pokémon that are already listed. */
function appendUnique(current: Pokemon[], incoming: Pokemon[]): Pokemon[] {
  const seen = new Set(current.map((pokemon) => pokemon.name));
  return [...current, ...incoming.filter((pokemon) => !seen.has(pokemon.name))];
}

/**
 * Loads Pokémon page by page for one search term.
 *
 * The first page loads on mount. To change the search term, render the component
 * that uses this hook with a new `key` so all state starts fresh.
 */
export function usePokemons(search: string) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [status, setStatus] = useState<PokemonsStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const nextPage = useRef(1);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);

  /** Fetches `nextPage`. Callers set the visible status first (an effect must not set state synchronously). */
  const fetchNextPage = useCallback(() => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;

    const request = new AbortController();
    controller.current = request;
    const page = nextPage.current;

    getPokemons({ page, limit: PAGE_SIZE, search }, request.signal)
      .then((incoming) => {
        nextPage.current = page + 1;
        setPokemons((current) => appendUnique(current, incoming));
        setHasMore(incoming.length === PAGE_SIZE);
        setStatus("loaded");
      })
      .catch((failure: unknown) => {
        if (request.signal.aborted) {
          return;
        }
        setError(failure instanceof Error ? failure.message : "Something went wrong.");
        setStatus("error");
      })
      .finally(() => {
        if (controller.current === request) {
          inFlight.current = false;
        }
      });
  }, [search]);

  useEffect(() => {
    fetchNextPage();

    return () => {
      controller.current?.abort();
      inFlight.current = false;
    };
  }, [fetchNextPage]);

  const loadMore = useCallback(() => {
    if (status !== "loaded" || !hasMore) {
      return;
    }
    setStatus("loading");
    fetchNextPage();
  }, [status, hasMore, fetchNextPage]);

  const retry = useCallback(() => {
    if (status !== "error") {
      return;
    }
    setError(null);
    setStatus("loading");
    fetchNextPage();
  }, [status, fetchNextPage]);

  return { pokemons, status, error, hasMore, loadMore, retry };
}
