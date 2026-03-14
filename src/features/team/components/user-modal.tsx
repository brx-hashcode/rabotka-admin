import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";

import {
  createAdminUser,
  updateAdminUser,
  type AdminUserListItem,
} from "#/lib/api/users-controller";

import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "#/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "#/components/ui/form";

const userFormSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z
    .string()
    .min(1, "Required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  role: z.string().min(1, "Required"),
});

type UserFormValues = z.infer<typeof userFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: AdminUserListItem | null;
};

export function UserModal({ open, onOpenChange, user }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const isEdit = !!user;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      });
    } else if (!open) {
      form.reset({ firstName: "", lastName: "", email: "", role: "" });
    }
  }, [open, user, form]);

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) => {
      const trimmed = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        role: values.role,
      };
      if (isEdit) {
        return updateAdminUser(user.id, trimmed);
      }
      return createAdminUser(trimmed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      onOpenChange(false);
    },
  });

  function onSubmit(values: UserFormValues) {
    mutation.mutate(values);
  }

  let submitButtonContent;
  if (mutation.isPending) {
    submitButtonContent = (
      <>
        <IconLoader2 className="mr-2 size-4 animate-spin" />
        {isEdit ? "Saving..." : "Creating..."}
      </>
    );
  } else if (isEdit) {
    submitButtonContent = "Save";
  } else {
    submitButtonContent = "Create user";
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create New User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the user's information."
              : "Add a new admin user to the team. They will receive access to the admin panel."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full uppercase">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "ADMIN", label: "Admin" },
                        { value: "SUPER_ADMIN", label: "Super Admin" },
                      ].map((role) => (
                        <SelectItem
                          key={role.value}
                          value={role.value}
                          className="uppercase"
                        >
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mutation.isError && (
              <p className="text-destructive text-sm">
                {(mutation.error as Error)?.message ??
                  `Failed to ${isEdit ? "update" : "create"} user. Please try again.`}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {submitButtonContent}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
