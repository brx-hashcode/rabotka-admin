import { IconLock } from "@tabler/icons-react";
import { Card, CardContent } from "#/components/ui/card";

/**
 * What a MODERATOR sees where the thread would be.
 *
 * Not an empty pane, not a 403 toast, not a redirect: a statement. The second
 * sentence is the point of the whole two-tier design — the counters above
 * usually answer the question, so being refused the bodies is rarely being
 * refused the answer.
 */
export function ThreadLockedCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <div className="bg-muted rounded-full p-4">
          <IconLock className="text-muted-foreground size-6" aria-hidden />
        </div>
        <p className="font-medium">Reading messages requires a Manager account</p>
        <p className="text-muted-foreground max-w-md text-sm">
          The counters above show how much was withheld from this conversation,
          in which categories, and whether anyone contested it — without opening
          what the two of them said to each other.
        </p>
      </CardContent>
    </Card>
  );
}
