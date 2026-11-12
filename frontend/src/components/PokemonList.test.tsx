import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PokemonList from "@/components/PokemonList";
import { usePokemons } from "@/hooks/usePokemons";
import type { Pokemon } from "@/types/pokemon";

vi.mock("@/hooks/usePokemons", () => ({ usePokemons: vi.fn() }));

const usePokemonsMock = vi.mocked(usePokemons);

function pokemon(name: string): Pokemon {
  return { name, image: null, types: ["normal"], height: 1, weight: 1 };
}

type HookResult = ReturnType<typeof usePokemons>;

function mockHook(overrides: Partial<HookResult> = {}) {
  const result: HookResult = {
    pokemons: [],
    status: "loaded",
    error: null,
    hasMore: false,
    loadMore: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
  usePokemonsMock.mockReturnValue(result);
  return result;
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this);
  }

  intersect() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

describe("PokemonList", () => {
  beforeEach(() => {
    usePokemonsMock.mockReset();
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  it("passes the search query to the data hook", () => {
    mockHook();

    render(<PokemonList query="char" />);

    expect(usePokemonsMock).toHaveBeenCalledWith("char");
  });

  it("shows placeholder cards while the first page loads", () => {
    mockHook({ status: "loading" });

    render(<PokemonList query="" />);

    expect(screen.getAllByTestId("pokemon-skeleton").length).toBeGreaterThan(0);
  });

  it("shows the Pokémon as cards", () => {
    mockHook({ pokemons: [pokemon("bulbasaur"), pokemon("ivysaur")] });

    render(<PokemonList query="" />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Bulbasaur" })).toBeInTheDocument();
  });

  it("tells the user when nothing matches the search", () => {
    mockHook({ pokemons: [] });

    render(<PokemonList query="zzzz" />);

    expect(screen.getByText(/No Pokémon found for/)).toHaveTextContent("zzzz");
  });

  it("shows the error with a retry button when the first page fails", () => {
    const { retry } = mockHook({ status: "error", error: "Unable to fetch data from PokeAPI." });

    render(<PokemonList query="" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to fetch data from PokeAPI.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("keeps the loaded cards visible when a later page fails", () => {
    mockHook({ pokemons: [pokemon("bulbasaur")], status: "error", error: "Boom" });

    render(<PokemonList query="" />);

    expect(screen.getByRole("heading", { name: "Bulbasaur" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
  });

  it("loads the next page when the end of the list scrolls into view", () => {
    const { loadMore } = mockHook({ pokemons: [pokemon("bulbasaur")], hasMore: true });

    render(<PokemonList query="" />);
    act(() => FakeIntersectionObserver.instances.at(-1)?.intersect());

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it("does not watch for scrolling once everything is loaded", () => {
    mockHook({ pokemons: [pokemon("bulbasaur")], hasMore: false });

    render(<PokemonList query="" />);

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(screen.getByText("You have seen them all.")).toBeInTheDocument();
  });
});
