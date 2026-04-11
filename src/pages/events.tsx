import { Plus } from "lucide-react";

import { PageListHeader } from "#/components/page-list-header";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/features/calendar";
import { AddEditEventDialog } from "#/features/calendar/dialogs/add-edit-event-dialog";
import { useRole } from "#/hooks/use-role";

export default function EventsPage() {
  const { canManageContent } = useRole();

  return (
    <div className="space-y-6 pt-6">
      <PageListHeader
        title="HR Events"
        description="Plan and track HR events, assignments and deadlines."
        actions={
          canManageContent ? (
            <AddEditEventDialog>
              <Button>
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </AddEditEventDialog>
          ) : null
        }
      />
      <Calendar />
    </div>
  );
}
