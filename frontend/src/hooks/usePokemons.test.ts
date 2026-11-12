import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePokemons } from "@/hooks/usePokemons";
import { ApiError, getPokemons } from "@/lib/api";
import { PAGE_SIZE } from "@/lib/constants";
import type { Pokemon } from "@/types/pokemon";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getPokemons: vi.fn(),
}));

const getPokemonsMock = vi.mocked(getPokemons);

function pokemon(name: string): Pokemon {
  return { name, image: null, types: ["normal"], height: 1, weight: 1 };
}

/** A full page of distinct Pokémon, e.g. page 2 -> p2-0 ... p2-19. */
function fullPage(page: number): Pokemon[] {
  return Array.from({ length: PAGE_SIZE }, (_, index) => pokemon(`p${page}-${index}`));
}

describe("usePokemons", () => {
  beforeEach(() => {
    getPokemonsMock.mockReset();
  });

  it("loads the first page on mount", async () => {
    getPokemonsMock.mockResolvedValue(fullPage(1));

    const { result } = renderHook(() => usePokemons(""));

    expect(result.current.status).toBe("loading");
    expect(result.current.pokemons).toEqual([]);

    await waitFor(() => expect(result.current.status).toBe("loaded"));

    expect(result.current.pokemons).toEqual(fullPage(1));
    expect(getPokemonsMock).toHaveBeenCalledTimes(1);
    expect(getPokemonsMock.mock.calls[0][0]).toEqual({ page: 1, limit: PAGE_SIZE, search: "" });
  });

  it("sends the search term to the API", async () => {
    getPokemonsMock.mockResolvedValue([]);

    renderHook(() => usePokemons("char"));

    await waitFor(() => expect(getPokemonsMock).toHaveBeenCalled());
    expect(getPokemonsMock.mock.calls[0][0]).toEqual({ page: 1, limit: PAGE_SIZE, search: "char" });
  });

  it("reports there is more to load only after a full page", async () => {
    getPokemonsMock.mockResolvedValueOnce(fullPage(1));
    const full = renderHook(() => usePokemons(""));
    await waitFor(() => expect(full.result.current.status).toBe("loaded"));
    expect(full.result.current.hasMore).toBe(true);

    getPokemonsMock.mockResolvedValueOnce([pokemon("last")]);
    const partial = renderHook(() => usePokemons(""));
    await waitFor(() => expect(partial.result.current.status).toBe("loaded"));
    expect(partial.result.current.hasMore).toBe(false);
  });

  it("appends the next page when asked to load more", async () => {
    getPokemonsMock.mockResolvedValueOnce(fullPage(1)).mockResolvedValueOnce(fullPage(2));
    const { result } = renderHook(() => usePokemons(""));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.loadMore());
    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    expect(result.current.pokemons).toEqual([...fullPage(1), ...fullPage(2)]);
    expect(getPokemonsMock.mock.calls[1][0]).toEqual({ page: 2, limit: PAGE_SIZE, search: "" });
  });

  it("ignores load more while a request is running or when everything is loaded", async () => {
    getPokemonsMock.mockResolvedValueOnce([pokemon("only")]);
    const { result } = renderHook(() => usePokemons(""));

    // Still loading the first page.
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(getPokemonsMock).toHaveBeenCalledTimes(1);

    // Short page means nothing left to load.
    act(() => result.current.loadMore());
    expect(getPokemonsMock).toHaveBeenCalledTimes(1);
  });

  it("does not show the same Pokémon twice", async () => {
    getPokemonsMock
      .mockResolvedValueOnce(fullPage(1))
      .mockResolvedValueOnce([fullPage(1)[0], pokemon("fresh")]);
    const { result } = renderHook(() => usePokemons(""));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    expect(result.current.pokemons).toHaveLength(PAGE_SIZE + 1);
    expect(result.current.pokemons.at(-1)?.name).toBe("fresh");
  });

  it("exposes the error message and retries the same page", async () => {
    getPokemonsMock
      .mockRejectedValueOnce(new ApiError("Unable to fetch data from PokeAPI.", 502))
      .mockResolvedValueOnce([pokemon("bulbasaur")]);
    const { result } = renderHook(() => usePokemons(""));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Unable to fetch data from PokeAPI.");

    act(() => result.current.retry());
    expect(result.current.status).toBe("loading");
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    expect(result.current.pokemons).toEqual([pokemon("bulbasaur")]);
    expect(getPokemonsMock.mock.calls[1][0]).toMatchObject({ page: 1 });
  });

  it("keeps the loaded Pokémon when a later page fails, and retries that page", async () => {
    getPokemonsMock
      .mockResolvedValueOnce(fullPage(1))
      .mockRejectedValueOnce(new ApiError("Boom", 502))
      .mockResolvedValueOnce(fullPage(2));
    const { result } = renderHook(() => usePokemons(""));
    await waitFor(() => expect(result.current.status).toBe("loaded"));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.pokemons).toEqual(fullPage(1));

    // A failed page must not be retried automatically by load more.
    act(() => result.current.loadMore());
    expect(getPokemonsMock).toHaveBeenCalledTimes(2);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("loaded"));
    expect(result.current.pokemons).toEqual([...fullPage(1), ...fullPage(2)]);
    expect(getPokemonsMock.mock.calls[2][0]).toMatchObject({ page: 2 });
  });

  it("cancels the request when unmounted", () => {
    let signal: AbortSignal | undefined;
    getPokemonsMock.mockImplementation((_query, requestSignal) => {
      signal = requestSignal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => usePokemons(""));
    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});
