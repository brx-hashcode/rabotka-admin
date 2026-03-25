import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronsUpDown, SearchIcon } from "lucide-react";
import { cn } from "#/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { Button } from "#/components/ui/button";
import { createClaim } from "#/lib/api/claims-controller";
import { getProfilesList, type AdminProfileListItem } from "#/lib/api/profiles-controller";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof schema>;

type ProfilePickerProps = {
  value: AdminProfileListItem | null;
  onChange: (profile: AdminProfileListItem) => void;
};

function ProfilePicker({ value, onChange }: Readonly<ProfilePickerProps>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["admin", "profiles", "claim-search", search],
    queryFn: () => getProfilesList({ q: search, limit: 8 }).then((r) => r.data),
    enabled: search.trim().length >= 1,
    staleTime: 10_000,
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? `${value.firstName} ${value.lastName}` : "Search by name, email or phone…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
        <DropdownMenuLabel className="font-normal p-0">
          <div className="flex items-center gap-1.5 rounded-md px-2 py-1.5">
            <SearchIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
            <Input
              placeholder="Search profiles…"
              className="placeholder:text-muted-foreground h-7 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {search.trim().length === 0 && (
          <p className="text-muted-foreground px-3 py-4 text-center text-sm">
            Type to search profiles.
          </p>
        )}
        {search.trim().length > 0 && results.length === 0 && (
          <p className="text-muted-foreground px-3 py-4 text-center text-sm">
            No profiles found.
          </p>
        )}
        {search.trim().length > 0 && results.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            className="flex cursor-pointer items-center gap-2 py-1.5 pl-2 pr-2"
            onSelect={() => {
              onChange(profile);
              setOpen(false);
              setSearch("");
            }}
          >
            <Check
              className={cn(
                "h-4 w-4 shrink-0",
                value?.id === profile.id ? "opacity-100" : "opacity-0",
              )}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {profile.firstName} {profile.lastName}
              </span>
              <span className="text-muted-foreground text-xs">
                {profile.email} · {profile.phone}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type CreateClaimModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateClaimModal({ open, onOpenChange }: Readonly<CreateClaimModalProps>) {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState<AdminProfileListItem | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!selectedProfile) throw new Error("Please select a profile");
      return createClaim({
        title: values.title,
        description: values.description,
        profile_id: selectedProfile.id,
      });
    },
    onSuccess: () => {
      toast.success("Claim created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      handleClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create claim");
    },
  });

  function handleClose() {
    onOpenChange(false);
    form.reset();
    setSelectedProfile(null);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Create Claim</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex flex-col gap-5 px-6 py-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Profile</span>
                <ProfilePicker value={selectedProfile} onChange={setSelectedProfile} />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Claim title…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the claim…" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !selectedProfile}>
                {isPending ? "Creating…" : "Create claim"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
