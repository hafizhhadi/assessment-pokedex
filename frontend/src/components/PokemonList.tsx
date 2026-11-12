"use client";

import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import PokemonCard from "@/components/PokemonCard";
import PokemonCardSkeleton from "@/components/PokemonCardSkeleton";
import { useInView } from "@/hooks/useInView";
import { usePokemons } from "@/hooks/usePokemons";

const SKELETON_COUNT = 6;

/** The card grid for one search term. Render with a new `key` when the term changes. */
export default function PokemonList({ query }: { query: string }) {
  const { pokemons, status, error, hasMore, loadMore, retry } = usePokemons(query);

  // Infinite scroll: an invisible marker after the grid asks for the next page when it comes into view.
  const endRef = useInView<HTMLDivElement>(loadMore, status === "loaded" && hasMore);

  const isLoading = status === "loading";

  return (
    <div aria-busy={isLoading}>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {pokemons.map((pokemon) => (
          <PokemonCard key={pokemon.name} pokemon={pokemon} />
        ))}
        {isLoading &&
          Array.from({ length: SKELETON_COUNT }, (_, index) => <PokemonCardSkeleton key={index} />)}
      </ul>

      {status === "loaded" && pokemons.length === 0 && <EmptyState query={query} />}
      {status === "error" && <ErrorState message={error ?? "Something went wrong."} onRetry={retry} />}

      <div ref={endRef} aria-hidden className="h-px" />

      {status === "loaded" && !hasMore && pokemons.length > 0 && (
        <p className="py-6 text-center text-sm text-slate-400">You have seen them all.</p>
      )}
    </div>
  );
}
