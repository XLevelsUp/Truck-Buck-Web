// Validate env before anything else renders: a bad config fails loudly.
import "./env";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";

import { AppProviders } from "./app/providers";
import { createAppRouter } from "./app/router";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element in index.html");

const router = createAppRouter();

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
