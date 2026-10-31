import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";

describe("Button", () => {
  it("renders the child element when asChild is set, keeping link semantics", () => {
    render(
      <Button asChild variant="accent">
        <a href="/bookings">View bookings</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "View bookings" });
    expect(link).toHaveAttribute("href", "/bookings");
    expect(link).toHaveClass("bg-accent");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("Dialog", () => {
  it("opens as an accessible modal and closes with Escape, restoring focus", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Cancel booking</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>The transporter will be notified.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole("button", { name: "Cancel booking" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Cancel this booking?" });
    expect(dialog).toHaveAccessibleDescription("The transporter will be notified.");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
