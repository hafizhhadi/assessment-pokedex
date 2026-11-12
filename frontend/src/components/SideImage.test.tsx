import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SideImage from "@/components/SideImage";

describe("SideImage", () => {
  it("shows its image immediately because it is visible without scrolling", () => {
    render(<SideImage src="/placeholders/side-left.svg" alt="Static image (left)" />);

    expect(screen.getByAltText("Static image (left)")).toHaveAttribute("loading", "eager");
  });
});
