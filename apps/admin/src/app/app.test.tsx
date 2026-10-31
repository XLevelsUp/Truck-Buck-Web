import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { MockAuthProvider } from "@/auth/mock-auth-provider";

import { AppProviders } from "./providers";
import { routes } from "./router";

function renderApp(initialPath: string) {
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  render(
    <AppProviders authProvider={new MockAuthProvider(sessionStorage)}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

describe("admin app", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("guards protected routes and returns the user there after sign-in", async () => {
    const user = userEvent.setup();
    const router = renderApp("/bookings?status=disputed");

    // Unauthenticated: redirected to the login page.
    expect(
      await screen.findByRole("heading", { name: "Sign in to TruckBuck Admin" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");

    // Client-side validation runs before the auth provider is called.
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "ops@truckbuck.in");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    // Lands on the originally requested page, inside the shell, with a tenant selected.
    expect(await screen.findByRole("heading", { name: "Bookings" })).toBeInTheDocument();
    expect(router.state.location.pathname + router.state.location.search).toBe(
      "/bookings?status=disputed",
    );
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tenant")).toHaveValue("tenant_demo");
  });
});
