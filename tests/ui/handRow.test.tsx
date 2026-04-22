import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HandRow } from "../../src/ui/components/HandRow";

const cards = [
  { rank: "Ace", suit: "Spades" },
  { rank: "10", suit: "Hearts" },
] as const;

describe("HandRow", () => {
  it("renders face-up cards by default", () => {
    render(<HandRow cards={[...cards]} />);
    expect(screen.getByRole("img", { name: /Ace of Spades/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /10 of Hearts/i })).toBeInTheDocument();
  });

  it("renders card backs when faceDown", () => {
    render(<HandRow cards={[...cards]} faceDown />);
    const backs = screen.getAllByRole("img", { name: /Face-down card/i });
    expect(backs).toHaveLength(2);
  });
});
