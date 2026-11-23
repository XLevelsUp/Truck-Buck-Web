import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Accordion, AccordionItem } from "./accordion";
import { Button } from "./button";
import { Combobox, type ComboboxOption } from "./combobox";
import { addDaysToKey } from "./date-picker";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./dialog";
import { Field } from "./field";
import { Input } from "./input";
import { Logo } from "./logo";
import { PhoneInput, toNationalDigits } from "./phone-input";
import { PriceBreakdown, PriceBreakdownRow } from "./price-breakdown";
import { SegmentedControl } from "./segmented-control";
import { StatusTimeline } from "./status-timeline";
import { Stepper } from "./stepper";
import { McvIcon } from "./truck-icons";

describe("Button", () => {
  it("renders the child element when asChild is set, keeping link semantics", () => {
    render(
      <Button asChild variant="cta">
        <a href="/bookings">View bookings</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "View bookings" });
    expect(link).toHaveAttribute("href", "/bookings");
    expect(link).toHaveClass("bg-accent");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps its accessible name while loading and swallows clicks", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Get price
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Get price" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Next</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});

describe("Field", () => {
  it("wires label, hint and error to the control", () => {
    render(
      <Field label="Company name" hint="As on your GST certificate" error="Enter your company name">
        {(control) => <Input {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Company name" });
    expect(input).toBeInvalid();
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription("As on your GST certificate Enter your company name");
  });

  it("marks optional fields instead of required ones", () => {
    render(
      <Field label="Email" optional>
        {(control) => <Input type="email" {...control} />}
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Email (optional)" });
    expect(input).not.toBeRequired();
  });
});

describe("PhoneInput", () => {
  it.each([
    ["+91 98765 43210", "9876543210"],
    ["09876543210", "9876543210"],
    ["98765-43210", "9876543210"],
    ["98765432109999", "9876543210"],
  ])("normalises %s to national digits", (input, expected) => {
    expect(toNationalDigits(input)).toBe(expected);
  });

  it("formats as the user types and reports E.164 once valid", async () => {
    const onValueChange = vi.fn();
    render(<PhoneInput aria-label="Mobile number" onValueChange={onValueChange} />);
    const input = screen.getByRole("textbox", { name: "Mobile number" });
    expect(input).toHaveAttribute("inputmode", "numeric");
    await userEvent.type(input, "9876543210");
    expect(input).toHaveValue("98765 43210");
    expect(onValueChange).toHaveBeenLastCalledWith({
      national: "9876543210",
      e164: "+919876543210",
    });
  });
});

describe("Combobox", () => {
  const cities: ComboboxOption[] = [
    { value: "chennai", label: "Chennai" },
    { value: "coimbatore", label: "Coimbatore" },
    { value: "bengaluru", label: "Bengaluru" },
  ];

  function Harness() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <form aria-label="Route">
        <Combobox
          aria-label="From"
          options={cities}
          value={value}
          onValueChange={setValue}
          name="from"
        />
        <span data-testid="value">{value ?? ""}</span>
      </form>
    );
  }

  it("filters, selects with the keyboard and submits the value", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "From" });

    await user.type(input, "c");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      expect.stringContaining("coimbatore") as string,
    );

    await user.keyboard("{Enter}");
    expect(input).toHaveValue("Coimbatore");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("value")).toHaveTextContent("coimbatore");
    expect(document.querySelector('input[type="hidden"][name="from"]')).toHaveValue("coimbatore");
  });

  it("reverts free text that wasn't picked from the list", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "From" });
    await user.type(input, "Mumbai");
    expect(screen.getByRole("status")).toHaveTextContent("0 results available");
    await user.tab();
    expect(input).toHaveValue("");
  });
});

describe("SegmentedControl", () => {
  it("is a radio group navigable with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <SegmentedControl
        aria-label="Trip type"
        defaultValue="one-way"
        options={[
          { value: "one-way", label: "One-way" },
          { value: "return", label: "Return" },
        ]}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Trip type" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: "One-way" }));
    await user.keyboard("{ArrowRight}");
    const next = screen.getByRole("radio", { name: "Return" });
    expect(next).toHaveFocus();
    await user.keyboard(" ");
    expect(next).toBeChecked();
  });
});

describe("Accordion", () => {
  it("uses native details so answers are in the HTML and work without JS", async () => {
    render(
      <Accordion>
        <AccordionItem title="Do you serve my route?">Answer text</AccordionItem>
      </Accordion>,
    );
    const heading = screen.getByRole("heading", { level: 3, name: "Do you serve my route?" });
    const details = heading.closest("details");
    expect(details).not.toHaveAttribute("open");
    await userEvent.click(heading);
    expect(details).toHaveAttribute("open");
  });
});

describe("Stepper and StatusTimeline", () => {
  it("marks the current step", () => {
    render(<Stepper steps={["Contact", "Fleet", "Done"]} current={1} />);
    const current = screen.getByRole("listitem", { current: "step" });
    expect(current).toHaveTextContent("Step 2 of 3: Fleet");
  });

  it("marks the current trip status and completed ones", () => {
    render(<StatusTimeline current="in_transit" />);
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("In transit");
    expect(screen.getAllByText("Completed")).toHaveLength(3);
  });
});

describe("PriceBreakdownRow", () => {
  it("formats paise with Indian grouping and marks discounts", () => {
    render(
      <PriceBreakdown>
        <PriceBreakdownRow label="Base fare" amountPaise={12345600} />
        <PriceBreakdownRow label="First-trip offer" amountPaise={50000} kind="discount" />
        <PriceBreakdownRow label="Tolls" valueText="At actuals" />
      </PriceBreakdown>,
    );
    expect(screen.getByText("₹1,23,456")).toBeInTheDocument();
    expect(screen.getByText("− ₹500")).toBeInTheDocument();
    expect(screen.getByText("At actuals")).toBeInTheDocument();
  });
});

describe("brand", () => {
  it("names the logo for screen readers unless told it is decorative", () => {
    const { rerender } = render(<Logo />);
    expect(screen.getByRole("img", { name: "TruckBuck" })).toBeInTheDocument();
    rerender(<Logo title="" />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("truck icons are decorative by default and nameable when meaningful", () => {
    const { rerender, container } = render(<McvIcon />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<McvIcon title="19–22 ft truck" />);
    expect(screen.getByRole("img", { name: "19–22 ft truck" })).toBeInTheDocument();
  });
});

describe("addDaysToKey", () => {
  it("crosses month and year boundaries", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2028-02-28", 1)).toBe("2028-02-29");
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
