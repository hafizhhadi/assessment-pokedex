import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, getPokemons } from "@/lib/api";

const bulbasaur = {
  name: "bulbasaur",
  image: "https://img.test/1.png",
  types: ["grass", "poison"],
  height: 7,
  weight: 69,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("getPokemons", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("requests the page and limit from the Laravel API and returns the array", async () => {
    fetchMock.mockResolvedValue(jsonResponse([bulbasaur]));

    const result = await getPokemons({ page: 2, limit: 20 });

    expect(result).toEqual([bulbasaur]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/pokemons?page=2&limit=20");
  });

  it("adds the search term only when it is not empty", async () => {
    // A Response body can only be read once, so return a fresh one per call.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse([])));

    await getPokemons({ page: 1, limit: 20, search: "char" });
    await getPokemons({ page: 1, limit: 20, search: "" });

    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/pokemons?page=1&limit=20&search=char");
    expect(fetchMock.mock.calls[1][0]).toBe("http://api.test/api/pokemons?page=1&limit=20");
  });

  it("forwards the abort signal so stale requests can be cancelled", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const controller = new AbortController();

    await getPokemons({ page: 1, limit: 20 }, controller.signal);

    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it("throws an ApiError with the server message when PokeAPI is down (502)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: "error", code: 502, message: "Unable to fetch data from PokeAPI." }, 502),
    );

    await expect(getPokemons({ page: 1, limit: 20 })).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      message: "Unable to fetch data from PokeAPI.",
    });
  });

  it("uses the first validation message for a 422", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: false, errors: { limit: ["The limit field must not be greater than 50."] } }, 422),
    );

    await expect(getPokemons({ page: 1, limit: 99 })).rejects.toMatchObject({
      status: 422,
      message: "The limit field must not be greater than 50.",
    });
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>oops</html>", { status: 500 }));

    const error = await getPokemons({ page: 1, limit: 20 }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe("Something went wrong (500).");
  });

  it("explains when the backend cannot be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(getPokemons({ page: 1, limit: 20 })).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      message: "Unable to reach the server. Is the backend running?",
    });
  });

  it("lets an aborted request through untouched so callers can ignore it", async () => {
    fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    await expect(getPokemons({ page: 1, limit: 20 })).rejects.toMatchObject({ name: "AbortError" });
  });
});
