"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

/**
 * Search box. Searches shortly after the user stops typing, or immediately on
 * Enter / the Search button. Only reports a term that differs from the last one.
 */
export default function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");
  const lastSearched = useRef("");

  const search = useCallback(
    (query: string) => {
      if (query === lastSearched.current) {
        return;
      }
      lastSearched.current = query;
      onSearch(query);
    },
    [onSearch],
  );

  useEffect(() => {
    const timer = setTimeout(() => search(value.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, search]);

  return (
    <form
      role="search"
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        search(value.trim());
      }}
    >
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Pokemon Name"
        aria-label="Pokémon name"
        className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2 outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      <button
        type="submit"
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-95"
      >
        Search
      </button>
    </form>
  );
}
