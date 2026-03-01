import { Button } from "#/components/ui/button";

export function ProfileAction() {
  return (
    <Button
      size="sm"
      onClick={() => {
        // Placeholder for the example; can open modal or navigate later
        alert("Add Profile");
      }}
    >
      Add Profile
    </Button>
  );
}
