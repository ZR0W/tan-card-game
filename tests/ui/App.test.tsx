import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../src/ui/App";

describe("App", () => {
  it("renders board and hands from engine state", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /Tan/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Table/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Player 0 \(you\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Player 1 \(hot-seat\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Legal moves/i)).toBeInTheDocument();
  });

  it("applies a move when a legal move button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Attack 6 Hearts/i }));
    expect(screen.getByText(/Phase: defender_respond/i)).toBeInTheDocument();
  });
});
