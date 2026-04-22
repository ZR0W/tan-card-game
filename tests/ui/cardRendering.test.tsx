import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CardFace } from "../../src/ui/components/CardFace";

describe("CardFace", () => {
  it("renders card label for accessibility", () => {
    render(<CardFace card={{ rank: "Ace", suit: "Hearts" }} />);
    expect(screen.getByRole("img", { name: /Ace of Hearts/i })).toBeInTheDocument();
  });

  it("applies red/black suit classes", () => {
    const { rerender, container } = render(
      <CardFace card={{ rank: "2", suit: "Hearts" }} />
    );
    expect(container.querySelector(".suit-red")).toBeTruthy();

    rerender(<CardFace card={{ rank: "2", suit: "Spades" }} />);
    expect(container.querySelector(".suit-black")).toBeTruthy();
  });
});
