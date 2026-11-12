import { describe, expect, it } from "vitest";
import { formatName } from "@/lib/format";

describe("formatName", () => {
  it("capitalises a plain name", () => {
    expect(formatName("ivysaur")).toBe("Ivysaur");
  });

  it("turns PokeAPI hyphens into spaces and capitalises each word", () => {
    expect(formatName("mr-mime")).toBe("Mr Mime");
    expect(formatName("ho-oh")).toBe("Ho Oh");
  });
});
