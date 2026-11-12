import type { Pokemon, PokemonQuery } from "@/types/pokemon";

const DEFAULT_API_URL = "http://localhost:8000";

/** A failed call to our Laravel API. `status` is 0 when the server could not be reached. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Reads the human-readable message out of an error response:
 * 502 -> `{ message }`, 422 -> `{ errors: { field: [message] } }`.
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: { message?: unknown; errors?: Record<string, string[]> } = await response.json();

    if (typeof body.message === "string") {
      return body.message;
    }

    const firstValidationError = Object.values(body.errors ?? {})[0]?.[0];
    if (firstValidationError) {
      return firstValidationError;
    }
  } catch {
    // Body was not JSON; use the generic message below.
  }

  return `Something went wrong (${response.status}).`;
}

/**
 * Fetches one page of Pokémon from `GET /api/pokemons`.
 * This is the only place the frontend talks to the network.
 */
export async function getPokemons(
  { page, limit, search }: PokemonQuery,
  signal?: AbortSignal,
): Promise<Pokemon[]> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) {
    params.set("search", search);
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/pokemons?${params}`, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("Unable to reach the server. Is the backend running?", 0);
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return response.json();
}
