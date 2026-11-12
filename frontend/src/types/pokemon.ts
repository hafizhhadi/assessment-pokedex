/** One Pokémon as returned by `GET /api/pokemons`. */
export type Pokemon = {
  name: string;
  /** Official artwork URL; `null` when PokeAPI has none. */
  image: string | null;
  types: string[];
  /** Decimetres. */
  height: number;
  /** Hectograms. */
  weight: number;
};

export type PokemonQuery = {
  page: number;
  limit: number;
  /** Case-insensitive name filter. Leave empty for no filter. */
  search?: string;
};
