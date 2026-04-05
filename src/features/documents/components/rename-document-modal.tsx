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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import { Input } from "#/components/ui/input";
import { Button } from "#/components/ui/button";
import {
  updateDocument,
  DOCUMENT_CATEGORY_LABELS,
  type AdminDocumentItem,
  type DocumentCategory,
} from "#/lib/api/documents-controller";

const CATEGORIES = Object.entries(DOCUMENT_CATEGORY_LABELS) as [DocumentCategory, string][];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["AGREEMENT", "CONTRACT", "POLICY", "INVOICE", "REPORT", "OTHER"] as const),
});

type FormValues = z.infer<typeof schema>;

type RenameDocumentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: AdminDocumentItem;
};

export function RenameDocumentModal({
  open,
  onOpenChange,
  document,
}: Readonly<RenameDocumentModalProps>) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: document.title, category: document.category },
  });

  useEffect(() => {
    if (open) {
      form.reset({ title: document.title, category: document.category });
    }
  }, [open, document.title, document.category, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      updateDocument(document.id, { title: values.title, category: values.category }),
    onSuccess: () => {
      toast.success("Document updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "documents"] });
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to update document"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Rename Document</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutate(v))}>
            <div className="flex flex-col gap-5 px-6 py-5">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
