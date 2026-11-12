import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StaticBanner from "@/components/StaticBanner";

describe("StaticBanner", () => {
  it("shows its image immediately because it is above the fold", () => {
    render(<StaticBanner src="/placeholders/banner-1.svg" alt="Static banner 1" />);

    expect(screen.getByAltText("Static banner 1")).toHaveAttribute("loading", "eager");
  });
});
