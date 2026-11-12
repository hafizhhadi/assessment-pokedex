"use client";

import { useState } from "react";
import PokemonList from "@/components/PokemonList";
import SearchBar from "@/components/SearchBar";

/** The centre column: a search bar that stays on screen above the Pokémon list. */
export default function PokemonExplorer() {
  const [query, setQuery] = useState("");

  return (
    <section aria-label="Pokémon">
      <div className="sticky top-0 z-10 bg-background py-3">
        <SearchBar onSearch={setQuery} />
      </div>

      {/* A new key remounts the list, which resets pagination for the new search. */}
      <PokemonList key={query} query={query} />
    </section>
  );
}
