import type { z } from "zod"

import { documentsData } from "#/content/dashboard"
import {
  ChartAreaInteractive,
  DataTable,
  DashboardLayout,
  SectionCards,
  schema,
} from "#/features/dashboard"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable
              data={documentsData as z.infer<typeof schema>[]}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
