import { DashboardLayout } from "#/features/dashboard";

export default function TeamPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
            <h1 className="text-2xl font-semibold">Team</h1>
            <p className="text-muted-foreground">Coming soon.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
