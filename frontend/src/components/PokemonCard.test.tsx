import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PokemonCard from "@/components/PokemonCard";
import type { Pokemon } from "@/types/pokemon";

const ivysaur: Pokemon = {
  name: "ivysaur",
  image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png",
  types: ["grass", "poison"],
  height: 10,
  weight: 130,
};

describe("PokemonCard", () => {
  it("shows the capitalised name and one badge per type", () => {
    render(<PokemonCard pokemon={ivysaur} />);

    expect(screen.getByRole("heading", { name: "Ivysaur" })).toBeInTheDocument();
    expect(screen.getByText("grass")).toBeInTheDocument();
    expect(screen.getByText("poison")).toBeInTheDocument();
  });

  it("shows the artwork with the name as alt text", () => {
    render(<PokemonCard pokemon={ivysaur} />);

    expect(screen.getByAltText("Ivysaur")).toBeInTheDocument();
  });

  it("shows a placeholder instead of an image when there is no artwork", () => {
    render(<PokemonCard pokemon={{ ...ivysaur, image: null }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ivysaur" })).toBeInTheDocument();
  });

  it("loads the artwork lazily by default", () => {
    render(<PokemonCard pokemon={ivysaur} />);

    expect(screen.getByAltText("Ivysaur")).toHaveAttribute("loading", "lazy");
  });

  it("loads the artwork immediately when the card is above the fold", () => {
    render(<PokemonCard pokemon={ivysaur} eager />);

    expect(screen.getByAltText("Ivysaur")).toHaveAttribute("loading", "eager");
  });
});
