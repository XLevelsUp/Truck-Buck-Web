import { PageHeader } from "@/components/page-header";
import { useTenant } from "@/tenant/tenant-context";

export function DashboardPage() {
  const { clientId } = useTenant();
  return (
    <PageHeader
      title="Dashboard"
      description={
        <>
          Overview for tenant <code className="font-mono">{clientId}</code>.
        </>
      }
    />
  );
}
