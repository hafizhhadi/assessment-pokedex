import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SearchBar from "@/components/SearchBar";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function type(value: string) {
    fireEvent.change(screen.getByRole("searchbox"), { target: { value } });
  }

  it("searches after the user stops typing", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("cha");
    type("char");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1));
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("char");
  });

  it("searches immediately, trimmed, when the form is submitted", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    type("  pika ");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith("pika");

    // The pending debounce must not search the same term a second time.
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("does not search on mount or when the trimmed term did not change", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    type("   ");
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS));

    expect(onSearch).not.toHaveBeenCalled();
  });
});
