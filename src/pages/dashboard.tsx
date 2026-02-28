import type { z } from "zod";

import { documentsData } from "#/content/dashboard";
import {
  ChartAreaInteractive,
  DataTable,
  SectionCards,
  schema,
} from "#/features/dashboard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={documentsData as z.infer<typeof schema>[]} />
    </div>
  );
}
