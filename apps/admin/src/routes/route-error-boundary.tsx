import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { Button } from "@truckbuck/ui/button";

/** Catches render/loader errors anywhere below the root route. */
export function RouteErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const detail = isRouteErrorResponse(error)
    ? String(error.data)
    : error instanceof Error
      ? error.message
      : null;

  if (!isRouteErrorResponse(error)) console.error(error);

  return (
    <div role="alert" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {import.meta.env.DEV && detail ? (
        <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{detail}</pre>
      ) : (
        <p className="text-muted-foreground">
          Please try again. If it keeps happening, contact support.
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <Button asChild variant="outline">
          <Link to="/">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
