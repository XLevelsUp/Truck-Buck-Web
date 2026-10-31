import { Link } from "react-router";

import { Button } from "@truckbuck/ui/button";

import { PageHeader } from "@/components/page-header";

export function NotFoundPage() {
  return (
    <div>
      <PageHeader title="Page not found" description="This page does not exist or has moved." />
      <Button asChild variant="outline">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
