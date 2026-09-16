import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Input } from "#/components/ui/input";
import { Textarea } from "#/components/ui/textarea";
import { ReasonTemplatePicker } from "#/components/reason-template-picker";
import { appendReason } from "#/lib/reason-templates";
import { Button } from "#/components/ui/button";
import { ProfileCombobox } from "#/components/profile-combobox";
import { getApplicationsList } from "#/lib/api/applications-controller";
import { createPenalty } from "#/lib/api/penalties-controller";
import type { AdminProfileListItem } from "#/lib/api/profiles-controller";
import { friendlyError } from "#/lib/api/friendly-error";

const schema = z.object({
  applicationId: z.string().optional(),
  amount: z.coerce.number().int().min(1, "Montant requis (min 1 FCFA)"),
  reason: z.string().min(3, "Raison requise"),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePenaltyDialog({ open, onOpenChange }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] =
    useState<AdminProfileListItem | null>(null);

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { applicationId: "", amount: 0, reason: "" },
  });

  const isEmployer = selectedProfile?.profileType === "EMPLOYER";

  const applicationsQuery = useQuery({
    queryKey: ["admin", "applications", "picker", selectedProfile?.id, isEmployer],
    queryFn: () =>
      getApplicationsList({
        ...(isEmployer
          ? { employer_id: selectedProfile!.id }
          : { worker_id: selectedProfile!.id }),
        limit: 50,
      }).then((r) => r.data),
    enabled: open && selectedProfile != null,
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createPenalty({
        profileId: selectedProfile!.id,
        applicationId: values.applicationId || undefined,
        amount: values.amount,
        reason: values.reason,
      }),
    onSuccess: () => {
      toast.success("Pénalité créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin", "penalties"] });
      handleClose();
    },
    onError: (err: Error) => {
      toast.error(friendlyError(err, "Couldn't create the penalty. Try again."));
    },
  });

  function handleClose() {
    onOpenChange(false);
    setSelectedProfile(null);
    form.reset({ applicationId: "", amount: 0, reason: "" });
  }

  function handleProfileChange(profile: AdminProfileListItem | null) {
    setSelectedProfile(profile);
    form.setValue("applicationId", "");
  }

  const applications = applicationsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une pénalité</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <ProfileCombobox
              value={selectedProfile}
              onChange={handleProfileChange}
              label="Profil"
            />

            <FormField
              control={form.control}
              name="applicationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission <span className="text-muted-foreground text-xs">(optionnel)</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedProfile || applicationsQuery.isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <span className="truncate">
                          <SelectValue
                            placeholder={
                              !selectedProfile
                                ? "Sélectionnez un profil d'abord"
                                : applicationsQuery.isLoading
                                  ? "Chargement…"
                                  : "Aucune mission liée (optionnel)"
                            }
                          />
                        </span>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {applications.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.jobTitle}{" "}
                          <span className="text-muted-foreground text-xs">
                            · {a.status}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant (FCFA)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Raison</FormLabel>
                    {/* Appends rather than replaces, so an admin can stack two
                        snippets or add a detail after picking one. */}
                    <ReasonTemplatePicker
                      scope="PENALTY"
                      onPick={(body) =>
                        field.onChange(appendReason(field.value, body))
                      }
                    />
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Absence non justifiée au poste."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={!selectedProfile || mutation.isPending}>
                {mutation.isPending ? "Création…" : "Créer la pénalité"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
