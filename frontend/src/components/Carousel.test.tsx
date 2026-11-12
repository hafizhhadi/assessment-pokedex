import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Carousel from "@/components/Carousel";

const slides = [
  { src: "/placeholders/carousel-1.svg", alt: "First slide" },
  { src: "/placeholders/carousel-2.svg", alt: "Second slide" },
  { src: "/placeholders/carousel-3.svg", alt: "Third slide" },
];

function activeDot() {
  return screen.getAllByRole("button").find((dot) => dot.getAttribute("aria-current") === "true");
}

describe("Carousel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts on the first slide with one dot per slide", () => {
    render(<Carousel slides={slides} />);

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(activeDot()).toHaveAccessibleName("Show slide 1");
  });

  it("loads only the first slide immediately", () => {
    render(<Carousel slides={slides} />);

    const loading = screen.getAllByAltText(/slide/).map((image) => image.getAttribute("loading"));
    expect(loading).toEqual(["eager", "lazy", "lazy"]);
  });

  it("rotates automatically and wraps around to the first slide", () => {
    render(<Carousel slides={slides} intervalMs={1000} />);

    act(() => vi.advanceTimersByTime(1000));
    expect(activeDot()).toHaveAccessibleName("Show slide 2");

    act(() => vi.advanceTimersByTime(1000));
    expect(activeDot()).toHaveAccessibleName("Show slide 3");

    act(() => vi.advanceTimersByTime(1000));
    expect(activeDot()).toHaveAccessibleName("Show slide 1");
  });

  it("jumps to a slide when its dot is clicked", () => {
    render(<Carousel slides={slides} intervalMs={1000} />);

    fireEvent.click(screen.getByRole("button", { name: "Show slide 3" }));

    expect(activeDot()).toHaveAccessibleName("Show slide 3");
  });

  it("stops rotating while the pointer is over it", () => {
    render(<Carousel slides={slides} intervalMs={1000} />);

    fireEvent.mouseEnter(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(5000));
    expect(activeDot()).toHaveAccessibleName("Show slide 1");

    fireEvent.mouseLeave(screen.getByRole("region"));
    act(() => vi.advanceTimersByTime(1000));
    expect(activeDot()).toHaveAccessibleName("Show slide 2");
  });
});
