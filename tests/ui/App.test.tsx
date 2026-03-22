import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../../src/ui/App";

describe("App", () => {
  it("renders board and hands from engine state", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Tan/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Player 0 \(you\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Player 1 \(opponent\)/i)).toBeInTheDocument();
  });
});
