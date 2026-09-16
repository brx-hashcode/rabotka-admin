import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import {
  updateJobCategory,
  type AdminJobCategory,
} from "#/lib/api/job-categories-controller";
import { friendlyError } from "#/lib/api/friendly-error";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Enter a web address name")
    .regex(/^[a-z0-9-]+$/, "Use only small letters, numbers and dashes (-), no spaces"),
  icon: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type EditCategoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AdminJobCategory;
};

export function EditCategoryModal({
  open,
  onOpenChange,
  category,
}: Readonly<EditCategoryModalProps>) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? "",
      description: category.description ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category.name,
        slug: category.slug,
        icon: category.icon ?? "",
        description: category.description ?? "",
      });
    }
  }, [open, category, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      updateJobCategory(category.id, {
        name: values.name,
        slug: values.slug,
        icon: values.icon || undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Category updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "job-categories"] });
      onOpenChange(false);
    },
    onError: (err: Error) =>
      toast.error(friendlyError(err, "Couldn't update the category. Try again.")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex flex-col gap-5 px-6 py-5">
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem className="w-24 shrink-0">
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="🧹"
                          className="text-center text-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nettoyage" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Web address name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="nettoyage"
                        className="font-mono text-sm"
                      />
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
                    <FormLabel>
                      Description{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Short description of this category"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
